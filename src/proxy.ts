import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /trainer/login は除外
  if (pathname === "/trainer/login") return NextResponse.next();

  // /trainer/* を保護
  if (pathname.startsWith("/trainer")) {
    const auth = req.cookies.get("trainer_session")?.value;
    if (!auth || auth !== process.env.TRAINER_SESSION_TOKEN) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/trainer/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/trainer/:path*"],
};
