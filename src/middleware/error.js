import logger from "../utils/logging.js";

export default async function (error, req, res, next) {
  logger.error(`${error.message}:\nError: ${error}`);
  res.status(500).send("Something Failed.");
}
