import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // text message
    text: {
      type: String,
      default: "",
    },

    // image message
    image: {
      type: String,
      default: "",
    },

    // 🎤 voice message
    audio: {
      type: String, // URL to audio file
      default: "",
    },

    audioDuration: {
      type: Number, // seconds
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
