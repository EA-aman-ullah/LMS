import Book from "../models/book.js";
import RequestsBorrows from "../models/requestsBorrows.js";
import User from "../models/user.js";

export async function getOverview(req) {
  const Overview = [];

  let books = await Book.countDocuments({ numberInStock: { $gt: 0 } });
  Overview.push({
    title: "Books Available in Library",
    value: books,
  });

  if (req.user.role !== "student") {
    let requestBorrows = await RequestsBorrows.countDocuments({
      isApproved: false,
    });
    Overview.push({
      title: "Unapproved Borrow Requests",
      value: requestBorrows,
    });
  } else {
    let requestBorrows = await RequestsBorrows.countDocuments({
      "student._id": req.user._id,
      isApproved: false,
    });
    Overview.push({
      title: "Unapproved Borrow Requests",
      value: requestBorrows,
    });
  }

  if (req.user.role !== "student") {
    let borrowBooks = await RequestsBorrows.countDocuments({
      isApproved: true,
      isReturned: false,
    });
    Overview.push({ title: "Active Borrowed Books", value: borrowBooks });
  } else {
    let borrowBooks = await BorrowBook.countDocuments({
      "student._id": req.user._id,
      isApproved: true,
      isReturned: false,
    });
    Overview.push({ title: "Active Borrowed Books", value: borrowBooks });
  }

  if (req.user.role === "admin" || req.user.role === "librarian") {
    let studentsWhoRequested = await User.countDocuments({
      role: "student",
      requestBorrows: { $gt: 0 },
    });
    Overview.push({
      title: "Students with Pending Requests",
      value: studentsWhoRequested,
    });
  }

  if (req.user.role === "admin" || req.user.role === "librarian") {
    let studentsWhoGetBorrow = await User.countDocuments({
      role: "student",
      returnableBooks: { $gt: 0 },
    });
    Overview.push({
      title: "Students with Books to Return",
      value: studentsWhoGetBorrow,
    });
  }

  return { status: 200, body: Overview };
}
