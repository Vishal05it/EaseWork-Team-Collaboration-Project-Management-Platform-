import { buildPrompt } from "../../utils/ai/buildPrompt";
import { ai } from "./gemini";
type UserMessage = {
  role: "user";
  content: string;
};
type Message = {
  role: "user" | "system" | "assistant";
  content: string;
};
type Props = {
  currentMessage: UserMessage;
  chatHistory: Message[];
  systemPrompts: Message[];
};

export async function generateResponse({
  currentMessage,
  chatHistory,
  systemPrompts,
}: Props) {
  try {
    const finalMessages = [...systemPrompts, ...chatHistory, currentMessage];
    const prompt = buildPrompt(finalMessages);
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return result.text;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
