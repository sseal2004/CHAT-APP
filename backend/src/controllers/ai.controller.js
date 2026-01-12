import { AIMessage } from "../models/aiMessage.model.js";
import cloudinary from "../lib/cloudinary.js";
import { generateAIResponse } from "../services/ai.service.js";

/**
 * GET AI CHAT HISTORY
 */
export const getAIMessages = async (req, res) => {
  try {
    const messages = await AIMessage.find({ userId: req.user._id }).sort({
      createdAt: 1,
    });
    res.status(200).json(messages);
  } catch (error) {
    console.error("AI get error:", error);
    res.status(500).json({ message: "Can't get AI messages" });
  }
};

/**
 * SEND MESSAGE TO AI (TEXT / IMAGE / AUDIO)
 */
export const sendAIMessage = async (req, res) => {
  try {
    console.log("AI BODY:", req.body);

    const { text, image, audio } = req.body;

    let imageUrl = null;
    let audioUrl = null;

    // Upload image
    if (image?.startsWith("data:")) {
      const uploadedImage = await cloudinary.uploader.upload(image, {
        folder: "ai-images",
      });
      imageUrl = uploadedImage.secure_url;
    }

    // Upload audio
    if (audio?.startsWith("data:")) {
      const uploadedAudio = await cloudinary.uploader.upload(audio, {
        resource_type: "video",
        folder: "ai-audio",
      });
      audioUrl = uploadedAudio.secure_url;
    }

    // Save user message
    const userMessage = await AIMessage.create({
      userId: req.user._id,
      role: "user",
      text,
      image: imageUrl,
      audio: audioUrl,
    });

    // Generate AI response (USING EXISTING SERVICE)
    let aiReply;
    try {
      aiReply = await generateAIResponse({
        text,
        image: imageUrl,
        audio: audioUrl,
      });
    } catch (err) {
      console.error("Gemini error:", err.message);
      aiReply =
        "🤖 Sorry, AI service is temporarily unavailable. Please try again.";
    }

    // Save AI message
    const aiMessage = await AIMessage.create({
      userId: req.user._id,
      role: "assistant",
      text: aiReply,
    });

    // Frontend expects array
    res.status(201).json([userMessage, aiMessage]);
  } catch (error) {
    console.error("AI send error:", error);
    res.status(500).json({ message: "Can't send AI message" });
  }
};
