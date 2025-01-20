import Joi from "joi";
import mongoose from "mongoose";

export const requestsBorrowsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    isApproved: { type: Boolean, default: false },
    isAssigned: { type: Boolean, default: false },
    isReturned: { type: Boolean, default: false },
    dateAssign: { type: Date },
    dateReturn: { type: Date },
  },
  { timestamps: true }
);

const RequestsBorrows = mongoose.model(
  "requestsborrows",
  requestsBorrowsSchema
);

export function validateRequestBorrow(borrowBooks) {
  const schema = {
    bookId: Joi.objectId().required(),
  };

  return Joi.object(schema).validate(borrowBooks);
}

export default RequestsBorrows;
