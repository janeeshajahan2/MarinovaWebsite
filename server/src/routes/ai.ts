import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import * as aiService from '../services/aiService';
import { WeatherResponse } from '../types';

const router = Router();

/**
 * POST /api/ai/analyze-weather
 * Generate weather analysis brief
 */
router.post('/analyze-weather', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { locationName, lat, lon, weatherData } = req.body as {
      locationName: string;
      lat: number;
      lon: number;
      weatherData: WeatherResponse;
    };

    if (!locationName || !lat || !lon || !weatherData) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const analysis = await aiService.analyzeWeather(locationName, lat, lon, weatherData);

    res.json({ success: true, analysis });
  } catch (error: any) {
    console.error('Weather analysis error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to generate weather analysis' 
    });
  }
});

/**
 * POST /api/ai/chat
 * Generate chat response
 */
router.post('/chat', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, imageUrls } = req.body as {
      messages: Array<{ role: string; content: string }>;
      imageUrls?: string[];
    };

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ success: false, message: 'Invalid messages format' });
      return;
    }

    const response = await aiService.generateChatResponse(messages, imageUrls);

    res.json({ success: true, response });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to generate chat response' 
    });
  }
});

/**
 * POST /api/ai/generate-report
 * Generate research report
 */
router.post('/generate-report', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic } = req.body as { topic: string };

    if (!topic || typeof topic !== 'string') {
      res.status(400).json({ success: false, message: 'Topic is required' });
      return;
    }

    const report = await aiService.generateResearchReport(topic);

    res.json({ success: true, report });
  } catch (error: any) {
    console.error('Research report error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to generate research report' 
    });
  }
});

/**
 * POST /api/ai/generate-insights
 * Generate monthly ocean insights
 */
router.post('/generate-insights', auth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const insights = await aiService.generateMonthlyInsights();

    res.json({ success: true, insights });
  } catch (error: any) {
    console.error('Insights generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to generate insights' 
    });
  }
});

/**
 * POST /api/ai/generate-image
 * Generate image using DALL-E
 */
router.post('/generate-image', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body as { prompt: string };

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ success: false, message: 'Prompt is required' });
      return;
    }

    const imageUrl = await aiService.generateImage(prompt);

    res.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to generate image' 
    });
  }
});

export default router;
