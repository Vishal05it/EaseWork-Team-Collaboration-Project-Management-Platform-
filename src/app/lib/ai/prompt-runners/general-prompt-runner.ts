import { buildPrompt } from "@/app/utils/ai/buildPrompt";
import { llmProviders } from "../llmProviders";

type UserMessage = {
  role: "user";
  content: string;
};
type History = {
  role: "user" | "system" | "assistant";
  content: string;
};
type SystemPrompt = {
  role: "system";
  content: string;
};
type Props = {
  currentMessage: UserMessage;
  chatHistory: History[];
  systemPrompts: SystemPrompt[];
};
export const runGeneralPrompt = async ({
  currentMessage,
  chatHistory,
  systemPrompts,
}: Props) => {
  try {
    const finalMessages = [...systemPrompts, ...chatHistory, currentMessage];
    let prompt = buildPrompt(finalMessages);
    let result = undefined;
    for (const provider of llmProviders) {
      try {
        result = await provider(prompt);
        return result;
      } catch (error) {
        console.log(error);
      }
    }
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
