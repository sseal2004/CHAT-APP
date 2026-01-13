import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";
import aiRoutes from "./routes/ai.route.js";



const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

/* -------------------- ALLOWED ORIGINS -------------------- */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
];

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.json({ limit: "10mb" })); // allow up to 10 MB JSON payloads
app.use(express.urlencoded({ limit: "10mb", extended: true })); // for form data
app.use(cookieParser());

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/* -------------------- ROUTES -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ai", aiRoutes);


/* -------------------- PRODUCTION -------------------- */
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(
      path.join(__dirname, "../frontend", "dist", "index.html")
    );
  });
}

/* -------------------- START SERVER -------------------- */
server.listen(PORT, () => {
  console.log(`✅ Server running on PORT: ${PORT}`);
  connectDB();
});