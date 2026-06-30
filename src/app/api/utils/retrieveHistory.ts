import { redis } from "@/app/lib/redis";
import aichatModel from "@/app/models/aichat.model";

export async function retreiveHistory(userId: string) {
  try {
    const allMessages = await aichatModel
      .find({ messageFor: userId })
      .sort({ addedMs: -1 })
      .limit(50);
    // console.log("History from utils : ", allMessages);
    return allMessages.reverse();
  } catch (error) {
    console.log(error);
    return [];
  }
}
