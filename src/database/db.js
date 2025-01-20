import mongoose from "mongoose";
import logger from "../utils/logging.js";

export default function () {
  mongoose
    .connect(process.env.DB_CONNECTION_STRING)
    .then(() => logger.info("Connected MongoDB."));
}
