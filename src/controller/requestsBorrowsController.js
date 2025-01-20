import mongoose, { Types } from "mongoose";
import User from "../models/user.js";
import Book from "../models/book.js";
import RequestsBorrows, {
  validateRequestBorrow,
} from "../models/requestsBorrows.js";
import _ from "lodash";
import logger from "../utils/logging.js";
import { pagination } from "../utils/pagination.js";

export async function getRequests(req) {
  if (req.params.id) {
    const requestBorrow = await RequestsBorrows.findById(req.params.id)
      .populate({
        path: "book",
        select: "-description -numberInStock -createdAt -updatedAt -__v",
      })
      .populate({
        path: "user",
        select: "name email phone studentId imageURL",
      });
    if (!requestBorrow)
      return {
        status: 404,
        body: "The Requested Borrows with the given id was not found",
      };
    if (req.user.role === "student") {
      if (requestBorrow.user._id === req.user._id)
        return { status: 200, body: requestBorrow };
      else return { status: 400, body: "This request was not made by You" };
    } else return { status: 200, body: requestBorrow };
  } else {
    let pipeline = [
      {
        $lookup: {
          from: "books",
          localField: "book",
          foreignField: "_id",
          as: "book",
        },
      },
      {
        $addFields: {
          book: { $arrayElemAt: ["$book", 0] },
        },
      },
      {
        $project: {
          "book.description": 0,
          "book.numberInStock": 0,
          "book.createdAt": 0,
          "book.updatedAt": 0,
          "book.returnableBooks": 0,
          "book.reservedNumber": 0,
          "book.__v": 0,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          user: { $arrayElemAt: ["$user", 0] },
        },
      },
      {
        $project: {
          __v: 0,
          "user.password": 0,
          "user.requestBorrows": 0,
          "user.role": 0,
          "user.otp": 0,
          "user.createdAt": 0,
          "user.updatedAt": 0,
          "user.requestApproved": 0,
          "user.isVarified": 0,
          "user.requestPending": 0,
        },
      },
    ];

    if (req.path === "/approve") {
      pipeline.push({
        $sort: { isApproved: 1 },
      });
    }

    if (req.path === "/assign") {
      pipeline.unshift({ $match: { isApproved: true } });
      pipeline.push({
        $sort: { isAssigned: 1 },
      });
    }

    if (req.path === "/return") {
      pipeline.unshift({ $match: { isAssigned: true } });
      pipeline.push({
        $sort: { isReturned: 1 },
      });
    }

    if (req.user.role === "student")
      pipeline.unshift({
        $match: { user: new Types.ObjectId(`${req.user._id}`) },
      });

    let result = await pagination(
      RequestsBorrows,
      req.query,
      undefined,
      pipeline
    );
    return { status: 200, body: result };
  }
}

// export async function getBorrows(req) {
//   if (req.params.id) {
//     let borrow = await RequestsBorrows.findById(req.params.id)
//       .populate({
//         path: "book",
//         select: "-description -numberInStock -createdAt -updatedAt -__v",
//       })
//       .populate({
//         path: "user",
//         select: "name email phone studentId imageURL",
//       });
//     if (!borrow)
//       return { status: 404, body: "The book with give ID was not found." };

//     if (req.user.role === "student") {
//       if (borrow.user._id === req.user._id)
//         return { status: 200, body: borrow };
//       else return { status: 400, body: "This book was not borrowed by You" };
//     } else return { status: 200, body: borrow };
//   } else {
//     if (req.user.role !== "student") {
//       const {
//         filter,
//         skipedQuantity,
//         recordLimit,
//         totalRecords,
//         totalPages,
//         pageNumber,
//       } = await pagination(RequestsBorrows, req.query, {
//         isApproved: true,
//       });

