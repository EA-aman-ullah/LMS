import express from "express";
import cors from "cors";
import users from "./users.js";
import error from "../middleware/error.js";
import books from "./books.js";
import auth from "./auth.js";
import requests from "./requests.js";
import dashboard from "./dasboard.js";
import borrows from "./borrows.js";

export default function (app) {
  app.use(
    cors({
      origin: "http://localhost:5173",
      allowedHeaders: ["Authorization", "Content-Type"],
      exposedHeaders: ["Authorization"],
    })
  );
  app.use(express.static("public"));
  app.use(express.json());
  app.use("/api/dashboard", dashboard);
  app.use("/api/users", users);
  app.use("/api/books", books);
  app.use("/api/borrows", borrows);
  app.use("/api/requests", requests);
  app.use("/api/auth", auth);
  app.use(error);
}
