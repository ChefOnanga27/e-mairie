import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import mairieRoutes from "./routes/mairie.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/mairies", mairieRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Mairie Service " });
});

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`Mairie service running on port ${PORT}`);
});