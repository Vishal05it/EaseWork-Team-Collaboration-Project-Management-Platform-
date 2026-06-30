import { promptToObject } from "@/app/utils/ai/promptToObject";
import { runPrompt } from "../ai/prompt-runners/prompt-runner";
import { DEFAULT_SYSTEM_PROMPT } from "./system-prompts/systemPrompt";

export const intentClassifier = async (content: string) => {
  return await runPrompt({
    currentMessage: promptToObject(content),
    systemPrompts: [
      {
        role: "system",
        content: DEFAULT_SYSTEM_PROMPT,
      },
    ],
  });
};
