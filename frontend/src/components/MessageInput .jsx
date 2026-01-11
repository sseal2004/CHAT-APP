import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Mic, Square, Smile } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // ✅ Emoji states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojis = ["😀", "😂", "😍", "😎", "👍", "🔥", "❤️", "🎉", "🙏", "😢"];

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const { sendMessage } = useChatStore();

  /* ---------------- IMAGE ---------------- */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ---------------- AUDIO ---------------- */

  // ✅ Convert Blob → Base64
  const convertBlobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        // ✅ Store blob + preview URL
        setAudioPreview({
          blob: audioBlob,
          url: audioUrl,
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error("Microphone access denied");
      console.error(error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const removeAudio = () => {
    setAudioPreview(null);
  };

  /* ---------------- EMOJI ---------------- */
  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioPreview) return;

    try {
      let audioBase64 = null;

      // ✅ Convert audio blob → base64 before sending
      if (audioPreview?.blob) {
        audioBase64 = await convertBlobToBase64(audioPreview.blob);
      }

      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        audio: audioBase64,
      });

      setText("");
      setImagePreview(null);
      setAudioPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* AUDIO PREVIEW */}
      {audioPreview && (
        <div className="mb-3 flex items-center gap-2">
          <audio controls src={audioPreview.url} className="w-64" />
          <button
            onClick={removeAudio}
            className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center"
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2 relative">
          {/* INPUT WITH EMOJI */}
          <div className="relative w-full">
            <input
              type="text"
             className="w-full input input-bordered rounded-lg h-10 sm:h-12 pr-12 sm:pr-10" 


              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            {/* EMOJI BUTTON INSIDE INPUT */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
             className="hidden sm:block absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 
text-zinc-400 hover:text-primary p-1 sm:p-0 "


            >
              <Smile size={20} />
            </button>

            {/* EMOJI PICKER */}
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 bg-base-200 shadow-lg rounded-lg p-2 grid grid-cols-5 gap-2 z-50">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="text-xl hover:scale-110 transition"
                    onClick={() => addEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          {/* IMAGE BUTTON */}
          <button
            type="button"
            className={`flex sm:flex btn btn-circle
              ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>

          {/* VOICE BUTTON */}
          <button
            type="button"
            className={`btn btn-circle ${
              isRecording ? "text-red-500" : "text-zinc-400"
            }`}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview && !audioPreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
