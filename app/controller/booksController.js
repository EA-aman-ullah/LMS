import Book, { validateBook } from "../models/book.js";
import _ from "lodash";

export async function getBooks(id) {
  if (id) {
    const book = await Book.findById(id).sort("name");
    if (!book)
      return { status: 404, body: "Book with the given Id was not found" };
    return { status: 200, body: book };
  } else {
    const books = await Book.find().sort("name");
    return { status: 200, body: books };
  }
}

export async function createBook(req) {
  const { error } = validateBook(req.body);
  if (error) return { status: 400, body: error.details[0].message };

  let book = new Book(
    _.pick(req.body, ["name", "autherName", "numberInStock", "imageURL"])
  );
  book = await book.save();

  return { status: 201, body: book };
}

export async function updateBook(req) {
  const { error } = validateBook(req.body);
  if (error) return { status: 400, body: error.details[0].message };

  let book = await Book.findByIdAndUpdate(
    req.params.id,
    _.pick(req.body, ["name", "autherName", "numberInStock", "imageURL"]),
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
