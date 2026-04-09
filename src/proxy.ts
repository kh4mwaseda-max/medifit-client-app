import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 認証不要ページ
  if (pathname === "/trainer/login" || pathname === "/trainer/register") {
    return NextResponse.next();
  }

  // /trainer/* を保護
  if (pathname.startsWith("/trainer")) {
    const trainerId = req.cookies.get("trainer_id")?.value;
    // 後方互換: 旧 trainer_session でもOK（移行期間）
    const legacySession = req.cookies.get("trainer_session")?.value;

    if (!trainerId && legacySession !== process.env.TRAINER_SESSION_TOKEN) {
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
