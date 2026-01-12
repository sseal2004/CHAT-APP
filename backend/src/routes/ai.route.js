import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAIMessages, sendAIMessage } from "../controllers/ai.controller.js";

const router = express.Router();

router.get("/", protectRoute, getAIMessages);
router.post("/send", protectRoute, sendAIMessage);

export default router;
