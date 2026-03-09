import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import demandeRoutes from "./routes/demande.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/demandes", demandeRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Demande Service Running " });
});

const PORT = process.env.PORT || 3007;

app.listen(PORT, () => {
  console.log(`Demande service running on port ${PORT}`);
});