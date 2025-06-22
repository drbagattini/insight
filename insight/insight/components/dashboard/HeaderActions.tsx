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
    <div className="w-full bg-white p-4 shadow-sm sticky top-0 z-10 mb-6">
      <div className="flex justify-end space-x-3">
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
