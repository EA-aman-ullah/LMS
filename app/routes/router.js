import express from "express";
import users from "./users.js";
import error from "../middleware/error.js";
import books from "./books.js";
import borrows from "./borrowBooks.js";
import auth from "./auth.js";

export default function (app) {
  app.use(express.json());
  app.use("/api/users", users);
  app.use("/api/books", books);
  app.use("/api/borrows", borrows);
  app.use("/api/auth", auth);
  app.use(error);
}
