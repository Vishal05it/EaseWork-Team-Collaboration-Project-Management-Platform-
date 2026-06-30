import { OpenAI } from "openai";
export const openRouter = new OpenAI({
  apiKey: process.env.OPENROUTER_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
});
