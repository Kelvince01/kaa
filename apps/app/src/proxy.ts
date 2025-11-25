import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// This function can be marked `async` if using `await` inside
export function proxy(_request: NextRequest) {
  // return NextResponse.redirect(new URL("/home", request.url));
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  // matcher: "/about/:path*",
};
