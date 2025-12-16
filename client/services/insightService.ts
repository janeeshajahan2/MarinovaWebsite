import { GoogleGenAI } from "@google/genai";
import { OceanInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const CACHE_KEY = 'marinova_insights_cache';
const CACHE_TIMESTAMP_KEY = 'marinova_insights_ts';

export const getMonthlyInsights = async (): Promise<OceanInsight[]> => {
  // 1. Check Local Storage Cache (valid for 24 hours)
  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (cachedData && cachedTime && (now - parseInt(cachedTime) < ONE_DAY)) {
    return JSON.parse(cachedData);
  }

  // 2. Generate New Data if cache invalid
  try {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 15);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 15);

    const prompt = `
      Generate a JSON array of 30 oceanographic insights/predictions covering the dates from ${pastDate.toISOString().split('T')[0]} to ${futureDate.toISOString().split('T')[0]}.
      
      Each object must follow this schema:
      {
        "date": "YYYY-MM-DD",
        "title": "Short, Punchy Headline",
        "type": "Prediction" | "Observation" | "Anomaly" | "Event",
        "region": "Specific Ocean or Sea (e.g., North Atlantic, Sargasso Sea)",
        "description": "2-sentence scientific summary. Mention specific metrics if possible (temps, salinity, species).",
        "confidence": number (0-100, use 100 for past Observations),
        "severity": "Low" | "Medium" | "Critical" | "Positive",
        "tags": ["Tag1", "Tag2"]
      }

      Focus on diverse topics:
      - Marine heatwaves and coral bleaching alerts.
      - Whale/Shark migration patterns.
      - Algal blooms (Red Tide).
      - Salinity shifts due to ice melt.
      - Deep sea discoveries.
      - Major storm formations affecting sea state.

      Ensure the dates are sequential.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    let insights: OceanInsight[] = JSON.parse(response.text || "[]");
    
    // Add IDs and ensure data integrity
    insights = insights.map((item, index) => ({
        ...item,
        id: `insight-${Date.now()}-${index}`,
    }));

    // Sort by date descending
    insights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(insights));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());

    return insights;

  } catch (error) {
    console.error("Failed to generate insights", error);
    return [];
  }
};
