import { gemini } from "./models/gemini";
import { groqAI } from "./models/groq";
import { openRouter } from "./models/openai";

const callGemini = async (prompt: string) => {
  const geminiModels = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
  for (let geminiModel of geminiModels) {
    try {
      //console.log(`${geminiModel} Gemini Model called`);
      let result = await gemini.models.generateContent({
        model: geminiModel,
        contents: prompt,
      });
      return result.text;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
};
const callOpenRouter = async (prompt: string) => {
  console.log("Open Router called");
  const freeModels = [
    "google/gemma-3-27b-it:free",
    "qwen/qwen3-32b:free",
    "deepseek/deepseek-r1-0528:free",
    "meta-llama/llama-3.3-70b-instruct:free",
  ];
  let result;
  for (let freeModel of freeModels) {
    console.log(`${freeModel} AI Model called`);
    try {
      result = await openRouter.chat.completions.create({
        model: freeModel,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });
      return result.choices[0].message.content ?? "";
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
};
const callGroq = async (prompt: string) => {
  try {
    console.log("Groq AI called");
    let result;
    result = await groqAI.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    return result.choices[0].message.content ?? "";
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const llmProviders = [callGemini, callGroq, callOpenRouter];
