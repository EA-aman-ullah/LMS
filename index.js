import express from "express";
import db from "./app/database/db.js";
import logger from "./app/utils/logging.js";
import router from "./app/routes/router.js";
import validation from "./app/utils/validation.js";
import config from "./app/utils/config.js";

const app = express();

config();
db();
validation();
router(app);

const port = process.env.PORT || 3000;
app.listen(port, () => logger.info(`Listening on Port ${port}...`));
