import { ChatMessage, ChatAttachment } from '../types';
import { authService } from './authService';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

/**
 * Send message to backend AI chat endpoint
 * For now, simplified without function calling - Claude will provide text responses
 */
export const sendMessageToGemini = async (
  history: ChatMessage[], 
  currentMessage: string, 
  attachments: ChatAttachment[],
  trackUsage: (feature: string) => Promise<{ success: boolean; message: string; requiresSubscription?: boolean }>
): Promise<ChatMessage> => {
  try {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    // Track usage BEFORE making AI call
    const trackResult = await trackUsage('chat');
    if (!trackResult.success) {
      // Return error message if tracking failed
      return {
        id: Date.now().toString(),
        role: 'model',
        text: trackResult.message || 'Unable to process request. Please check your subscription.',
        timestamp: Date.now()
      };
    }

    // Convert attachments to base64 URLs for sending to backend
    const imageUrls: string[] = [];
    for (const att of attachments) {
      if (att.type === 'image') {
        // For images, send the data URL
        imageUrls.push(att.url);
      }
    }

    // Format conversation history
    const messages = history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.text
    }));

    // Add current message
    messages.push({
      role: 'user',
      content: currentMessage
    });

    const response = await fetch(`${API_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Chat failed');
    }

    return {
      id: Date.now().toString(),
      role: 'model',
      text: data.response,
      timestamp: Date.now(),
      visualizations: [] // For now, no visualizations - can add later
    };
  } catch (error) {
    console.error("Chat service error:", error);
    return {
      id: Date.now().toString(),
      role: 'model',
      text: "I encountered an error processing your request. Please try again.",
      timestamp: Date.now()
    };
  }
};