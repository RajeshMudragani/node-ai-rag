import express from "express";
import helmet from "helmet";
import cors from "cors";

import { env } from "./config/env.config.js";
import mainRouter from "./modules/main.router.js";
import { errorsMiddleware } from "./middlewares/errors.middleware.js";
import { requestLoggerMiddleware } from "./middlewares/request-logger.middleware.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());
app.use(cors());

app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true }));

app.use(requestLoggerMiddleware);

app.use(env.API_PREFIX, mainRouter);

app.use(errorsMiddleware);

export default app;