import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// ✅ ADD THIS IMPORT (your AI service / util)
import { generateAIResponse } from "../services/ai.service.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // ✅ Mark messages as seen
    await Message.updateMany(
      {
        senderId: userToChatId,
        receiverId: myId,
        seen: { $ne: true },
      },
      { $set: { seen: true } }
    );

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    // ✅ Notify sender that messages were seen
    const senderSocketId = getReceiverSocketId(userToChatId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", {
        from: myId,
      });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, audioDuration } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl = null;
    let audioUrl = null;

    // 🖼️ Image upload (Base64)
    if (typeof image === "string" && image.startsWith("data:")) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "chat-images",
      });
      imageUrl = uploadResponse.secure_url;
    }

    // 🎤 Audio upload (Base64)
    if (typeof audio === "string" && audio.startsWith("data:")) {
      const uploadResponse = await cloudinary.uploader.upload(audio, {
        resource_type: "video", // required for audio
        folder: "chat-audio",
      });
      audioUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      audio: audioUrl,
      audioDuration,
    });

    await newMessage.save();

    // 🔥 send to receiver in real-time
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // 🔥 send back to sender
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", newMessage);
    }

    /* ===================== 🤖 AI LOGIC (ADDED) ===================== */

    const receiverUser = await User.findById(receiverId);

    if (receiverUser?.isAI) {
      // Send text + image + audio to AI
      const aiReplyText = await generateAIResponse({
        text,
        image: imageUrl,
        audio: audioUrl,
      });

      const aiMessage = new Message({
        senderId: receiverId,   // AI is sender
        receiverId: senderId,   // user is receiver
        text: aiReplyText,
      });

      await aiMessage.save();

      // Send AI reply to user in realtime
      const userSocketId = getReceiverSocketId(senderId);
      if (userSocketId) {
        io.to(userSocketId).emit("newMessage", aiMessage);
      }
    }

    /* ===================== 🤖 END AI LOGIC ===================== */

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
