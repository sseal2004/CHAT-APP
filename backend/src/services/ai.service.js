import axios from "axios";

/**
 * 🔑 OpenWeather API Key
 */
const WEATHER_API_KEY = "cb6f6a9cc1bdc788480e783a5dac157e";

/**
 * Sleep helper for retry backoff
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * ✅ NEW: Fetch image URL and convert to base64 for Gemini Vision
 */
const fetchImageAsBase64 = async (imageUrl) => {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    return Buffer.from(response.data).toString("base64");
  } catch (error) {
    console.error("❌ Failed to fetch image for AI:", error.message);
    return null;
  }
};

/**
 * Generate AI response using Gemini (with retry on overload)
 * Gemini is now used ONLY for non-weather queries
 */
export const generateAIResponse = async ({ text, image, audio }) => {
  const apiUrl = process.env.GEMINI_API_URL;

  if (!apiUrl) {
    console.error("❌ GEMINI_API_URL is missing");
    return "🤖 AI configuration error.";
  }

  let parts = [];

  if (text) {
    parts.push({ text });
  }

  // ✅ ADD IMAGE SUPPORT (Cloudinary → Base64 → Gemini)
  if (image) {
    const imageBase64 = await fetchImageAsBase64(image);

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      });
    }
  }

  // ⚠️ Audio is kept as context text only (Gemini limitation)
  if (audio) {
    parts.push({
      text: "🎵 User also sent an audio message.",
    });
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await axios.post(
        apiUrl,
        {
          contents: [
            {
              role: "user",
              parts,
            },
          ],
        },
        { timeout: 15000 }
      );

      const reply =
        result?.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!reply) throw new Error("Invalid Gemini response format");

      return reply.trim();
    } catch (error) {
      const status = error?.response?.status;
      const errData = error?.response?.data;

      if (status === 503 && attempt < 3) {
        console.warn(`⚠️ Gemini overloaded (attempt ${attempt}), retrying...`);
        await sleep(1000 * attempt);
        continue;
      }

      if (status === 429) {
        console.error("⚠️ Gemini quota exceeded:", errData || error.message);
        return "🤖 AI quota exceeded. Please try again later. It will reset tomorrow.";
      }

      console.error("Gemini API Error:", errData || error.message);
      return "🤖 Sorry, AI is not available right now.";
    }
  }
};

/* ======================================================
   ✅ WEATHER LOGIC - VOICE FRIENDLY
====================================================== */

const getCoordinates = async (city) => {
  try {
    const res = await axios.get(
      "http://api.openweathermap.org/geo/1.0/direct",
      { params: { q: city, limit: 1, appid: WEATHER_API_KEY } }
    );

    if (!res.data || res.data.length === 0) return null;
    return {
      lat: res.data[0].lat,
      lon: res.data[0].lon,
      name: res.data[0].name,
      country: res.data[0].country,
    };
  } catch (err) {
    console.error("Geo API Error:", err.message);
    return null;
  }
};

export const getCurrentWeather = async (city) => {
  try {
    const coords = await getCoordinates(city);
    if (!coords)
      return `🌍 Could not find location "${city}". Please try again with a valid city name.`;

    const res = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          lat: coords.lat,
          lon: coords.lon,
          units: "metric",
          appid: WEATHER_API_KEY,
        },
      }
    );

    const d = res.data;

    return `🌍 Weather in ${coords.name}, ${coords.country}.
🕒 Updated: ${new Date(d.dt * 1000).toLocaleString("en-IN")}.

🌡️ Temperature: ${Math.round(d.main.temp)}°C. Feels like ${Math.round(
      d.main.feels_like
    )}°C.
🌤️ Condition: ${d.weather[0].description}.
💧 Humidity: ${d.main.humidity}%.
💨 Wind: ${d.wind.speed} meters per second.
☁️ Clouds: ${d.clouds.all}%.
🌅 Sunrise: ${new Date(d.sys.sunrise * 1000).toLocaleTimeString("en-IN")}.
🌇 Sunset: ${new Date(d.sys.sunset * 1000).toLocaleTimeString("en-IN")}.`;
  } catch (err) {
    console.error("Current Weather Error:", err.message);
    return "🌍 Sorry, could not fetch current weather data.";
  }
};

export const getWeatherForecast = async (city) => {
  try {
    const coords = await getCoordinates(city);
    if (!coords) return `🌍 Could not find location "${city}".`;

    const res = await axios.get(
      "https://api.openweathermap.org/data/2.5/forecast",
      {
        params: {
          lat: coords.lat,
          lon: coords.lon,
          units: "metric",
          appid: WEATHER_API_KEY,
        },
      }
    );

    const forecast = res.data.list.slice(0, 8);
    let message = `🌤 24-HOUR FORECAST for ${coords.name}, ${coords.country}\n\n`;

    forecast.forEach((f) => {
      const time = new Date(f.dt * 1000).toLocaleString("en-IN");
      message += `📅 ${time} - Temp: ${Math.round(
        f.main.temp
      )}°C, feels like ${Math.round(
        f.main.feels_like
      )}°C. ${f.weather[0].description}. Humidity ${
        f.main.humidity
      }%, Wind ${f.wind.speed}m/s.\n`;
    });

    return message;
  } catch (err) {
    console.error("Forecast API Error:", err.message);
    return "🌍 Sorry, could not fetch forecast data.";
  }
};

export const handleWeatherRequest = async (text) => {
  const lowerText = text.toLowerCase().trim();

  const locationMatch =
    lowerText.match(/in\s+([a-zA-Z\s,]+)/i) ||
    lowerText.match(/at\s+([a-zA-Z\s,]+)/i) ||
    lowerText.match(/^([a-zA-Z\s,]+)\s+weather/i) ||
    lowerText.match(/weather\s+(?:in|at|for)?\s*([a-zA-Z\s,]+)/i);

  if (!locationMatch) {
    return "🌍 Please say 'weather in [city]' or '[city] weather'";
  }

  const location = locationMatch[1].trim();

  if (/forecast|tomorrow|next|week/i.test(lowerText)) {
    return await getWeatherForecast(location);
  }

  return await getCurrentWeather(location);
};

export const chatBotHandler = async ({ text, image, audio }) => {
  const weatherKeywords =
    /\b(weather|temperature|forecast|rain|humidity|wind|sunrise|sunset|hot|cold|feels\s*like)\b/i;

  if (weatherKeywords.test(text || "")) {
    return await handleWeatherRequest(text);
  }

  return await generateAIResponse({ text, image, audio });
};
