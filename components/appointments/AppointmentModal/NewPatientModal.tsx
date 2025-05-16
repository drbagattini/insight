// Componente para crear nuevos pacientes sin salir del flujo de agenda
import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import PatientForm from '../../patients/PatientForm';
import { Patient, NewPatient } from '@/types/patients';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated: (patient: { id: string; name: string }) => void;
}

export default function NewPatientModal({ isOpen, onClose, onPatientCreated }: NewPatientModalProps) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleSubmit = async (patientData: NewPatient) => {
    try {
      // Llamar a la API para crear el paciente
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || errorData.error || 'Error al crear paciente');
      }

      // Obtener el paciente creado
      const newPatient = await res.json();
      
      // Ya tenemos el paciente completo desde la API, no necesitamos recargar
      console.log('Paciente creado exitosamente:', newPatient);
      
      // Construir un objeto paciente completo para el selector
      const patientForSelection = {
        id: String(newPatient.id),
        name: String(newPatient.name || 'Paciente sin nombre')
      };
      
      // Verificar que el objeto es válido antes de devolverlo
      console.log('Paciente para selección:', patientForSelection);
      
      // Notificar al componente padre con el paciente completo
      onPatientCreated(patientForSelection);
      
      // Cerrar el modal y dar tiempo para que el evento fluya al selector
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear paciente');
      console.error('Error al crear paciente:', err);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/30 dark:bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                >
                  Crear Nuevo Paciente
                </Dialog.Title>
                
                {error && (
                  <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-md">
                    {error}
                  </div>
                )}

                <div className="mt-4">
                  <PatientForm 
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                  />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