//       let result = await RequestsBorrows.find()
//         .populate({
//           path: "book",
//           match: filter,
//           select: "-description -numberInStock -createdAt -updatedAt -__v",
//         })
//         .populate({
//           path: "user",
//           match: filter,
//           select: "name email phone studentId imageURL",
//         })
//         .skip(skipedQuantity)
//         .limit(recordLimit)
//         .sort({ isAssigned: 1, isReturned: 1 });

//       let paginatedResult = {
//         status: 200,
//         message: "Data Retrieved Successfully",
//         result: result,
//         pagination: {
//           totalRecord: totalRecords,
//           totalPages: totalPages,
//           currentPage: pageNumber,
//         },
//       };

//       return { status: 200, body: paginatedResult };
//     } else {
//       const {
//         filter,
//         skipedQuantity,
//         recordLimit,
//         totalRecords,
//         totalPages,
//         pageNumber,
//       } = await pagination(RequestsBorrows, req.query, {
//         user: req.user._id,
//         isApproved: true,
//       });

//       let result = await RequestsBorrows.find({
//         user: req.user._id,
//       })
//         .populate({
//           path: "book",
//           match: filter,
//           select: "-description -numberInStock -createdAt -updatedAt -__v",
//         })
//         .populate({
//           path: "user",
//           match: filter,
//           select: "name email phone studentId imageURL",
//         })
//         .skip(skipedQuantity)
//         .limit(recordLimit)
//         .sort({ isAssigned: 1, isReturned: 1 });

//       let paginatedResult = {
//         status: 200,
//         message: "Data Retrieved Successfully",
//         result: result,
//         pagination: {
//           totalRecord: totalRecords,
//           totalPages: totalPages,
//           currentPage: pageNumber,
//         },
//       };
//       return { status: 200, body: paginatedResult };
//     }
//   }
// }

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
      user: req.user._id,
      book: req.body.bookId,
    },
    { _id: 0, isApproved: 1, isReturned: 1 }
  );
  let noRequestPending = request.every((el) => {
    return el.isApproved === true && el.isReturned === true;
  });

  if (!noRequestPending)
    return { status: 422, body: "You are Already send Request for this book" };

  let borrowQuantity = await RequestsBorrows.countDocuments({
    user: req.user._id,
    isReturned: false,
  });
  if (borrowQuantity > 5)
    return { status: 400, body: "The limit has been completed" };

  let requestBorrowBook = new RequestsBorrows({
    user: req.user._id,
    book: req.body.bookId,
  });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    requestBorrowBook = await requestBorrowBook.save({ session });

    student.requestPending++;
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

  const student = await User.findById(requestBorrow.user);

  if (!student)
    return {
      status: 400,
      body: "Related Student does not Exist",
    };

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    requestBorrow.isApproved = true;
    let result = await requestBorrow.save({ session });

    student.requestPending--;
    student.requestApproved++;
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
  const request = await RequestsBorrows.findById(id);
  if (!request)
    return { status: 404, body: "The Borrow with given id was not found!" };

  const book = await Book.findById(request.book);
  const student = await User.findById(request.user);
  if (!book || !student)
    return {
      status: 400,
      body: "Related Student or Book does not Exist",
    };

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    request.isAssigned = true;
    request.dateAssign = Date.now();
    request.dateReturn = new Date(
      new Date().setDate(new Date().getDate() + 30)
    );

    let result = await request.save({ session });

    book.reservedNumber--;
    book.returnableBooks++;
    await book.save({ session });

    student.requestApproved--;
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

export async function returnBorrow(req) {
  const requestBorrows = await RequestsBorrows.findById(req.params.id);

  if (!requestBorrows)
    return { status: 404, body: "The Borrow Book with given id was not found" };

  const student = await User.findById(requestBorrows.user);
  if (!student)
    return { status: 404, body: "The associated student was not found." };

  const book = await Book.findById(requestBorrows.book);
  if (!book) return { status: 404, body: "The associated book was not found." };

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    requestBorrows.isReturned = true;
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
