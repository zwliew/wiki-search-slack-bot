import express from "express";
import bodyParser from "body-parser";
import api from "./api";

const app = express();

app.use(bodyParser.json());
app.use("/api/v1", api);

app.use((_, res) => res.status(404).end());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Started on port ${PORT}`));
