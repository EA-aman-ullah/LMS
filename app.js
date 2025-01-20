import express from "express";
import http from "http";
import { Server } from "socket.io";
import db from "./src/database/db.js";
import logger from "./src/utils/logging.js";
import router from "./src/routes/router.js";
import validation from "./src/utils/validation.js";
import config from "./src/utils/config.js";
import "dotenv/config";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

config();
db();
validation();
router(app);

const port = process.env.PORT || 3000;
app.listen(port, () => logger.info(`Listening on Port ${port}...`));
