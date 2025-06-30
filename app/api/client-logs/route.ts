import { NextRequest, NextResponse } from "next/server";

type ClientLogPayload = {
  level?: string;
  args?: any[];
  [key: string]: any;
};

export async function POST(req: NextRequest) {
  // Accept the body as JSON
  let payload: ClientLogPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (process.env.NODE_ENV !== "production") {
    const level = payload.level ?? "log";
    const safeLevel = ["log", "info", "warn", "error"].includes(level) ? level : "log";
    const message = `[CLIENT] ${safeLevel.toUpperCase()} :: ${JSON.stringify(payload)}`;
    (console as any)[safeLevel](message);
  }

  return NextResponse.json({ ok: true });
}
