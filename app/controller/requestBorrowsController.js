import mongoose from "mongoose";
import User from "../models/user.js";
import Book from "../models/book.js";
import RequestBorrows, {
  validateRequestBorrow,
} from "../models/requestedBorrows.js";
import _ from "lodash";
import BorrowBook from "../models/borrowBook.js";
import logger from "../utils/logging.js";

export async function getRequestBorrows(req) {
  if (req.params.id) {
    const requestBorrow = await RequestBorrows.findById(req.params.id);
    if (!requestBorrow)
      return {
        status: 404,
        body: "The Requested Borrows with the given id was not found",
      };
    if (req.user.role === "student") {
      if (requestBorrow.student._id === req.user._id)
        return { status: 200, body: requestBorrow };
      else return { status: 400, body: "This request was not made by You" };
    } else return { status: 200, body: requestBorrow };
  } else {
    if (req.user.role !== "student") {
      const requestBorrow = await RequestBorrows.find();
      return { status: 200, body: requestBorrow };
    } else {
      const requestBorrow = await RequestBorrows.find({
        "student._id": req.user._id,
      });
      return { status: 200, body: requestBorrow };
    }
  }
}

export async function getRequestExist(req) {
  return await RequestBorrows.findOne({
    "book._id": req.query.bookId,
    "student._id": req.user._id,
  });
}

export async function createRequestBorrow(req) {
  const { error } = validateRequestBorrow(req.body);
  if (error) return { status: 400, body: error.details[0].message };

  const student = await User.findById(req.user._id);
  if (!student) return { status: 404, body: "Invalid Student" };

  const book = await Book.findById(req.body.bookId);
  if (!book) return { status: 404, body: "Invalid Book." };

  if (book.numberInStock === 0)
    return { status: 400, body: "Book not in Stock" };

  const BorrowsExist = await BorrowBook.findOne({
    "student._id": req.user._id,
    "book._id": req.body.bookId,
  });

  const requestBorrowsExist = await RequestBorrows.findOne({
    "student._id": req.user._id,
    "book._id": req.body.bookId,
  });

  if (BorrowsExist || requestBorrowsExist)
    return { status: 422, body: "This book Already requested By this Student" };

  let borrowQuantity = await RequestBorrows.countDocuments({
    "student._id": req.body.studentId,
  });
  if (borrowQuantity > 5)
    return { status: 400, body: "The limit has been completed" };

  let requestBorrowBook = new RequestBorrows({
    student: _.pick(student, ["_id", "name", "phone", "imageURL", "studentId"]),
    book: _.pick(book, ["_id", "name", "autherName", "imageURL", "bookId"]),
  });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    requestBorrowBook = await requestBorrowBook.save({ session });

    student.requestBorrows++;
    await student.save({ session });

    book.numberInStock--;
    book.reservedNumber++;
    await book.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { status: 201, body: requestBorrowBook };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    return { status: 500, body: "Internal Issue.." };
  }
}

export async function updeteRequestBorrow(id) {
  const requestBorrow = await RequestBorrows.findById(id);
  if (!requestBorrow)
    return { status: 404, body: "The request with given Id was not found" };

  if (requestBorrow.isApproved === true)
    return { status: 400, body: "This request is already approved" };

  const book = await Book.findById(requestBorrow.book._id);
  const student = await User.findById(requestBorrow.student._id);

  if (!book || !student)
    return {
      status: 400,
      body: "Related Student or Book does not Exist",
    };

  let borrowBook = new BorrowBook({
    student: _.pick(student, ["_id", "name", "phone", "imageURL", "studentId"]),
    book: _.pick(book, ["_id", "name", "autherName", "imageURL", "bookId"]),
  });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    requestBorrow.isApproved = true;
    let result = await requestBorrow.save({ session });

    await borrowBook.save({ session });

    book.reservedNumber--;
    book.returnableBooks++;
    await book.save({ session });

    student.requestBorrows--;
    student.returnableBooks++;
    await student.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { status: 201, body: result };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error(error);
    return { status: 500, body: "Internal server issue, Please try agian !" };
  }
}

export async function deleteRequestBorrow(id) {
  const deleteRequestBorrow = await RequestBorrows.findById(id);

  if (!deleteRequestBorrow)
    return { status: 404, body: "The Request with given id was not found" };

  if (deleteRequestBorrow.isApproved === true)
    return {
      status: 400,
      body: "this request is already approved you cannot decline it",
    };

  let result = await deleteRequestBorrow.deleteOne({ new: true });

  return { status: 200, body: result };
}
