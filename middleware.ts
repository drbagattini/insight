import { NextRequest, NextResponse } from "next/server";

const ALLOW = [
  /^\/api\/healthz$/,
  /^\/_next\//,
  /^\/favicon\.ico$/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
  /^\/.*\.(png|jpg|jpeg|svg|ico|css|js|map|woff2?)$/i,
  /^\/api\/preview-lock$/,   // permitir POST del lock
  /^\/preview-lock$/         // permitir la página del lock
];

export function middleware(req: NextRequest) {
  // Sólo activar en preview
  if (process.env.VERCEL_ENV !== "preview") return NextResponse.next();

  const { pathname } = req.nextUrl || {};
  if (ALLOW.some(r => r.test(pathname))) return NextResponse.next();

  const cookie = req.cookies?.get?.("p_stg")?.value || null;
  if (cookie === "1") return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/preview-lock";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/:path*"]
};
