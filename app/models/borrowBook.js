import Joi from "joi";
import mongoose from "mongoose";

export const borrowSchema = new mongoose.Schema({
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
    }),
    required: true,
  },

  isNotReturned: { type: Boolean, default: true },
  isAssigned: { type: Boolean, default: false },
  dateOut: { type: Date },
  datedue: { type: Date },
  //  {
  //   type: Date,
  //   required: true,
  //   default: function () {
  //     const currentDate = new Date();
  //     currentDate.setDate(currentDate.getDate() + 10);
  //     return currentDate;
  //   },
  // },
});

const BorrowBook = mongoose.model("BorrowBook", borrowSchema);

export function validateBorrow(borrowBooks) {
  const schema = {
    studentId: Joi.objectId().required(),
    bookId: Joi.objectId().required(),
  };

  return Joi.object(schema).validate(borrowBooks);
}

export default BorrowBook;
