import mongoose from "mongoose";

const aiMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed, // ✅ Accepts ObjectId or string
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    text: {
      type: String,
      default: "",
    },

    image: {
      type: String, // Cloudinary URL
      default: null,
    },

    audio: {
      type: String, // Cloudinary URL
      default: null,
    },

    metadata: {
      type: Object,
      default: {}, // Optional, store Gemini API info
    },
  },
  { timestamps: true }
);

export const AIMessage = mongoose.model("AIMessage", aiMessageSchema);
