import Book, { validateBook } from "../models/book.js";
import { Types } from "mongoose";
import _ from "lodash";
import { pagination } from "../utils/pagination.js";

export async function getBooks(req) {
  if (req.params.id) {
    const [book] = await Book.aggregate([
      { $match: { _id: new Types.ObjectId(`${req.params.id}`) } },
    ]);

    if (!book)
      return { status: 404, body: "Book with the given Id was not found" };

    return { status: 200, body: book };
  } else {
    let {
      filter,
      skipedQuantity,
      recordLimit,
      totalRecords,
      pageNumber,
      totalPages,
    } = await pagination(Book, req.query);

    let result = await Book.find(filter)
      .skip(skipedQuantity)
      .limit(recordLimit);

    let hasNextPage =
      totalRecords - pageNumber * recordLimit > 0 &&
      result.length >= recordLimit;

    let books = {
      status: 200,
      message: "Data Retrieved Successfully",
      result: result,
      pagination: {
        totalRecord: totalRecords,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        currentPage: pageNumber,
      },
    };

    return { status: 200, body: books };
  }
}

export async function getBorrowedBooks(req) {
  let result = await pagination(Book, req.query, undefined, [
    { $match: { returnableBooks: { $gt: 0 } } },
    {
      $project: {
        createdAt: 0,
        updatedAt: 0,
        numberInStock: 0,
        reservedNumber: 0,
        description: 0,
        location: 0,
        __v: 0,
      },
    },
    {
      $lookup: {
        from: "requestsborrows",
        localField: "_id",
        foreignField: "book",
        as: "students",
        pipeline: [
          { $match: { isReturned: false, isAssigned: true } },
          {
            $project: {
              userId: "$user",
              dateBorrow: "$dateAssign",
              dateReturn: "$dateReturn",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          {
            $addFields: {
              userDetails: { $arrayElemAt: ["$userDetails", 0] },
            },
          },
          {
            $replaceRoot: {
              newRoot: { $mergeObjects: ["$$ROOT", "$userDetails"] },
            },
          },
          {
            $project: {
              userDetails: 0,
              __v: 0,
              password: 0,
              requestBorrows: 0,
              role: 0,
              otp: 0,
              createdAt: 0,
              updatedAt: 0,
              requestApproved: 0,
              isVarified: 0,
              requestPending: 0,
              userId: 0,
            },
          },
        ],
      },
    },
  ]);

  result.result?.forEach((el, index) => {
    let lateStudentsQuantity = [];
    el.students.forEach((el) => {
      let dateReturn = el.dateReturn.getTime();
      if (dateReturn < Date.now()) lateStudentsQuantity.push(el);
    });
    result.result[index].lateStudentsQuantity = lateStudentsQuantity;
  });

  return { status: 200, body: result };
}

export async function createBook(req) {
  const { error } = validateBook(req.body);
  if (error) return { status: 400, body: error.details[0].message };

  let book = new Book(
    _.pick(req.body, [
      "name",
      "autherName",
      "numberInStock",
      "imageURL",
      "language",
      "location",
      "description",
    ])
  );
  book = await book.save();

  return { status: 201, body: book };
}

export async function updateBook(req) {
  const { error } = validateBook(req.body);
  if (error) return { status: 400, body: error.details[0].message };

  let book = await Book.findByIdAndUpdate(
    req.params.id,
    _.pick(req.body, [
      "name",
      "autherName",
      "numberInStock",
      "imageURL",
      "location",
    ]),
    { new: true }
  );

  if (!book)
    return { status: 404, body: "Book with the given Id was not Found." };
  return { status: 201, body: book };
}

export async function deletBook(id) {
  const book = await Book.findByIdAndDelete(id, { new: true });
  if (!book)
    return { status: 404, body: "Book with the given id was not Found." };

  return { status: 201, body: book };
}
