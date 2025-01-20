import express from "express";
import { getToken } from "../controller/authController.js";

const auth = express.Router();

auth.post("/", async (req, res) => {
  const { status, header, body } = await getToken(req);
  res.status(status).header("Authorization", `Bearer ${header}`).send(body);
});

export default auth;
