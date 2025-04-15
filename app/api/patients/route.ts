import { NextResponse } from "next/server";

export async function GET() {
  // Por ahora, devolvemos un array estático de prueba
  const patients = [
    { id: "1", name: "John Doe" },
    { id: "2", name: "Jane Smith" },
  ];
  return NextResponse.json(patients);
}
