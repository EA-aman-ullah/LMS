import mongoose from "mongoose";
import logger from "../utils/logging.js";

export default function () {
  mongoose
    .connect("mongodb://localhost/LMS")
    .then(() => logger.info("Connected MongoDB."));
}
