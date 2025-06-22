"use client";

import { Fragment, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import QuickSendForm from "@/components/QuickSendForm";

interface QuickSendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cuestionarioId?: string;
}

export default function QuickSendDialog({
  isOpen,
  onClose,
  cuestionarioId,
}: QuickSendDialogProps) {
  const [selectedId, setSelectedId] = useState<string>(cuestionarioId ?? "");

  const { data: questionnaires = [], isLoading: loadingQuestionnaires } = useQuery<{ id: string; codigo: string }[]>({
    queryKey: ["questionnaires"],
    queryFn: async () => {
      const res = await fetch("/api/questionnaires");
      if (!res.ok) throw new Error("Error al cargar cuestionarios");
      return res.json();
    },
    enabled: !cuestionarioId, // solo cargar si no viene predefinido
  });

  useEffect(() => {
    if (!cuestionarioId && questionnaires.length > 0 && !selectedId) {
      setSelectedId(questionnaires[0].id);
    }
  }, [cuestionarioId, questionnaires, selectedId]);

  const idToSend = cuestionarioId ?? selectedId;
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                {/* Close button */}
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  Enviar cuestionario
                </Dialog.Title>

                {!cuestionarioId && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cuestionario</label>
                    {loadingQuestionnaires ? (
                      <p className="text-gray-500">Cargando cuestionarios...</p>
                    ) : (
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                      >
                        {questionnaires.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.codigo}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
                {idToSend && (
                  <QuickSendForm
                  cuestionarioId={idToSend}
                  onSuccess={onClose}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
