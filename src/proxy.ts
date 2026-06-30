import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getSessionTokenFromRequest,
  verifySessionToken,
} from "@/lib/auth/session";

const PUBLIC_PATHS = ["/", "/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getSessionTokenFromRequest(request);
  const session = token ? await verifySessionToken(token) : null;

  if (pathname.startsWith("/api/auth/") || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    if (session && pathname === "/") {
      return NextResponse.redirect(new URL("/censo", request.url));
    }

    if (session?.type === "admin" && pathname === "/admin") {
      return NextResponse.redirect(new URL("/censo", request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/censo") || pathname.startsWith("/api/census") || pathname.startsWith("/api/apartment/")) {
    if (!session) {
      const loginUrl = new URL("/", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin/")) {
    if (pathname === "/api/admin/login") {
      return NextResponse.next();
    }

    if (!session || session.type !== "admin") {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin", "/censo/:path*", "/api/census/:path*", "/api/apartment/:path*", "/api/admin/:path*"],
};
