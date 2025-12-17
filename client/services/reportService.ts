import { ResearchReport } from '../types';
import { authService } from './authService';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

export const generateResearchReport = async (
  topic: string,
  trackUsage: (feature: string) => Promise<{ success: boolean; message: string; requiresSubscription?: boolean }>
): Promise<ResearchReport | null> => {
  try {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    // Track usage BEFORE making AI call
    const trackResult = await trackUsage('report');
    if (!trackResult.success) {
      console.error('Usage tracking failed:', trackResult.message);
      return null;
    }

    const response = await fetch(`${API_URL}/api/ai/generate-report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Report generation failed');
    }

    // Backend returns { content, sources }
    return {
      id: Date.now().toString(),
      topic,
      timestamp: Date.now(),
      content: data.report.content,
      sources: data.report.sources,
      // Location context and image generation can be added later
      locationContext: undefined,
      generatedImage: undefined
    };
  } catch (error) {
    console.error("Research report error:", error);
    throw error;
  }
};
