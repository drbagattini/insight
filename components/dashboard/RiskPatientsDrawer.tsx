'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, User, AlertTriangle, CalendarDays, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface RiskPatient {
  id: string;
  name: string;
  score: number;
  date: string; // ISO string for date
}

interface RiskPatientsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patients: RiskPatient[];
}

const RiskPatientsDrawer: React.FC<RiskPatientsDrawerProps> = ({ isOpen, onClose, patients }) => {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="bg-red-700 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-medium text-white flex items-center">
                          <AlertTriangle className="h-6 w-6 mr-2" /> Pacientes en Riesgo
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-red-700 text-red-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                            onClick={onClose}
                          >
                            <span className="sr-only">Cerrar panel</span>
                            <X className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-red-200">
                          Pacientes con puntuación WHO-5 más reciente inferior a 25.
                        </p>
                      </div>
                    </div>
                    <div className="relative flex-1 px-4 py-6 sm:px-6">
                      {patients.length > 0 ? (
                        <ul role="list" className="divide-y divide-gray-200">
                          {patients.map((patient) => (
                            <li key={patient.id} className="py-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate flex items-center">
                                    <User className="h-4 w-4 mr-2 text-gray-500" />
                                    {patient.name}
                                  </p>
                                  <p className="text-sm text-red-600 flex items-center mt-1">
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    WHO-5: {patient.score}
                                  </p>
                                  <p className="text-sm text-gray-500 flex items-center mt-1">
                                    <CalendarDays className="h-4 w-4 mr-2" />
                                    Fecha: {new Date(patient.date).toLocaleDateString()}
                                  </p>
                                </div>
                                <Link 
                                  href={`/dashboard/patients/${patient.id}`}
                                  onClick={onClose} // Close drawer on navigation
                                  className="ml-4 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                                >
                                  Ver Perfil <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-10">
                          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pacientes en riesgo</h3>
                          <p className="mt-1 text-sm text-gray-500">Actualmente, ningún paciente cumple los criterios de riesgo.</p>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                        <Button onClick={onClose} variant="outline" className="w-full">
                            Cerrar
                        </Button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default RiskPatientsDrawer;
