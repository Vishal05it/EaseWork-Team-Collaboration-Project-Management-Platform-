import Groq from "groq-sdk";
export const groqAI = new Groq({
  apiKey: process.env.GROQ_KEY,
});
