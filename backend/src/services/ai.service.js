import axios from "axios";

/**
 * Sleep helper for retry backoff
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate AI response using Gemini (with retry on overload)
 */
export const generateAIResponse = async ({ text, image, audio }) => {
  const apiUrl = process.env.GEMINI_API_URL;

  if (!apiUrl) {
    console.error("❌ GEMINI_API_URL is missing");
    return "🤖 AI configuration error.";
  }

  let prompt = text || "";

  if (image) prompt += "\nUser sent an image.";
  if (audio) prompt += "\nUser sent a voice message.";

  // 🔁 Retry up to 3 times (for 503 overload)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await axios.post(
        apiUrl,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        },
        {
          timeout: 15000, // prevent hanging
        }
      );

      const reply =
        result?.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!reply) {
        throw new Error("Invalid Gemini response format");
      }

      return reply.trim();
    } catch (error) {
      const status = error?.response?.status;
      const errData = error?.response?.data;

      // 🟡 Gemini overload → retry
      if (status === 503 && attempt < 3) {
        console.warn(
          `⚠️ Gemini overloaded (attempt ${attempt}), retrying...`
        );
        await sleep(1000 * attempt); // 1s, 2s, 3s backoff
        continue;
      }

      // 🔴 Any other error OR final attempt
      console.error(
        "Gemini API Error:",
        errData || error.message
      );

      return "🤖 Sorry, AI is not available right now.";
    }
  }
};
