import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import songsRouter from "./routes/songs.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Task 5 backend is running"
  });
});

app.use("/api/songs", songsRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});