import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import contribuableRoutes from "./routes/contribuable.routes.js";

dotenv.config();

const app = express();


// MIDDLEWARES

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));


// ROUTES

app.use("/api/contribuables", contribuableRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "API eMairie " });
});


// SERVER START

const PORT = process.env.PORT || 3006 ;

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});