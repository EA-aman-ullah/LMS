import mongoose from "mongoose";
import Book from "../models/book.js";
import BorrowBook, { validateBorrow } from "../models/borrowBook.js";
import User from "../models/user.js";
import _ from "lodash";
import logger from "../utils/logging.js";

export async function getBorrow(req) {
  if (req.params.id) {
    let borrow = await BorrowBook.findById(req.params.id);
    if (!borrow)
      return { status: 404, body: "The book with give ID was not found." };

    if (req.user.role === "student") {
      if (borrow.student._id === req.user._id)
        return { status: 200, body: borrow };
      else return { status: 400, body: "This book was not borrowed by You" };
    } else return { status: 200, body: borrow };
  } else {
    if (req.user.role !== "student") {
      return await BorrowBook.find({ isReturned: false }).sort("book.name");
    } else {
      return await BorrowBook.find({
        "student._id": req.user._id,
        isReturned: false,
      }).sort("book.name");
    }
  }
}

export async function updateBorrow(req) {
  const borrowBook = await BorrowBook.findById(req.params.id);
  if (!borrowBook)
    return { status: 404, body: "The Borrow Book with given id was not found" };

  const student = await User.findById(borrowBook.student._id);
  if (!student)
    return { status: 404, body: "The associated student was not found." };

  const book = await Book.findById(borrowBook.book._id);
  if (!book) return { status: 404, body: "The associated book was not found." };

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    borrowBook.isReturned = true;
    await borrowBook.save({ session });

    student.returnableBooks--;
    await student.save({ session });

    book.numberInStock++;
    book.returnableBooks--;
    await book.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { status: 200, body: borrowBook };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error(error);
    return { status: 500, body: "Internal server issue, Please try again!" };
  }
}

export async function assingedBorrow(id) {
  const borrowBook = await BorrowBook.findByIdAndUpdate(
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

// export async function deletBorrow(id) {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const borrowBook = await BorrowBook.findByIdAndDelete(id, { session });
//     if (!borrowBook)
//       return {
//         status: 404,
//         body: "The borrowed record with the Given ID was not Found",
//       };

//     let student = await User.findById(borrowBook.student._id);
//     if (!student)
//       return { status: 404, body: "The associated student was not found." };
//     student.returnableBooks--;
//     await student.save({ session });

//     let book = await Book.findById(borrowBook.book._id);
//     if (!book)
//       return { status: 404, body: "The associated book was not found." };
//     book.numberInStock++;
//     book = await book.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     return { status: 200, body: borrowBook };
//   } catch (error) {
//     console.log(error);
//     await session.abortTransaction();
//     session.endSession();
//     return { status: 500, body: "Internal server error. Please try Again." };
//   }
// }
