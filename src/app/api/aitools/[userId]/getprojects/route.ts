import memberModel from "@/app/models/member.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await context.params;
    const whereIamMember = await memberModel
      .find({ user: userId })
      .populate("forProject")
      .populate("user");
    return NextResponse.json({
      message: "Your projects found",
      success: true,
      projects: whereIamMember,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        success: false,
      },
      { status: 500 },
    );
  }
}
