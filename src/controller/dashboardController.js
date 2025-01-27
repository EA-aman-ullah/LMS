import Book from "../models/book.js";
import RequestsBorrows from "../models/requestsBorrows.js";
import User from "../models/user.js";

export async function getOverview(req) {
  const Overview = [];

  const queries = [
    Book.countDocuments({ numberInStock: { $gt: 0 } }),

    req.user.role !== "student"
      ? RequestsBorrows.countDocuments({ isApproved: false })
      : RequestsBorrows.countDocuments({
          user: req.user._id,
          isApproved: false,
        }),

    req.user.role !== "student"
      ? RequestsBorrows.countDocuments({
          isApproved: true,
          isAssigned: false,
        })
      : RequestsBorrows.countDocuments({
          user: req.user._id,
          isApproved: true,
          isAssigned: false,
        }),

    req.user.role !== "student"
      ? RequestsBorrows.countDocuments({
          isAssigned: true,
          isReturned: false,
        })
      : RequestsBorrows.countDocuments({
          user: req.user._id,
          isAssigned: true,
          isReturned: false,
        }),

    (req.user.role === "admin" || req.user.role === "librarian") &&
      User.countDocuments({
        role: "student",
        requestPending: { $gt: 0 },
      }),

    (req.user.role === "admin" || req.user.role === "librarian") &&
      User.countDocuments({
        role: "student",
        returnableBooks: { $gt: 0 },
      }),
  ];

  const [
    books,
    unapprovedRequests,
    approvedRequests,
    borrowedBooks,
    studentsWithPendingRequests,
    studentsWithBooksToReturn,
  ] = await Promise.all(queries);

  Overview.push({
    title: "Books Available in Library",
    value: books,
  });

  Overview.push({
    title: "Unapproved Book Requests",
    value: unapprovedRequests,
  });

  Overview.push({
    title: "Approved Book Requests",
    value: approvedRequests,
  });

  Overview.push({
    title: "Borrowed Books",
    value: borrowedBooks,
  });

  if (req.user.role === "admin" || req.user.role === "librarian") {
    Overview.push({
      title: "Students with Pending Requests",
      value: studentsWithPendingRequests,
    });

    Overview.push({
      title: "Students with Books to Return",
      value: studentsWithBooksToReturn,
    });
  }

  return { status: 200, body: Overview };
}
