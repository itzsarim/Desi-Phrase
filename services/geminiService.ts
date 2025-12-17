import { GoogleGenAI, Type } from "@google/genai";
import { FALLBACK_WORDS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchWordsForCategory = async (categoryPrompt: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a list of 80 distinct, recognizable, and fun Indian words or short phrases related to the category '${categoryPrompt}' for a game of Catchphrase. 
      The words should be culturally relevant to India.
      Do not include extremely obscure items. 
      Mix easy and medium difficulty.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const jsonStr = response.text;
    if (!jsonStr) {
        throw new Error("Empty response from Gemini");
    }
    
    const words = JSON.parse(jsonStr) as string[];
    
    // Shuffle the words
    return words.sort(() => Math.random() - 0.5);

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return shuffled fallback words if API fails
    return [...FALLBACK_WORDS].sort(() => Math.random() - 0.5);
  }
};