import express from "express";
import {
  createBook,
  deletBook,
  getBooks,
  getBorrowedBooks,
  updateBook,
} from "../controller/booksController.js";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import managment from "../middleware/managment.js";
import handleImage from "../middleware/multerCofing.js";

const books = express.Router();

books.get("/", async (req, res) => {
  const { status, body } = await getBooks(req);
  res.status(status).send(body);
});

books.get("/borrowed-books", [auth, managment], async (req, res) => {
  let { status, body } = await getBorrowedBooks(req);
  res.status(status).send(body);
});

books.get("/:id", async (req, res) => {
  const { status, body } = await getBooks(req);
  res.status(status).send(body);
});

books.post("/", [auth, managment], handleImage, async (req, res) => {
  const { status, body } = await createBook(req);
  res.status(status).send(body);
});

books.put("/:id", [auth, managment], handleImage, async (req, res) => {
  const { status, body } = await updateBook(req);
  res.status(status).send(body);
});

books.delete("/:id", [auth, admin], async (req, res) => {
  const { status, body } = await deletBook(req.params.id);
  res.status(status).send(body);
});

export default books;
