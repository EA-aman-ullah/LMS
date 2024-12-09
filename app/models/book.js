import Joi from "joi";
import mongoose from "mongoose";

export const bookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 255,
  },

  autherName: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  numberInStock: {
    type: Number,
    required: true,
    default: 0,
    minlength: 0,
  },
  returnableBooks: {
    type: Number,
    minlength: 0,
  },
});

const Book = mongoose.model("book", bookSchema);

export function validateBook(book) {
  const schema = {
    name: Joi.string().min(3).max(50).required(),
    autherName: Joi.string().max(255).required(),
    numberInStock: Joi.number().min(0),
  };

  return Joi.object(schema).validate(book);
}

export default Book;
