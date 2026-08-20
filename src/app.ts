import express from "express";
import helmet from "helmet";
import cors from "cors";

import mainRouter from "./modules/main.router.js";
import { errorsMiddleware } from "./middlewares/errors.middleware.js";
import { requestLoggerMiddleware } from "./middlewares/request-logger.middleware.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());
app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(requestLoggerMiddleware);

app.use("/api/v1", mainRouter);

app.use(errorsMiddleware);

export default app;