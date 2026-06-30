import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";

export function proxy(req: NextRequest) {
  let cookieStore = req.cookies;
  let authToken = cookieStore.get("authToken")?.value;
  //console.log("Token in proxy :", authToken);
  if (!authToken) return NextResponse.redirect(new URL("/login", req.url));
  const SECRET_KEY = process.env.SECRET_KEY;
  if (!SECRET_KEY) throw new Error("Secret key not found!");
  if (authToken) {
    let decode: any | JwtPayload = jwt.verify(authToken, SECRET_KEY as string);
    // console.log("Decode : ", decode);
    if (!decode.userId)
      return NextResponse.redirect(new URL("/login", req.url));
  }
  const { pathname } = req.nextUrl;
  if (
    authToken &&
    (pathname == "/login" ||
      pathname == "/signup" ||
      pathname == "/forgotpassword")
  )
    return NextResponse.redirect(new URL("/", req.url));
  const publicRoutes = ["/login", "/signup", "/forgotpassword"];
  if (authToken && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/createproject",
    "/profile",
    "/editprofile",
    "/editproject/:path*",
    "/editcompany",
    "/projects/:path*",
    "/pendingusers",
    "/pendingprojects",
    "/notifications",
    "/changepassword",
    "/changecredentials",
    "/resetpassword",
    "/companydetails",
    "/chat:path*",
    "/",
  ],
};
