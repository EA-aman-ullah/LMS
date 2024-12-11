import Joi from "joi";
import mongoose from "mongoose";

export const requestedBorrowsSchema = new mongoose.Schema({
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
      imageURL: {
        type: String,
        required: true,
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
      imageURL: {
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
});

const RequestBorrows = mongoose.model(
  "requestedBorrows",
  requestedBorrowsSchema
);

export function validateRequestBorrow(borrowBooks) {
  const schema = {
    studentId: Joi.objectId().required(),
    bookId: Joi.objectId().required(),
  };

  return Joi.object(schema).validate(borrowBooks);
}

export default RequestBorrows;
