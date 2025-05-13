'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DateSelectArg } from '@fullcalendar/core';
import { useQueryClient } from '@tanstack/react-query';
import { usePatients } from '@/app/hooks/usePatients';
import axios from 'axios';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDateInfo: DateSelectArg | null;
  onSave: (appointmentData: { title: string; start: string; end: string; paciente_id: string }) => void;
}

export default function AppointmentModal({
  isOpen,
  onClose,
  selectedDateInfo,
  onSave,
}: AppointmentModalProps) {
  const [title, setTitle] = useState('');
  const queryClient = useQueryClient();
  const patientsQuery = usePatients();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientWhatsapp, setNewPatientWhatsapp] = useState('');

  useEffect(() => {
    // Reset title when modal is reopened with new selection or closed
    if (isOpen) {
      setTitle(''); // Clear previous title
    } 
  }, [isOpen]);

  if (!selectedDateInfo) return null;

  const handleSubmit = () => {
    if (title.trim() && selectedDateInfo && selectedPatientId) {
      onSave({
        title: title.trim(),
        start: selectedDateInfo.startStr,
        end: selectedDateInfo.endStr,
        paciente_id: selectedPatientId,
      });
      onClose(); // Close modal after save
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div>
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Crear Nueva Cita
                    </Dialog.Title>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Paciente</label>
                        <select
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={selectedPatientId ?? ''}
                          onChange={(e) => {
                            if (e.target.value === '__new') {
                              setShowNewPatientForm(true);
                            } else {
                              setShowNewPatientForm(false);
                              setSelectedPatientId(e.target.value);
                            }
                          }}
                        >
                          <option value="">Seleccionar paciente...</option>
                          {patientsQuery.data?.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                          <option value="__new">+ Nuevo paciente</option>
                        </select>
                      </div>
                      {showNewPatientForm && (
                        <div className="space-y-2 border p-2 rounded">
                          <input
                            type="text"
                            placeholder="Nombre del paciente"
                            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                            value={newPatientName}
                            onChange={e => setNewPatientName(e.target.value)}
                          />
                          <input
                            type="email"
                            placeholder="Email (opcional)"
                            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                            value={newPatientEmail}
                            onChange={e => setNewPatientEmail(e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="WhatsApp (opcional)"
                            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                            value={newPatientWhatsapp}
                            onChange={e => setNewPatientWhatsapp(e.target.value)}
                          />
                          <button
                            type="button"
                            className="mt-2 inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                            onClick={async () => {
                              const res = await axios.post('/api/patients', { name: newPatientName, email: newPatientEmail, whatsapp: newPatientWhatsapp });
                              const patient = res.data.paciente;
                              setSelectedPatientId(patient.id);
                              setShowNewPatientForm(false);
                              queryClient.invalidateQueries({ queryKey: ['patients'] });
                            }}
                          >
                            Crear paciente
                          </button>
                        </div>
                      )}
                      <div>
                        <label htmlFor="appointment-title" className="block text-sm font-medium text-gray-700">
                          Título de la cita
                        </label>
                        <input
                          type="text"
                          id="appointment-title"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Ej: Sesión con Juan Pérez"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Inicio:</strong> {new Date(selectedDateInfo.startStr).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Fin:</strong> {new Date(selectedDateInfo.endStr).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                    onClick={handleSubmit}
                  >
                    Guardar Cita
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    onClick={onClose}
                  >
                    Cancelar
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
