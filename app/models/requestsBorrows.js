import Joi from "joi";
import mongoose from "mongoose";

export const requestsBorrowsSchema = new mongoose.Schema(
  {
    student: {
      type: new mongoose.Schema({
        name: {
          type: String,
          required: true,
          minlength: 3,
          maxlength: 255,
        },
        phone: {
          type: String,
          required: true,
          minlength: 3,
          maxlength: 255,
        },
        studentId: {
          type: String,
          required: true,
          minlength: 5,
          maxlength: 255,
        },
        imageURL: {
          type: String,
          // required: true,
        },
      }),
      required: true,
    },
    book: {
      type: new mongoose.Schema({
        name: {
          type: String,
          required: true,
          minlength: 3,
          maxlength: 255,
        },
        autherName: {
          type: String,
          required: true,
          minlength: 3,
          maxlength: 255,
        },
        bookId: {
          type: String,
          required: true,
          minlength: 5,
          maxlength: 255,
        },
        imageURL: {
          type: String,
          required: true,
        },
        location: {
          type: String,
          required: true,
        },
      }),
      required: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
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
