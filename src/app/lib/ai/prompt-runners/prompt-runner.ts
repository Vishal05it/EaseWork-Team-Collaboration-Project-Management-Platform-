import { llmProviders } from "../llmProviders";
import { buildPrompt } from "@/app/utils/ai/buildPrompt";
type UserMessage = {
  role: "user";
  content: string;
};
type SystemPrompt = {
  role: "system";
  content: string;
};
type Props = {
  currentMessage: UserMessage;

  systemPrompts: SystemPrompt[];
};

export async function runPrompt({
  currentMessage,

  systemPrompts,
}: Props) {
  try {
    const finalMessages = [...systemPrompts, currentMessage];
    const prompt = buildPrompt(finalMessages);
    let result = undefined;
    for (const providers of llmProviders) {
      try {
        result = await providers(prompt);
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
}
