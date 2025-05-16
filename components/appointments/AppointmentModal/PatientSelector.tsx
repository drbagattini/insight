"use client";

import { Fragment, useState, useEffect } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, UserPlusIcon } from '@heroicons/react/20/solid';
import NewPatientModal from './NewPatientModal';

// Placeholder Patient type - replace with actual type from your data model
export interface Patient {
  id: string;
  name: string;
  // Add other relevant patient fields, e.g., email, phone
}

interface PatientSelectorProps {
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;
  isDisabled?: boolean; // Deshabilitar selector cuando estamos en modo edición
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({
  selectedPatient,
  setSelectedPatient,
  isDisabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);

  const filteredPatients = query === ''
    ? patients
    : patients.filter((patient) =>
        patient.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(query.toLowerCase().replace(/\s+/g, ''))
      );

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/patients');
        if (!response.ok) {
          throw new Error('Failed to fetch patients: ' + response.status);
        }
        const data = await response.json();
        setPatients(data as Patient[]); 
      } catch (err) {
        console.error('Failed to fetch patients:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setPatients([]);
      }
      setIsLoading(false);
    };

    fetchPatients();
  }, []);

  // Estado para controlar la visibilidad del modal de nuevo paciente
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  return (
    <div className="w-full">
      <Combobox value={selectedPatient} onChange={setSelectedPatient} disabled={isDisabled}>
        <div className="relative mt-1">
          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-gray-700 text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
            <Combobox.Input
              className={`w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-0 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              displayValue={(patient: Patient | null) => patient?.name || ''}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar paciente..."
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-20">
              {isLoading && (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                  Cargando pacientes...
                </div>
              )}
              {error && (
                <div className="relative cursor-default select-none px-4 py-2 text-red-700 dark:text-red-400">
                  Error: {error}
                </div>
              )}
              {!isLoading && !error && filteredPatients.length === 0 && query === '' && (
                 <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                  No hay pacientes disponibles. Puede crear uno nuevo.
                </div>
              )}
              {filteredPatients.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                  No se encontraron pacientes.
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <Combobox.Option
                    key={patient.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-teal-600 text-white' : 'text-gray-900 dark:text-gray-100'
                      }`
                    }
                    value={patient}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {patient.name}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-white' : 'text-teal-600'
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
              {/* Eliminamos la opción del dropdown */}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
      
      {/* Botón para abrir el modal de nuevo paciente */}
      {!isDisabled && (
        <div className="mt-2 text-right">
          <button
            type="button" 
            onClick={() => setShowNewPatientModal(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center bg-transparent border-none cursor-pointer"
          >
            <UserPlusIcon className="h-4 w-4 mr-1" />
            Crear nuevo paciente
          </button>
        </div>
      )}
      
      {/* Modal para crear nuevo paciente */}
      <NewPatientModal 
        isOpen={showNewPatientModal}
        onClose={() => setShowNewPatientModal(false)}
        onPatientCreated={(newPatient) => {
          // Seleccionar automáticamente el paciente recién creado
          setSelectedPatient({
            id: newPatient.id,
            name: newPatient.name
          });
        }}
      />
    </div>
  );
};

export default PatientSelector;
