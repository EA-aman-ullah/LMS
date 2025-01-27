import express from "express";
import http from "http";
import { Server } from "socket.io";
import db from "./database/db.js";
import logger from "./utils/logging.js";
import router from "./routes/router.js";
import validation from "./utils/validation.js";
import config from "./utils/config.js";
import setupSocket from "./sockets/index.js";
import "dotenv/config";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.ORIGIN_LOCALHOST, process.env.ORIGIN_VERCEL],
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

setupSocket(io);

config();
db();
validation();
router(app);

const port = process.env.PORT || 3000;
server.listen(port, () => logger.info(`Listening on Port ${port}...`));
