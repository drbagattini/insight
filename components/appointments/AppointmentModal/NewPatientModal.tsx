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

      // Si la respuesta no es exitosa, manejar el error
      if (!res.ok) {
        let errorMessage = `Error al crear paciente: ${res.status} ${res.statusText}`;
        
        try {
          const errorData = await res.json();
          errorMessage = errorData?.error?.message || errorData?.error || errorMessage;
        } catch (e) {
          // No hacer nada, usar el mensaje por defecto
        }
        
        throw new Error(errorMessage);
      }
      
      // Llegados a este punto, sabemos que la respuesta es exitosa
      console.log('Paciente creado exitosamente con status:', res.status);
      
      // Necesitamos obtener el ID del paciente recién creado
      let patientId = '';
      
      try {
        // Intentar leer el objeto de la respuesta
        const responseData = await res.json();
        console.log('Respuesta de API de paciente creado:', responseData);
        
        // Si la respuesta tiene un ID, usarlo
        if (responseData && responseData.id) {
          patientId = responseData.id;
        }
      } catch (error) {
        // Si hay error al leer JSON, podría ser una respuesta vacía, seguimos con el plan B
        console.log('No se pudo obtener respuesta JSON completa de la API');
      }
      
      // Si no se pudo obtener ID de la respuesta, hacer petición adicional (Plan B)
      if (!patientId && patientData.email) {
        try {
          // Intentar obtener paciente por su email (que debe ser único)
          console.log('Buscando paciente recién creado por email:', patientData.email);
          const searchResponse = await fetch(`/api/patients?email=${encodeURIComponent(patientData.email)}`);
          const patients = await searchResponse.json();
          
          if (patients && Array.isArray(patients) && patients.length > 0 && patients[0].id) {
            patientId = patients[0].id;
            console.log('Paciente encontrado por email:', patients[0]);
          }
        } catch (searchError) {
          console.error('Error al buscar paciente por email:', searchError);
        }
      }
      
      // Si aún no tenemos ID, no podemos continuar
      if (!patientId) {
        console.error('Error: No se pudo obtener el ID del paciente creado');
        setError('Error: Paciente creado pero no se pudo recuperar su identificador');
        return;
      }
      
      // Crear el objeto paciente con el ID recuperado y el nombre que ya tenemos
      const newPatient = {
        id: patientId,
        name: patientData.name || 'Nuevo paciente' // Asegurarse de tener un valor por defecto
      };
      
      console.log('Objeto paciente creado para selección:', newPatient);
      
      // Crear un objeto simple con solo las propiedades que necesita el selector
      // Asegurándonos de que sean del tipo correcto
      const patientForSelection = {
        id: String(newPatient.id),
        name: String(newPatient.name)
      };
      
      console.log('Paciente formateado para el selector:', patientForSelection);
      
      // Notificar al componente padre con el paciente correctamente formateado
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
