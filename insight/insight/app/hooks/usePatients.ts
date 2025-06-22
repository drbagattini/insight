"use client";
import { useQuery } from "@tanstack/react-query";

interface Patient {
  id: string;
  name: string;
}

async function fetchPatients(): Promise<Patient[]> {
  const res = await fetch("/api/patients");
  if (!res.ok) {
    throw new Error("Error fetching patients");
  }
  return res.json();
}

export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });
}
