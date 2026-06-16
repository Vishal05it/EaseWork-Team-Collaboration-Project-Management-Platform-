type Message = {
  role: "user" | "system" | "assistant";
  content: string;
};
export const buildPrompt = (prompts: Message[]) => {
  let finalPrompt = "";
  for (let promptObj of prompts) {
    finalPrompt += `${promptObj.role}:\n${promptObj.content}\n\n`;
  }
  return finalPrompt;
};
