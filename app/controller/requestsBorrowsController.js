import mongoose from "mongoose";
import User from "../models/user.js";
import Book from "../models/book.js";
import RequestsBorrows, {
  validateRequestBorrow,
} from "../models/requestsBorrows.js";
import _ from "lodash";
import logger from "../utils/logging.js";

export async function getRequests(req) {
  if (req.params.id) {
    const requestBorrow = await RequestsBorrows.findById(req.params.id);
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
      const requestBorrow = await RequestsBorrows.find().sort({
        isApproved: 1,
      });
      return { status: 200, body: requestBorrow };
    } else {
      const requestBorrow = await RequestsBorrows.find({
        "student._id": req.user._id,
      }).sort({ isApproved: 1 });
      return { status: 200, body: requestBorrow };
    }
  }
}

export async function getBorrows(req) {
  if (req.params.id) {
    let borrow = await RequestsBorrows.findById(req.params.id);
    if (!borrow)
      return { status: 404, body: "The book with give ID was not found." };

    if (req.user.role === "student") {
      if (borrow.student._id === req.user._id)
        return { status: 200, body: borrow };
      else return { status: 400, body: "This book was not borrowed by You" };
    } else return { status: 200, body: borrow };
  } else {
    if (req.user.role !== "student") {
      return await RequestsBorrows.find({ isReturned: false }).sort(
        "book.name"
      );
    } else {
      return await RequestsBorrows.find({
        "student._id": req.user._id,
        isReturned: false,
      }).sort("book.name");
    }
  }
}

export async function createRequest(req) {
  const { error } = validateRequestBorrow(req.body);
  if (error) return { status: 400, body: error.details[0].message };

  const student = await User.findById(req.user._id);
  if (!student) return { status: 404, body: "Invalid Student" };

  const book = await Book.findById(req.body.bookId);
  if (!book) return { status: 404, body: "Invalid Book." };

  if (book.numberInStock === 0)
    return { status: 400, body: "Book not in Stock" };

  const request = await RequestsBorrows.find(
    {
      "student._id": req.user._id,
      "book._id": req.body.bookId,
    },
    { _id: 0, isApproved: 1, isReturned: 1 }
  );
  let noRequestPending = request.every((el) => {
    return el.isApproved === true && el.isReturned === true;
  });

  if (!noRequestPending)
    return { status: 422, body: "You are Already send Request for this book" };

  let borrowQuantity = await RequestsBorrows.countDocuments({
    "student._id": req.user._id,
  });
  if (borrowQuantity > 5)
    return { status: 400, body: "The limit has been completed" };

  let requestBorrowBook = new RequestsBorrows({
    student: _.pick(student, ["_id", "name", "phone", "imageURL", "studentId"]),
    book: _.pick(book, [
      "_id",
      "name",
      "autherName",
      "imageURL",
      "bookId",
      "location",
    ]),
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

export async function updeteRequest(id) {
  const requestBorrow = await RequestsBorrows.findById(id);
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

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    requestBorrow.isApproved = true;
    let result = await requestBorrow.save({ session });

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

export async function assignBorrow(id) {
  const borrowBook = await RequestsBorrows.findByIdAndUpdate(
    id,
    {
      isAssigned: true,
      dateAssign: Date.now(),
      dateReturn: new Date(new Date().setDate(new Date().getDate() + 10)),
    },
    { new: true }
  );

  if (!borrowBook)
    return { status: 404, body: "The Borrow with given id was not found!" };
  return { status: 201, body: borrowBook };
}

export async function returnBorrow(req) {
  const requestBorrows = await RequestsBorrows.findById(req.params.id);

  if (!requestBorrows)
    return { status: 404, body: "The Borrow Book with given id was not found" };

  const student = await User.findById(requestBorrows.student._id);
  if (!student)
    return { status: 404, body: "The associated student was not found." };

  const book = await Book.findById(requestBorrows.book._id);
  if (!book) return { status: 404, body: "The associated book was not found." };

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    requestBorrows.isReturned = true;
    requestBorrows.isOpen = false;
    await requestBorrows.save({ session });

    student.returnableBooks--;
    await student.save({ session });

    book.numberInStock++;
    book.returnableBooks--;
    await book.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { status: 200, body: requestBorrows };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error(error);
    return { status: 500, body: "Internal server issue, Please try again!" };
  }
}

export async function deleteRequest(id) {
  const deleteRequestBorrow = await RequestsBorrows.findById(id);

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
