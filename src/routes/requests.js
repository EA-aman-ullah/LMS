import express from "express";
import {
  assignBorrow,
  createRequest,
  deleteRequest,
  getRequests,
  returnBorrow,
  updeteRequest,
} from "../controller/requestsBorrowsController.js";
import auth from "../middleware/auth.js";
import managment from "../middleware/managment.js";
import admin from "../middleware/admin.js";

const requests = express.Router();

requests.get("/approve", auth, async (req, res) => {
  const { status, body } = await getRequests(req);
  res.status(status).send(body);
});

requests.get("/assign", auth, async (req, res) => {
  const { status, body } = await getRequests(req);
  res.status(status).send(body);
});
requests.get("/return", auth, async (req, res) => {
  const { status, body } = await getRequests(req);
  res.status(status).send(body);
});

requests.get("/:id", auth, async (req, res) => {
  const { status, body } = await getRequests(req);
  res.status(status).send(body);
});

requests.post("/", auth, async (req, res) => {
  const { status, body } = await createRequest(req);
  res.status(status).send(body);
});

requests.put("/approve/:id", [auth, managment], async (req, res) => {
  const { status, body } = await updeteRequest(req.params.id);
  res.status(status).send(body);
});

requests.put("/assign/:id", [auth, managment], async (req, res) => {
  const { status, body } = await assignBorrow(req.params.id);
  res.status(status).send(body);
});

requests.put("/return/:id", [auth, managment], async (req, res) => {
  const { status, body } = await returnBorrow(req);
  res.status(status).send(body);
});

requests.delete("/:id", [auth, admin], async (req, res) => {
  const { status, body } = await deleteRequest(req.params.id);
  res.status(status).send(body);
});

export default requests;
