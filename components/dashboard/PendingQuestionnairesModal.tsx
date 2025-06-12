"use client";

import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, ClipboardList, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PendingPatient {
  id: string;
  name: string;
  pendingCount: number;
}

interface PendingQuestionnairesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Fetches patients that have at least one active, not-consumed questionnaire link
 */
async function fetchPendingPatients() {
  const res = await fetch("/api/dashboard/pending-questionnaires");
  if (!res.ok) throw new Error("Error al cargar cuestionarios pendientes");
  return (await res.json()) as PendingPatient[];
}

export default function PendingQuestionnairesModal({
  isOpen,
  onClose,
}: PendingQuestionnairesModalProps) {
  const queryClient = useQueryClient();

  const { data = [], isLoading, isError } = useQuery<PendingPatient[]>({
    queryKey: ["pending-questionnaires", isOpen],
    enabled: isOpen,
    queryFn: fetchPendingPatients,
    refetchOnWindowFocus: false,
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const res = await fetch("/api/cuestionarios/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pacienteId: patientId }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Error al enviar recordatorio");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] });
      queryClient.invalidateQueries({ queryKey: ["pending-questionnaires"] });
    },
  });

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-center gap-3 mb-4">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ClipboardList className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                  </div>
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 text-left">
                    Cuestionarios Pendientes
                  </Dialog.Title>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {isLoading && <p className="text-sm text-gray-500">Cargando...</p>}
                  {isError && <p className="text-sm text-red-600">Error al cargar datos</p>}
                  {!isLoading && data.length === 0 && (
                    <p className="text-sm text-gray-500">No hay cuestionarios pendientes</p>
                  )}
                  {!isLoading && data.length > 0 && (
                    <ul role="list" className="divide-y divide-gray-200 list-none pl-0">
                      {data.map((patient) => (
                        <li key={patient.id} className="py-4 flex items-center justify-between">
                          <div className="pr-4">
                            <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                            <p className="text-sm text-gray-500">
                              {patient.pendingCount} cuestionario{patient.pendingCount !== 1 ? "s" : ""} pendiente{patient.pendingCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={sendReminderMutation.isPending}
                            onClick={() => sendReminderMutation.mutate(patient.id)}
                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                          >
                            {sendReminderMutation.isPending && sendReminderMutation.variables === patient.id ? "Enviando..." : "Enviar recordatorio"}
                            <Send className="ml-2 h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={onClose}
                  >
                    Cerrar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
