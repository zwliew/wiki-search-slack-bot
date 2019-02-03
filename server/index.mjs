import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";

import router from "./router";

const app = express();

app.use(helmet());
app.use(bodyParser.json());
app.use("/api/v1", router);

app.use((_, res) => res.status(404).end());

export default app;
