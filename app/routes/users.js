import express from "express";
import {
  createUser,
  getCurrentUser,
  getStudent,
} from "../controller/usersController.js";
import auth from "../middleware/auth.js";
import managment from "../middleware/managment.js";

const users = express.Router();

users.get("/me", auth, async (req, res) => {
  const user = await getCurrentUser(req);
  res.send(user);
});

users.get("/students", [auth, managment], async (req, res) => {
  const students = await getStudent();
  res.send(students);
});
users.get("/students/:id", [auth, managment], async (req, res) => {
  const { status, body } = await getStudent(req.params.id);
  res.status(status).send(body);
});

users.post("/", async (req, res) => {
  const { status, header, body } = await createUser(req);
  res.status(status).header("x-auth-token", header).send(body);
});

export default users;
