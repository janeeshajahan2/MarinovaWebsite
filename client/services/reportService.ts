import { GoogleGenAI } from "@google/genai";
import { fetchWeatherData } from "./weatherService";
import { ResearchReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface AnalysisResult {
  isLocationSpecific: boolean;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  imagePrompt: string;
}

export const generateResearchReport = async (topic: string): Promise<ResearchReport> => {
  // 1. Analyze Topic for Location Context & Visual Prompt
  // We use Flash for fast reasoning/JSON extraction
  const analysisPrompt = `
    Analyze the marine/ocean research topic: "${topic}".
    Return a valid JSON object (no markdown formatting) with:
    1. "isLocationSpecific": boolean (true if the topic implies a specific place like "Great Barrier Reef" or "Bermuda Triangle", false for general concepts like "Whale migration").
    2. "latitude": number or null (approximate center).
    3. "longitude": number or null (approximate center).
    4. "locationName": string or null (canonical name).
    5. "imagePrompt": string (A highly detailed, scientific, photorealistic prompt to visualize this topic. Do not include text in the image).
  `;

  const analysisResp = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: analysisPrompt,
    config: { responseMimeType: 'application/json' }
  });

  const analysis: AnalysisResult = JSON.parse(analysisResp.text || "{}");

  // 2. Parallel Execution: Research Text, Real-time Data, Visuals
  const promises: Promise<any>[] = [];

  // A. Generate Report Text with Google Search Grounding
  const reportPrompt = `
    Create a detailed scientific research report on: "${topic}".
    
    Structure:
    # ${topic}
    ## Executive Summary
    (Brief overview)
    
    ## Published Research & Literature
    (List key papers, recent studies, and findings. Use the search tool to find real published papers.)
    
    ## Real-time Significance
    (Why is this relevant today? Any recent events?)
    
    ## Technical Analysis
    (Deep dive into the biological/oceanographic mechanisms)
  `;

  // Using gemini-3-pro-preview for high quality writing and reasoning
  const textPromise = ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: reportPrompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  promises.push(textPromise);

  // B. Generate Image
  if (analysis.imagePrompt) {
    const imagePromise = ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: analysis.imagePrompt }] }
    });
    promises.push(imagePromise);
  } else {
    promises.push(Promise.resolve(null));
  }

  // C. Fetch Weather (if location specific)
  let weatherData = null;
  if (analysis.isLocationSpecific && analysis.latitude && analysis.longitude) {
    try {
      weatherData = await fetchWeatherData(analysis.latitude, analysis.longitude);
    } catch (e) {
      console.warn("Could not fetch weather for report location", e);
    }
  }

  // Wait for AI tasks
  const [textResult, imageResult] = await Promise.all(promises);

  // 3. Process Results
  
  // Extract Sources from Grounding Metadata
  const sources = textResult.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.filter((c: any) => c.web?.uri)
    .map((c: any) => ({ 
      title: c.web.title || "Web Source", 
      url: c.web.uri 
    })) || [];

  // Extract Image
  let generatedImageUrl: string | undefined;
  if (imageResult) {
     for (const cand of imageResult.candidates || []) {
        for (const part of cand.content.parts) {
            if (part.inlineData) {
                generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
     }
  }

  return {
    id: Date.now().toString(),
    topic,
    timestamp: Date.now(),
    content: textResult.text || "Report generation incomplete.",
    sources,
    locationContext: (weatherData && analysis.locationName) ? {
      name: analysis.locationName,
      lat: analysis.latitude!,
      lon: analysis.longitude!,
      weather: weatherData
    } : undefined,
    generatedImage: generatedImageUrl ? {
      url: generatedImageUrl,
      prompt: analysis.imagePrompt
    } : undefined
  };
};
