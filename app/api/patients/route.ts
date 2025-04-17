import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";

// Supabase server‑side (anon key, sin sesión persistida)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

// Schema Zod
const newPatientSchema = z.object({
  full_name: z.string().min(1, "Nombre requerido"),
  email:     z.string().email().optional(),
  whatsapp:  z.string().optional(),
});

//// ---------- GET ----------
export async function GET() {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/patients]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

//// ---------- POST ----------
export async function POST(req: NextRequest) {
  // 1) Sesión y autorización
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const psicologoId = session.user.id;

  // 2) Validar body
  const body = await req.json();
  const parsed = newPatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 3) Insertar en Supabase
  const { data, error } = await supabase
    .from("patients")
    .insert({
      psicologo_id: psicologoId,
      full_name:    parsed.data.full_name,
      email:        parsed.data.email,
      whatsapp:     parsed.data.whatsapp,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[POST /api/patients]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}