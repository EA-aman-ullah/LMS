import Book, { validateBook } from "../models/book.js";
import { Types } from "mongoose";
import _ from "lodash";

export async function getBooks(req) {
  if (req?.params.id) {
    // const [book] = await Book.aggregate([
    //   { $match: { _id: new Types.ObjectId(req.params.id) } },
    //   {
    //     $lookup: {
    //       from: "requestedborrows",
    //       localField: "_id",
    //       foreignField: "book._id",
    //       as: "requests",
    //       pipeline: [
    //         {
    //           $project: {
    //             _id: 0,
    //             studentId: "$student._id",
    //             studentName: "$student.name",
    //             studentPhone: "$student.phone",
    //             studentImage: "$student.imageURL",
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "borrowbooks",
    //       localField: "_id",
    //       foreignField: "book._id",
    //       as: "borrows",
    //       pipeline: [
    //         {
    //           $project: {
    //             _id: 0,
    //             studentId: "$student._id",
    //             studentName: "$student.name",
    //             studentPhone: "$student.phone",
    //             studentImage: "$student.imageURL",
    //           },
    //         },
    //       ],
    //     },
    //   },
    // ]);
    // if (!book)
    //   return { status: 404, body: "Book with the given Id was not found" };

    // const student = await User.find({ _id: req.query.studentId });
    // let islegible;

    // student.requestBorrows === 0 && student.returnableBooks === 0
    //   ? (islegible = true)
    //   : (islegible = false);

    // if (!islegible) {
    //   let request = await RequestBorrows.find(
    //     {
    //       "student._id": req.query.studentId,
    //       "book._id": req.params.id,
    //     },
    //     {
    //       _id: 0,
    //       isApproved: 1,
    //     }
    //   );
    //   let borrow = await BorrowBook.find(
    //     {
    //       "student._id": req.query.studentId,
    //       "book._id": req.params.id,
    //     },
    //     {
    //       _id: 0,
    //       isReturned: 1,
    //     }
    //   );
    //   let noRequestPending = request.every((el) => {
    //     return el.isApproved === true;
    //   });
    //   let noBorrowPending = borrow.every((el) => {
    //     return el.isReturned === true;
    //   });
    //   noBorrowPending && noRequestPending
    //     ? (islegible = true)
    //     : (islegible = false);
    // }

    // book.islegible = islegible;
    const studentId = req.query.studentId
      ? new Types.ObjectId(req.query.studentId)
      : null;

    const [book] = await Book.aggregate([
      { $match: { _id: new Types.ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "requestedborrows",
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
          from: "borrowbooks",
          localField: "_id",
          foreignField: "book._id",
          as: "borrows",
          pipeline: [
            { $match: { isReturned: false } },
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
          from: "requestedborrows",
          let: {
            bookId: "$_id",
            studentId,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$book._id", "$$bookId"] },
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
              },
            },
          ],
          as: "pendingRequests",
        },
      },
      {
        $lookup: {
          from: "borrowbooks",
          let: {
            bookId: "$_id",
            studentId,
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$book._id", "$$bookId"] },
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
                isReturned: 1,
              },
            },
          ],
          as: "pendingBorrows",
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
                    },
                  },
                ],
              },
            },
          },
          noBorrowPending: {
            $cond: {
              if: { $eq: [{ $size: "$pendingBorrows" }, 0] },
              then: true,
              else: {
                $allElementsTrue: [
                  {
                    $map: {
                      input: "$pendingBorrows",
                      as: "borrow",
                      in: "$$borrow.isReturned",
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
              if: { $and: ["$noRequestPending", "$noBorrowPending"] },
              then: true,
              else: "$$REMOVE",
            },
          },
        },
      },
      {
        $project: {
          pendingRequests: 0,
          pendingBorrows: 0,
          noRequestPending: 0,
          noBorrowPending: 0,
        },
      },
    ]);

    if (!book)
      return { status: 404, body: "Book with the given Id was not found" };

    return { status: 200, body: book };
  } else {
    const books = await Book.find({ numberInStock: { $gt: 0 } }).sort("name");
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
      "location",
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
