import express from "express";
import db from "./app/database/db.js";
import logger from "./app/utils/logging.js";

const app = express();

db();

const port = process.env.PORT || 3000;
app.listen(port, () => logger.info(`Listning on Port ${port}...`));
