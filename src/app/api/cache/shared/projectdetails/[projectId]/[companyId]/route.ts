import { redis } from "@/app/lib/redis";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ projectId: string; companyId: string }> },
) {
  try {
    const { projectId, companyId } = await context.params;
    await redis.del(
      `projectDetails:projectId:${projectId}:companyId:${companyId}`,
    );
    return NextResponse.json({
      message: "Cache updated",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      message: "Internal Server Error",
      success: false,
    });
  }
}
