"use client";
import React from "react";
import { usePatients } from "../hooks/usePatients";

export default function PatientsPage() {
  const { data, isLoading, error } = usePatients();

  if (isLoading) return <div>Cargando pacientes...</div>;
  if (error) return <div>Ocurrió un error al cargar los pacientes</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pacientes</h1>
      <ul className="space-y-2">
        {data?.map((patient) => (
          <li key={patient.id} className="p-2 bg-gray-50 rounded-lg">
            {patient.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
