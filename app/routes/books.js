import express from "express";
import {
  createBook,
  deletBook,
  getBooks,
  updateBook,
} from "../controller/booksController.js";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import managment from "../middleware/managment.js";

const books = express.Router();

books.get("/", async (req, res) => {
  const books = await getBooks();
  res.send(books);
});

books.get("/:id", async (req, res) => {
  const book = await getBooks(req.params.id);
  res.send(book);
});

books.post("/", [auth, managment], async (req, res) => {
  const { status, body } = await createBook(req);
  res.status(status).send(body);
});

books.put("/:id", [auth, managment], async (req, res) => {
  const { status, body } = await updateBook(req);
  res.status(status).send(body);
});

books.delete("/:id", [auth, admin], async (req, res) => {
  const { status, body } = await deletBook(req.params.id);
  res.status(status).send(body);
});

export default books;
