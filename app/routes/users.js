import express from "express";
import {
  getCurrentUser,
  getStudent,
  getUserOpenRequests,
  reSendOtp,
  sendOtpOnregister,
  sentOtpOnforgetPassword,
  setPassword,
  verifyOTP,
} from "../controller/usersController.js";
import auth from "../middleware/auth.js";
import managment from "../middleware/managment.js";
import handleImage from "../middleware/multerCofing.js";

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

users.post("/register", async (req, res) => {
  const { status, body } = await sendOtpOnregister(req);
  res.status(status).send(body);
});

users.get("/resend-otp/:id", async (req, res) => {
  const { status, body } = await reSendOtp(req);
  res.status(status).send(body);
});

users.post("/verify-otp/:id", async (req, res) => {
  const { status, header: token, body } = await verifyOTP(req);
  res.status(status).header("Authorization", `Bearer ${token}`).send(body);
});

users.post("/forget-password", async (req, res) => {
  const { status, body } = await sentOtpOnforgetPassword(req);
  res.status(status).send(body);
});

users.post("/save-password/:id", auth, async (req, res) => {
  const { status, header: token, body } = await setPassword(req);
  res.status(status).header("Authorization", `Bearer ${token}`).send(body);
});

users.get("/open-requests/:id", auth, async (req, res) => {
  const { status, body } = await getUserOpenRequests(req);
  res.status(status).send(body);
});

export default users;
