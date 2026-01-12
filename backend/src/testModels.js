import dotenv from "dotenv";
dotenv.config(); // loads GEMINI_API_KEY from .env

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
  );
  const data = await res.json();
  console.log("Available Gemini models:", data);
}

listModels();
