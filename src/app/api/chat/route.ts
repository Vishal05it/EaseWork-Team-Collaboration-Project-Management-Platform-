import { redis } from "@/app/lib/redis";
import aichatModel from "@/app/models/aichat.model";
import { promptToObject } from "@/app/utils/ai/promptToObject";
import { ApiError } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { retreiveHistory } from "../utils/retrieveHistory";
import { intentClassifier } from "@/app/lib/ai/intentClassifier";
import { GENERAL_SYSTEM_PROMPT } from "@/app/lib/ai/system-prompts/generalSystemPrompt";
import { executeTool } from "@/app/lib/ai/actions/executeTool";
import { SUMMARIZE_PROMPT } from "@/app/lib/ai/system-prompts/summarizePrompt";
import { aiOverloadResponse } from "../utils/aioverload";
import { validatePrompt } from "../utils/validatePrompt";
import { runGeneralPrompt } from "@/app/lib/ai/prompt-runners/general-prompt-runner";
import { runPrompt } from "@/app/lib/ai/prompt-runners/prompt-runner";
type PlanAction = {
  type: string;
  actions: [
    {
      tool: string;
      parameters: any[];
    },
  ];
  missingInfo: string;
};
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, userId } = body;
    let validateResponse = validatePrompt(content);
    if (validateResponse != true) return validateResponse;
    let responseToUser: string | undefined;
    let intnentJson: string | undefined = await intentClassifier(content);
    if (!intnentJson) return aiOverloadResponse;
    console.log("JSON received : ", intnentJson);
    const parsedResponse: PlanAction = JSON.parse(intnentJson);
    let botResponse = parsedResponse;
    console.log("Intent is :", botResponse);
    if (botResponse.type == "GENERAL_CHAT") {
      let chatHistory = [];
      chatHistory = await retreiveHistory(userId);
      responseToUser = await runGeneralPrompt({
        currentMessage: promptToObject(content),
        chatHistory,
        systemPrompts: [
          {
            role: "system",
            content: GENERAL_SYSTEM_PROMPT,
          },
        ],
      });
    } else if (botResponse.type === "UNKNOWN")
      responseToUser = "Sorry, I can't do that";
    else if (botResponse.type == "MISSING_INFO") {
      responseToUser = botResponse.missingInfo;
    } else {
      let collectedResponse: any[] = [];
      await Promise.all(
        botResponse.actions.map(async (action) => {
          let toolData: any;
          // console.log("Actions parameters are : ", action.parameters);
          if (action.parameters && action.parameters.length > 0) {
            toolData = await executeTool(
              action.tool,
              userId,
              action.parameters,
            );
          } else toolData = await executeTool(action.tool, userId, null);
          if (toolData) {
            collectedResponse.push({
              tool: action.tool,
              data: toolData,
            });
          }
        }),
      );
      let sendToLLM = JSON.stringify(collectedResponse, null, 2);
      console.log("Final Prompt : ", promptToObject(sendToLLM));
      responseToUser = await runPrompt({
        currentMessage: promptToObject(sendToLLM),
        systemPrompts: [
          {
            role: "system",
            content: SUMMARIZE_PROMPT,
          },
        ],
      });
      if (!responseToUser) {
        return aiOverloadResponse;
      }
    }
    await redis.del(`aiChatAllMessages:user:${userId}`);
    // console.log("Bot message : ", responseToUser);
    let newUserMessage = await aichatModel.create([
      {
        messageFor: userId,
        addedMs: Date.now(),
        role: "user",
        content,
      },
    ]);
    let newBotMessage = await aichatModel.create({
      messageFor: userId,
      addedMs: Date.now(),
      role: "assistant",
      content: responseToUser,
    });
    return NextResponse.json(
      {
        message: responseToUser,
        success: true,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.log(error);
    if (error instanceof ApiError) {
      return aiOverloadResponse;
    }
    return NextResponse.json({
      message: "Internal Server Error",
      success: false,
    });
  }
}
