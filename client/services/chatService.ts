import { GoogleGenAI, FunctionDeclaration, Type, Part } from "@google/genai";
import { ChatMessage, ChatAttachment } from "../types";
import { fetchWeatherData, transformToChartData, fetchHistoricalData } from "./weatherService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper: File to Base64 ---
export const fileToPart = async (file: File): Promise<Part> => {
  return new Promise<Part>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- Function Declarations ---
const renderChartFunction: FunctionDeclaration = {
  name: 'render_chart',
  description: 'Display a real-time weather chart for a specific location. Use this to visualize temperature, wind, or precipitation data.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      locationName: { type: Type.STRING, description: 'Name of the city or ocean region' },
      latitude: { type: Type.NUMBER, description: 'Latitude of the location' },
      longitude: { type: Type.NUMBER, description: 'Longitude of the location' },
    },
    required: ['locationName', 'latitude', 'longitude']
  }
};

const renderHistoricalTrendFunction: FunctionDeclaration = {
  name: 'render_historical_trend',
  description: 'Visualize historical temperature and weather trends for a location over a period of time (e.g., last 10 years).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      locationName: { type: Type.STRING },
      latitude: { type: Type.NUMBER },
      longitude: { type: Type.NUMBER },
      yearsBack: { type: Type.NUMBER, description: "Number of years to go back (e.g., 10)" }
    },
    required: ['locationName', 'latitude', 'longitude']
  }
};

const renderMapFunction: FunctionDeclaration = {
  name: 'render_map',
  description: 'Show a map view for a specific location.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      locationName: { type: Type.STRING },
      latitude: { type: Type.NUMBER },
      longitude: { type: Type.NUMBER },
    },
    required: ['locationName', 'latitude', 'longitude']
  }
};

const generateImageFunction: FunctionDeclaration = {
  name: 'generate_image',
  description: 'Generate an image to visually explain a concept, marine creature, or underwater environment.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: 'Detailed prompt for image generation' }
    },
    required: ['prompt']
  }
};

