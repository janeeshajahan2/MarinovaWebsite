import { OceanInsight } from '../types';
import { authService } from './authService';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';
const CACHE_KEY = 'marinova_insights_cache';
const CACHE_TIMESTAMP_KEY = 'marinova_insights_ts';

export const getMonthlyInsights = async (
  trackUsage: (feature: string) => Promise<{ success: boolean; message: string; requiresSubscription?: boolean }>
): Promise<OceanInsight[]> => {
  // 1. Check Local Storage Cache (valid for 24 hours)
  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (cachedData && cachedTime && (now - parseInt(cachedTime) < ONE_DAY)) {
    console.log('Using cached insights - no credit deduction');
    return JSON.parse(cachedData);
  }

  // 2. Generate New Data from backend if cache invalid
  try {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    //Track usage BEFORE making AI call (only if generating new insights)
    const trackResult = await trackUsage('insights');
    if (!trackResult.success) {
      console.error('Usage tracking failed:', trackResult.message);
      return [];
    }

    const response = await fetch(`${API_URL}/api/ai/generate-insights`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Insights generation failed');
    }

    const insights: OceanInsight[] = data.insights;
    
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
