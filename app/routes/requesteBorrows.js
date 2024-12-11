import express from "express";
import {
  createRequestBorrow,
  deleteRequestBorrow,
  getRequestBorrows,
  updeteRequestBorrow,
} from "../controller/requestborrowsController.js";
import auth from "../middleware/auth.js";
import managment from "../middleware/managment.js";
import admin from "../middleware/admin.js";

const requestBorrows = express.Router();

requestBorrows.get("/", auth, async (req, res) => {
  const { requestBorrows } = await getRequestBorrows();
  res.send(requestBorrows);
});

requestBorrows.get("/:id", auth, async (req, res) => {
  const { status, body } = await getRequestBorrows(req);
  res.status(status).send(body);
});

requestBorrows.post("/", auth, async (req, res) => {
  const { status, body } = await createRequestBorrow(req);
  res.status(status).send(body);
});

requestBorrows.put("/:id", [auth, managment], async (req, res) => {
  const { status, body } = await updeteRequestBorrow(req.params.id);
  res.status(status).send(body);
});

requestBorrows.delete("/:id", [auth, admin], async (req, res) => {
  const { status, body } = await deleteRequestBorrow(req.params.id);
  res.status(status).send(body);
});

export default requestBorrows;