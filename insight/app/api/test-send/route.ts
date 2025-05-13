import { NextResponse, NextRequest } from "next/server";
import { enviarCuestionarioPorCanal } from "@/app/api/cuestionarios/enviar/route";

export async function POST(req: NextRequest) {
  const { email, whatsapp, canal } = await req.json();
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const linkPublico = `${baseUrl}/test`;
    console.log('Test-send datos recibidos:', { email, whatsapp, canal, linkPublico });
    await enviarCuestionarioPorCanal(
      email,
      whatsapp,
      "Test User",
      "Test Questionnaire",
      canal,
      linkPublico
    );
    console.log('Test-send completado');
    return NextResponse.json({ success: true, link: linkPublico });
  } catch (err) {
    console.error("Error en test-send:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
