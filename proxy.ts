import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const dest = request.headers.get("sec-fetch-dest");
  const accept = request.headers.get("accept") ?? "";
  if (dest === "document" || accept.includes("text/html")) {
    response.headers.set("Accept-CH", "Sec-CH-UA-Platform-Version");
    response.headers.set("Critical-CH", "Sec-CH-UA-Platform-Version");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|vendor/).*)"],
};
