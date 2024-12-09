import mongoose from "mongoose";
import Book from "../models/book.js";
import BorrowBook, { validateBorrow } from "../models/borrowBook.js";
import User from "../models/user.js";
import _ from "lodash";

export async function getBorrow(req) {
  if (req.params.id) {
    let borrow = await BorrowBook.findById(req.params.id);
    if (!borrow)
      return { status: 404, body: "The book with give ID was not found." };

    if (req.user.role === "student") {
      if (borrow.student._id === rd) return { status: 200, body: borrow };
      else return { status: 400, body: "This book was not borrowed by You" };
    } else return { status: 200, body: borrow };
  } else {
    if (req.user.role !== "student") {
      return await BorrowBook.find().sort("book.name");
    } else {
      return await BorrowBook.find({ "student._id": req.user._id }).sort(
        "book.name"
      );
    }
  }
}

export async function createBorrow(req) {
  const { error } = validateBorrow(req.body);
  if (error) return { status: 400, body: error.details[0].message };

  const student = await User.findById(req.body.studentId);
  if (!student) return { status: 404, body: "Invalid Student" };

  const book = await Book.findById(req.body.bookId);
  if (!book) return { status: 404, body: "Invalid Book." };

  if (book.numberInStock === 0)
    return { status: 400, body: "Book not in Stock" };

  const borrowExist = await BorrowBook.findOne({
    "student._id": req.body.studentId,
    "book._id": req.body.bookId,
  });
  if (borrowExist)
    return { status: 400, body: "This book Already borrowed By this Student" };

  let borrowQuantity = await BorrowBook.countDocuments({
    "student._id": req.body.studentId,
  });
  if (borrowQuantity > 5)
    return { status: 400, body: "The limit has been completed" };

  let borrowBook = new BorrowBook({
    student: _.pick(student, ["_id", "name", "phone"]),
    book: _.pick(book, ["_id", "name", "autherName"]),
  });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    borrowBook = await borrowBook.save({ session });

    student.returnableBooks++;
    await student.save({ session });

    book.numberInStock--;
    await book.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { status: 201, body: borrowBook };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    return { status: 500, body: "Internal Issue.." };
  }
}

export async function deletBorrow(id) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const borrowBook = await BorrowBook.findByIdAndDelete(id, { session });
    if (!borrowBook)
      return {
        status: 404,
        body: "The borrowed record with the Given ID was not Found",
      };

    let student = await User.findById(borrowBook.student._id);
    if (!student)
      return { status: 404, body: "The associated student was not found." };
    student.returnableBooks--;
    await student.save({ session });

    let book = await Book.findById(borrowBook.book._id);
    if (!book)
      return { status: 404, body: "The associated book was not found." };
    book.numberInStock++;
    book = await book.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { status: 200, body: borrowBook };
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    return { status: 500, body: "Internal server error. Please try Again." };
  }
}
