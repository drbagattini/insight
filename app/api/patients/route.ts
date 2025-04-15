import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
