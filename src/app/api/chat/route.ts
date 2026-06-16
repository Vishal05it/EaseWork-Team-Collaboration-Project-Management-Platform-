import { generateResponse } from "@/app/lib/ai/ai";
import { DEFAULT_SYSTEM_PROMPT } from "@/app/lib/ai/systemPrompt";
import { redis } from "@/app/lib/redis";
import aichatModel from "@/app/models/aichat.model";
import { promptToObject } from "@/app/utils/ai/promptToObject";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, userId } = body;
    if (!content) {
      return NextResponse.json(
        {
          message: "Message is required",
          success: false,
        },
        { status: 400 },
      );
    }
    if (typeof content !== "string") {
      return NextResponse.json(
        {
          message: "Message must be a string",
          success: false,
        },
        { status: 400 },
      );
    }
    if (content.trim().length === 0) {
      return NextResponse.json(
        {
          message: "Cannot send empty message",
          success: false,
        },
        { status: 400 },
      );
    }
    if (content.trim().length > 1000) {
      return NextResponse.json(
        {
          message: "Message cannot be of more than 1000 characters",
          success: false,
        },
        { status: 400 },
      );
    }
    let chatHistory = [];
    let availableCache = await redis.get(`aiChat:user:${userId}`);
    if (availableCache) {
      chatHistory = JSON.parse(availableCache);
    } else {
      chatHistory = await aichatModel
        .find({ messageFor: userId })
        .sort({ addedMs: -1 })
        .limit(100);
      chatHistory = chatHistory.reverse();
    }
    let response = await generateResponse({
      currentMessage: promptToObject(content),
      chatHistory,
      systemPrompts: [
        {
          role: "system",
          content: DEFAULT_SYSTEM_PROMPT,
        },
      ],
    });
    if (response) {
      let newUserMessage = await aichatModel.create([
        {
          messageFor: userId,
          addedMs: Date.now(),
          role: "user",
          content,
        },
        {
          messageFor: userId,
          addedMs: Date.now(),
          role: "assistant",
          content: response,
        },
      ]);

      let updatedHistory = await aichatModel
        .find({ messageFor: userId })
        .sort({ addedMs: -1 })
        .limit(100);
      await redis.del(`aiChat:user:${userId}`);
      await redis.set(
        `aiChat:user:${userId}`,
        JSON.stringify(updatedHistory.reverse()),
      );
    }
    return NextResponse.json(
      {
        message: response,
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      message: "Internal Server Error",
      success: false,
    });
  }
}
