import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';

// Use the current stable model
const GEMINI_MODEL = 'gemini-2.5-flash';

const getGeminiApiKey = (): string => {
  // 1. Check .env file (if using expo-updates/dotenv)
  const fromEnv = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
  if (fromEnv) return fromEnv;

  // 2. Fallback to app.config.js / app.json (via Expo Constants)
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const fromExtra = typeof extra.EXPO_PUBLIC_GEMINI_API_KEY === 'string'
    ? extra.EXPO_PUBLIC_GEMINI_API_KEY.trim()
    : '';

  return fromExtra;
};

export const GeminiService = {
  /**
   * Sends a message to Gemini while maintaining chat history for memory
   * @param message The user's new message
   * @param history The previous chat history array
   */
  async askTutor(
    message: string, 
    history: { role: 'user' | 'model', text: string }[]
  ): Promise<string> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error("API Key not found. Please check your .env or app.config.js");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Format the history for Gemini's startChat method
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }],
      })),
      generationConfig: {
        maxOutputTokens: 10000,
      },
    });

    try {
      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
};