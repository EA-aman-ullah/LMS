import express from "express";
import { getOverview } from "../controller/dashboardController.js";
import auth from "../middleware/auth.js";

const dashboard = express.Router();

dashboard.get("/", auth, async (req, res) => {
  const { status, body } = await getOverview(req);
  res.status(status).send(body);
});

export default dashboard;
