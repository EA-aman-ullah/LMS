import express from "express";
import {
  assingedBorrow,
  getBorrow,
  updateBorrow,
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

borrows.put("/:id", [auth, managment], async (req, res) => {
  const { status, body } = await updateBorrow(req);
  res.status(status).send(body);
});

borrows.put("/assigned/:id", [auth, managment], async (req, res) => {
  const { status, body } = await assingedBorrow(req.params.id);
  res.status(status).send(body);
});

export default borrows;
