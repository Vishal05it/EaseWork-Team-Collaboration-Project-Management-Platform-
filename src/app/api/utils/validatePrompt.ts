import { NextResponse } from "next/server";

export const validatePrompt = (content: string) => {
  console.log("Content received : ", content);
  if (!content || content.toString().length == 0) {
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
  if (content.toString().trim().length === 0) {
    return NextResponse.json(
      {
        message: "Cannot send empty message",
        success: false,
      },
      { status: 400 },
    );
  }
  if (content.toString().trim().length > 1000) {
    return NextResponse.json(
      {
        message: "Message cannot be of more than 1000 characters",
        success: false,
      },
      { status: 400 },
    );
  }
  return true;
};
