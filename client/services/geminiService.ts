
import { GoogleGenAI } from "@google/genai";
import { WeatherResponse } from "../types";

// Initialize client lazily to avoid crash if key is missing on load
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key missing! Make sure GEMINI_API_KEY is set in .env");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeWeather = async (
  locationName: string,
  lat: number,
  lon: number,
  weatherData: WeatherResponse
): Promise<string> => {
  try {
    const current = weatherData.current;
    const daily = weatherData.daily;
    
    // Get 7-day trend summary
    const tempTrend = `${daily.temperature_2m_min[0]}°C - ${daily.temperature_2m_max[0]}°C`;
    const rainForecast = daily.precipitation_sum.slice(0, 3).map(p => `${p}mm`).join(', ');

    const prompt = `
      Act as an expert marine meteorologist. Analyze the detailed weather data for ${locationName} (Lat: ${lat}, Lon: ${lon}) provided by MARINOVA's sensor network.

      CURRENT CONDITIONS:
      - Temp: ${current.temperature_2m}°C (Feels like ${current.apparent_temperature}°C)
      - Pressure: ${current.pressure_msl} hPa
      - Wind: ${current.wind_speed_10m} km/h (Gusts: ${current.wind_gusts_10m} km/h) at ${current.wind_direction_10m}°
      - Visibility: ${weatherData.hourly.visibility[0] / 1000} km
      - Cloud Cover: ${current.cloud_cover}%
      - UV Index Today: ${daily.uv_index_max[0]}
      
      FORECAST (Next 3 Days):
      - Temps: ${tempTrend}
      - Precip: ${rainForecast}
      - Max Winds: ${Math.max(...daily.wind_speed_10m_max.slice(0,3))} km/h

      Provide a "Captain's Intelligence Brief":
      1. **Situation**: Brief summary of current sea/air state (Stability, Visibility).
      2. **Advisory**: Specific warnings for mariners (Gale force, Squalls, Fog, UV exposure).
      3. **Outlook**: What to expect over the next 48 hours.
      4. **Ocean Fact**: A short, fascinating fact about this specific coordinates/ocean region.

      Tone: Professional, nautical, yet accessible. Do not mention external data providers.
    `;

    const ai = getAiClient();
    if (!ai) return "API Key missing. Please configure GEMINI_API_KEY.";

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Unable to generate AI analysis at this time.";
  }
};