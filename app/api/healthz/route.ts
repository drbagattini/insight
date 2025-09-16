import { NextResponse } from 'next/server';

export async function GET() {
  const version = "0.1.0";
  const commit = process.env.GIT_COMMIT_SHA || "local";
  
  return NextResponse.json({
    ok: true,
    version,
    commit
  });
}
