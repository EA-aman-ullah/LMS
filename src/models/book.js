import Joi from "joi";
import mongoose from "mongoose";

export const bookSchema = new mongoose.Schema(
  {
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
    bookId: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 255,
    },
    language: {
      type: String,
      minlength: 3,
      maxlength: 255,
    },
    description: {
      type: String,
      minlength: 3,
      maxlength: 30000,
    },
    location: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 255,
    },
    numberInStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    returnableBooks: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedNumber: {
      type: Number,
      default: 0,
      min: 0,
    },
    imageURL: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

bookSchema.pre("validate", async function (next) {
  if (!this.bookId) {
    try {
      const { default: generateId } = await import("../utils/generateId.js");
      this.bookId = await generateId("BKD");
    } catch (error) {
      console.error("Error generating ID:", error);
      next(error);
      return;
    }
  }
  next();
});

const Book = mongoose.model("Book", bookSchema);

export function validateBook(book) {
  const schema = {
    name: Joi.string().min(3).max(50).required(),
    autherName: Joi.string().min(5).max(255).required(),
    imageURL: Joi.string().required(),
    numberInStock: Joi.number().min(0),
    location: Joi.string().min(4).max(255).required(),
    language: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(100).max(30000),
  };

  return Joi.object(schema).validate(book);
}

export default Book;
