'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import React from 'react';

interface HeaderActionsProps {
  onNewPatientClick: () => void;
  onScheduleAppointmentClick: () => void;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({ onNewPatientClick, onScheduleAppointmentClick }) => {
  return (
    <div className="mb-8">
      {/* Título principal */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Resumen asistencial</h1>
        <p className="text-lg text-gray-600">Vista general de tu práctica clínica</p>
      </div>
      
      {/* Acciones principales alineadas a la derecha */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
        <Button onClick={onNewPatientClick} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="mr-2 h-4 w-4" /> Nuevo paciente
        </Button>
        <Button onClick={onScheduleAppointmentClick} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="mr-2 h-4 w-4" /> Programar cita
        </Button>
      </div>
    </div>
  );
};

export default HeaderActions;
