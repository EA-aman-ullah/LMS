import express from "express";
import {
  assignBorrow,
  getBorrows,
  returnBorrow,
} from "../controller/requestsBorrowsController.js";
import auth from "../middleware/auth.js";
import managment from "../middleware/managment.js";

const borrows = express.Router();

borrows.get("/", auth, async (req, res) => {
  const borrowBooks = await getBorrows(req);
  res.send(borrowBooks);
});

borrows.get("/:id", auth, async (req, res) => {
  const { status, body } = await getBorrows(req);
  res.status(status).send(body);
});

borrows.put("/:id", [auth, managment], async (req, res) => {
  const { status, body } = await returnBorrow(req);
  res.status(status).send(body);
});

borrows.put("/assigned/:id", [auth, managment], async (req, res) => {
  const { status, body } = await assignBorrow(req.params.id);
  res.status(status).send(body);
});

export default borrows;
