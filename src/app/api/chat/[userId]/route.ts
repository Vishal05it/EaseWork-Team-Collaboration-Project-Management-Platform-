import { connectToDB } from "@/app/lib/connectToDB";
import { redis } from "@/app/lib/redis";
import aichatModel from "@/app/models/aichat.model";
import userModel from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await context.params;
    let cachedHistory = await redis.get(`aiChat:user:${userId}`);
    if (cachedHistory) {
      return NextResponse.json({
        message: "All bot messages found from cache",
        success: true,
        messages: JSON.parse(cachedHistory),
      });
    }
    await connectToDB();
    const user = await userModel.findById(userId);
    if (!user)
      return NextResponse.json({ message: "User not found", success: false });
    const allMessages = await aichatModel
      .find({ messageFor: userId })
      .sort({ addedMs: -1 })
      .limit(100);
    await redis.set(
      `aiChat:user:${userId}`,
      JSON.stringify(allMessages.reverse()),
    );
    return NextResponse.json({
      message: "All bot messages found",
      success: true,
      messages: allMessages.reverse(),
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      message: "Internal Server Error",
      success: false,
    });
  }
}
