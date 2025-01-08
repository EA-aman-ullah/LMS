import Book, { validateBook } from "../models/book.js";
import { Types } from "mongoose";
import _ from "lodash";

export async function getBooks(req) {
  if (req.params.id) {
    const studentId = req.query.studentId
      ? new Types.ObjectId(req.query.studentId)
      : null;

    const [book] = await Book.aggregate([
      { $match: { _id: new Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "requestsborrows",
          localField: "_id",
          foreignField: "book._id",
          as: "requests",
          pipeline: [
            { $match: { isApproved: false } },
            {
              $project: {
                _id: 0,
                studentId: "$student._id",
                studentName: "$student.name",
                studentPhone: "$student.phone",
                studentImage: "$student.imageURL",
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "requestsborrows",
          localField: "_id",
          foreignField: "book._id",
          as: "borrows",
          pipeline: [
            { $match: { isReturned: false, isApproved: true } },
            {
              $project: {
                _id: 0,
                studentId: "$student._id",
                studentName: "$student.name",
                studentPhone: "$student.phone",
                studentImage: "$student.imageURL",
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "requestsborrows",
          let: {
            bookId: "$_id",
            studentId,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$book._id", "$$bookId"],
                    },
                    {
                      $cond: {
                        if: { $not: ["$$studentId"] },
                        then: false,
                        else: { $eq: ["$student._id", "$$studentId"] },
                      },
                    },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 0,
                isApproved: 1,
                isReturned: 1,
              },
            },
          ],
          as: "pendingRequests",
        },
      },
      {
        $addFields: {
          noRequestPending: {
            $cond: {
              if: { $eq: [{ $size: "$pendingRequests" }, 0] },
              then: true,
              else: {
                $allElementsTrue: [
                  {
                    $map: {
                      input: "$pendingRequests",
                      as: "request",
                      in: "$$request.isApproved",
                      in: "$$request.isReturned",
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          isLegible: {
            $cond: {
              if: "$noRequestPending",
              then: true,
              else: "$$REMOVE",
            },
          },
        },
      },
      {
        $project: {
          pendingRequests: 0,
          noRequestPending: 0,
        },
      },
    ]);

    if (!book)
      return { status: 404, body: "Book with the given Id was not found" };

    return { status: 200, body: book };
  } else {
    const { search, onlyAvailable, page = 2, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const filter = {};

    if (onlyAvailable) filter.numberInStock = { $gt: 0 };

    if (search) {
      filter.name = new RegExp(search, "i"); // 'i' for case-insensitive search
    }

    const result = await Book.find(filter)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const totalBooks = await Book.countDocuments();
    let totalPages = Math.ceil(totalBooks / limit);
    let hasNextPage =
      totalBooks - page * limit > 0 && result.length >= limit ? true : false;

    let books = {
      status: 200,
      message: "Data Retrived Successfuly",
      result: result,
      pagination: {
        totalRecord: totalBooks,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        currentPage: page,
      },
    };

    return { status: 200, body: books };
  }
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
