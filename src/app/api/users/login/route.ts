import userModel from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectToDB } from "@/app/lib/connectToDB";
import companyModel from "@/app/models/company.model";
import mongoose from "mongoose";
import { redis } from "@/app/lib/redis";
companyModel;
export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    let body = await req.json();

    let userExist = await userModel.findOne({ email: body.email });
    if (!userExist) {
      return NextResponse.json({
        message: "Email not registered or account not approved yet",
        success: false,
      });
    }
    let matchPass = await bcrypt.compare(body.password, userExist.password);
    if (!matchPass) {
      return NextResponse.json({
        message: "Invalid Credentials",
        success: false,
      });
    }
    if (!userExist.allowed) {
      return NextResponse.json({
        message: `Account not activated, payment status : ${userExist.paymentStatus}`,
        success: false,
        status: 401,
        user: userExist._id,
      });
    }
    let sendUser = await userModel
      .findById(userExist._id)
      .select("-password -allowed")
      .populate("companyId");

    const SECRET_KEY = process.env.SECRET_KEY;
    let authToken = jwt.sign({ userId: userExist._id }, SECRET_KEY as string, {
      expiresIn: "5d",
    });
    let response = NextResponse.json({
      message: "Logged in successfully",
      success: true,
      user: sendUser,
    });
    response.cookies.set("authToken", authToken, {
      httpOnly: true,
      sameSite: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 5 * 24 * 60 * 60 * 1000,
    });
    await redis.set(`isLogin:userId:${userExist._id}`, JSON.stringify(true));
    await redis.set(
      `profileData:userId:${userExist._id}`,
      JSON.stringify({
        message: "User found successfully from Redis",
        success: true,
        user: sendUser,
      }),
    );
    console.log("Response : ", response.cookies.getAll());
    return response;
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json({
        message: messages[0],
        success: false,
      });
    }
    return NextResponse.json({
      message: "Internal Server Error",
      success: false,
    });
  }
}
