import { NextResponse } from "next/server";

export const aiOverloadResponse = NextResponse.json(
  {
    message:
      "I'm currently receiving too many requests. Please try again in a few moments.",
    success: false,
  },
  { status: 429 },
);