// --- Main Chat Function ---
export const sendMessageToGemini = async (
  history: ChatMessage[], 
  currentMessage: string, 
  attachments: ChatAttachment[]
): Promise<ChatMessage> => {

  // 1. Prepare Content
  const parts: Part[] = [];
  
  // Add attachments
  for (const att of attachments) {
    const part = await fileToPart(att.file);
    parts.push(part);
  }
  
  // Add text
  if (currentMessage) {
    parts.push({ text: currentMessage });
  }

  // 2. Setup Chat Model with Tools
  const model = "gemini-3-pro-preview"; 
  
  const chat = ai.chats.create({
    model: model,
    config: {
      tools: [{ functionDeclarations: [renderChartFunction, renderHistoricalTrendFunction, renderMapFunction, generateImageFunction] }],
      systemInstruction: `You are Captain, an expert marine biologist and oceanographer.
      
      YOUR EXPERTISE COVERS:
      - Marine Life: Identification, behavior, habitats, and physiology of all sea creatures (fish, mammals, cephalopods, corals, deep-sea life).
      - Ocean Ecosystems: Coral reefs, kelp forests, abyssal zones, mangroves, and polar seas.
      - Oceanography: Currents, tides, marine chemistry, plate tectonics, and underwater geology.
      - Conservation: Endangered species, plastic pollution, climate change effects, and sustainable fishing.
      - Maritime History: Famous explorations, shipwrecks, and naval history.
      
      DATA SOURCES:
      - Real-time weather, forecast, and historical data is retrieved from MARINOVA's proprietary Global Sensor Network and Satellite Constellation.
      - General knowledge and biological reasoning are provided by Google Gemini.
      
      CAPABILITIES:
      - Analyze data, explain concepts, and control the dashboard interface.
      - Use 'render_chart' for weather/climate data.
      - Use 'render_historical_trend' for long-term climate analysis.
      - Use 'generate_image' to visualize marine animals, underwater scenes, or diagrams.
      
      BEHAVIOR:
      - Be enthusiastic and educational about the ocean.
      - If a user asks about marine life, provide detailed biological facts.
      - When you use tools, you MUST explain the data or image shown in your final response.
      - If asked where you get your weather data, cite MARINOVA's internal satellite feeds. Do NOT mention Open-Meteo or external APIs.
      `,
    }
  });

  // 3. Send Message
  let result = await chat.sendMessage({
    message: parts.length > 0 ? parts : "Hello"
  });

  const responseMessage: ChatMessage = {
    id: Date.now().toString(),
    role: 'model',
    text: "",
    timestamp: Date.now(),
    visualizations: []
  };

  // 4. Handle Function Calls
  const functionCalls = result.functionCalls;
  
  if (functionCalls && functionCalls.length > 0) {
    const functionResponseParts: Part[] = [];

    for (const call of functionCalls) {
      if (call.name === 'render_chart') {
        const { latitude, longitude, locationName } = call.args as any;
        try {
          // Fetch real data
          const weatherData = await fetchWeatherData(latitude, longitude);
          const chartData = transformToChartData(weatherData);
          
          // Add to UI visualizations
          responseMessage.visualizations?.push({
            type: 'chart',
            data: { locationName, chartData }
          });

          // Pass data back to model for explanation
          const summaryData = {
            current: weatherData.current,
            daily_forecast: weatherData.daily,
            info: `Chart displayed to user for ${locationName}. Use this data to explain the weather trends.`
          };

          functionResponseParts.push({
            functionResponse: {
                name: call.name,
                response: { result: summaryData },
                id: call.id
            }
          });
        } catch (e) {
          console.error("Failed to fetch chart data", e);
          functionResponseParts.push({
            functionResponse: {
                name: call.name,
                response: { error: "Failed to fetch weather data." },
                id: call.id
            }
          });
        }
      }
      else if (call.name === 'render_historical_trend') {
        const { latitude, longitude, locationName, yearsBack = 10 } = call.args as any;
        try {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - 5); // Archive has a slight delay
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - yearsBack);

            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const histData = await fetchHistoricalData(latitude, longitude, startStr, endStr);
            
            // Map daily archive data to the chart format
            const chartData = histData.daily.time.map((t: string, i: number) => ({
                time: t, // Keep YYYY-MM-DD format
                temperature_2m: histData.daily.temperature_2m_mean[i],
                precipitation: histData.daily.precipitation_sum[i],
                wind_speed_10m: histData.daily.wind_speed_10m_max[i],
                // Zero fill others
                apparent_temperature: histData.daily.temperature_2m_mean[i],
                dew_point_2m: 0,
                wind_speed_80m: 0,
                wind_gusts_10m: 0,
                wind_direction_10m: 0,
                relative_humidity_2m: 0,
                pressure_msl: 0,
                visibility: 0,
                cloud_cover: 0,
                precipitation_probability: 0
            }));

            responseMessage.visualizations?.push({
                type: 'chart',
                data: { locationName: `${locationName} (${yearsBack} Year Trend)`, chartData }
            });

            // Calculate simple stats for the model to talk about
            const temps = histData.daily.temperature_2m_mean;
            const avgTemp = (temps.reduce((a:number, b:number) => a + b, 0) / temps.length).toFixed(1);
            const maxTemp = Math.max(...temps);
            const minTemp = Math.min(...temps);

            functionResponseParts.push({
                functionResponse: {
                    name: call.name,
                    response: { result: { 
                        info: `Displayed ${yearsBack} year historical trend for ${locationName}.`,
                        stats: { avgTemp, maxTemp, minTemp, period: `${startStr} to ${endStr}` }
                    }},
                    id: call.id
                }
            });

        } catch (e) {
            console.error("Historical fetch failed", e);
            functionResponseParts.push({
                functionResponse: {
                    name: call.name,
                    response: { error: "Failed to fetch historical data." },
                    id: call.id
                }
            });
        }
      } 
      else if (call.name === 'render_map') {
        const args = call.args as any;
        responseMessage.visualizations?.push({
          type: 'map',
          data: args
        });
        
        functionResponseParts.push({
            functionResponse: {
                name: call.name,
                response: { result: `Map successfully displayed for ${args.locationName} at ${args.latitude}, ${args.longitude}` },
                id: call.id
            }
        });
      }
      else if (call.name === 'generate_image') {
        const { prompt } = call.args as any;
        try {
          const imageResponse = await ai.models.generateContent({
             model: 'gemini-2.5-flash-image',
             contents: { parts: [{ text: prompt }] }
          });
          
          let imageUrl = "";
          for (const cand of imageResponse.candidates || []) {
             for (const part of cand.content.parts) {
                 if (part.inlineData) {
                     imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                 }
             }
          }

          if (imageUrl) {
             responseMessage.visualizations?.push({
                 type: 'image',
                 data: { url: imageUrl, prompt }
             });
             
             functionResponseParts.push({
                functionResponse: {
                    name: call.name,
                    response: { result: `Image generated for prompt: "${prompt}"` },
                    id: call.id
                }
             });
          } else {
             throw new Error("No image data returned");
          }
        } catch (e) {
           console.error("Image gen failed", e);
           functionResponseParts.push({
            functionResponse: {
                name: call.name,
                response: { error: "Image generation failed." },
                id: call.id
            }
          });
        }
      }
    }

    // Send function responses back to the model to get the final explanation
    if (functionResponseParts.length > 0) {
        const postFunctionResult = await chat.sendMessage({
            message: functionResponseParts
        });
        responseMessage.text = postFunctionResult.text || "";
    } else {
        // Fallback
        responseMessage.text = "I encountered an error while trying to process the visual request.";
    }

  } else {
    // No function calls, just use the initial text
    responseMessage.text = result.text || "";
  }

  return responseMessage;
};