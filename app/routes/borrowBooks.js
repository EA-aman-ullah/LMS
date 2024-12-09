import express from "express";
import {
  createBorrow,
  deletBorrow,
  getBorrow,
} from "../controller/borrowsController.js";
import auth from "../middleware/auth.js";
import managment from "../middleware/managment.js";

const borrows = express.Router();

borrows.get("/", auth, async (req, res) => {
  const borrowBooks = await getBorrow(req);
  res.send(borrowBooks);
});

borrows.get("/:id", auth, async (req, res) => {
  const { status, body } = await getBorrow(req);
  res.status(status).send(body);
});

borrows.post("/", auth, async (req, res) => {
  const { status, body } = await createBorrow(req);
  res.status(status).send(body);
});

borrows.delete("/:id", [auth, managment], async (req, res) => {
  const { status, body } = await deletBorrow(req.params.id);
  res.status(status).send(body);
});

export default borrows;
