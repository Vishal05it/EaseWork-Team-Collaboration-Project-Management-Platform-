import { connectToDB } from "@/app/lib/connectToDB";
import { redis } from "@/app/lib/redis";
import aichatModel from "@/app/models/aichat.model";
import userModel from "@/app/models/user.model";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
type Docs = {
  messageFor: string;
  addedMs: number;
  content: string;
  role: "user" | "assistant" | "system";
};
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await context.params;
    let cachedBotMessages = await redis.get(`aiChatAllMessages:user:${userId}`);
    if (cachedBotMessages) {
      return NextResponse.json({
        message: "All bot messages found from cache",
        success: true,
        messages: JSON.parse(cachedBotMessages),
      });
    }
    await connectToDB();
    const user = await userModel.findById(userId);
    if (!user)
      return NextResponse.json({ message: "User not found", success: false });
    const allMessages = await aichatModel
      .find({
        messageFor: userId,
      })
      .sort({
        addedMs: -1,
      });
    await redis.set(
      `aiChatAllMessages:user:${userId}`,
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
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    let { userId } = await context.params;
    const topics = [
      ["Hi, my name is Vishal.", "Nice to meet you, Vishal!"],
      ["I'm building EaseWork AI.", "That sounds like an exciting project."],
      [
        "My favourite language is TypeScript.",
        "TypeScript is excellent for large projects.",
      ],
      [
        "I enjoy working with Redis.",
        "Redis is great for caching and real-time systems.",
      ],
      [
        "My favourite framework is Next.js.",
        "Next.js works very well for full-stack apps.",
      ],
      ["I like backend development.", "Backend engineering is very rewarding."],
      [
        "My favourite database is MongoDB.",
        "MongoDB is flexible for many applications.",
      ],
      ["I have a friend named Rahul.", "I'll remember Rahul."],
      ["My dog's name is Bruno.", "Bruno is a nice name."],
      ["I enjoy science fiction movies.", "Sci-fi can be fascinating."],
      ["I like reading technical books.", "Continuous learning is important."],
      [
        "I want to become a better AI engineer.",
        "Practice through projects is a great approach.",
      ],
      ["I built a Socket.IO chat app.", "Real-time systems are fun to build."],
      [
        "I enjoy solving backend problems.",
        "Problem-solving is a valuable skill.",
      ],
      ["I drink coffee while coding.", "Coffee and coding often go together."],
    ];
    const docs: Docs[] = [];
    const base = Date.now();
    // console.log("******* New Iteration Started ********");
    for (let i = 0; i < 50; i++) {
      const pair = topics[i % topics.length];
      for (let j = 0; j < pair.length; j++) {
        if (i != 0) {
          if (j == 0) {
            docs[docs.length] = {
              messageFor: userId,
              addedMs: docs[docs.length - 1].addedMs + 1,
              role: j % 2 === 0 ? "user" : "assistant",
              content: pair[j % 2],
            };
          } else {
            docs[docs.length] = {
              messageFor: userId,
              addedMs: docs[docs.length - 1].addedMs + 1,
              role: j % 2 === 0 ? "user" : "assistant",
              content: pair[j % 2],
            };
          }
        } else if (i == 0) {
          if (j == 0) {
            docs[docs.length] = {
              messageFor: userId,
              addedMs: base,
              role: j % 2 === 0 ? "user" : "assistant",
              content: pair[j % 2],
            };
          } else if (j == 1) {
            docs[docs.length] = {
              messageFor: userId,
              addedMs: base + 1,
              role: j % 2 === 0 ? "user" : "assistant",
              content: pair[j % 2],
            };
          }
        }
      }
    }
    //console.log("Docs : ", docs);
    await connectToDB();
    let feedData = await aichatModel.insertMany(docs);
    return NextResponse.json({
      message: "Data feeded successfully",
      success: true,
      feedData: docs,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.ValidationError) {
      let messages = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json({
        message: messages[0],
        success: false,
      });
    }
    return NextResponse.json({
      message: "Internal Server Error",
      success: true,
    });
  }
}
