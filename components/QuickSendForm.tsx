"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { usePatients } from "@/app/hooks/usePatients";

interface QuickSendFormProps {
  cuestionarioId: string;
  onSuccess?: () => void;
}

export default function QuickSendForm({
  cuestionarioId,
  onSuccess,
}: QuickSendFormProps) {
  const { data: patients = [], isLoading: loadingPatients } = usePatients();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/cuestionarios/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteId: selectedPatientId,
          cuestionarioId,
          canal: channel,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al enviar cuestionario");
      }
      return res.json();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    sendMutation.mutate(undefined, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Paciente
        </label>
        {loadingPatients ? (
          <p className="text-gray-500">Cargando pacientes...</p>
        ) : (
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            required
          >
            <option value="">Seleccionar paciente...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || "Paciente sin nombre"}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Canal de envío
        </label>
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          value={channel}
          onChange={(e) => setChannel(e.target.value as "email" | "whatsapp")}
        >
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={sendMutation.isPending || !selectedPatientId}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {sendMutation.isPending ? "Enviando..." : "Enviar cuestionario"}
      </button>

      {sendMutation.isSuccess && (
        <p className="text-green-600 text-sm">
          ¡Cuestionario enviado correctamente!
        </p>
      )}
      {sendMutation.isError && (
        <p className="text-red-600 text-sm">
          {(sendMutation.error as Error).message}
        </p>
      )}
    </form>
  );
}
