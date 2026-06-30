import { GoogleGenAI } from "@google/genai";
if (!process.env.GEMINI_API_KEY) throw new Error("AI Key missing");
export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});
