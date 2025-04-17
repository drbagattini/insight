'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import PatientList from '@/components/patients/PatientList';
import PatientForm from '@/components/patients/PatientForm';
import { NewPatient, Patient } from '@/types/patients';
import { QUERY_KEYS } from '@/lib/constants';

export default function PatientsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleAdd = async (data: NewPatient) => {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Error creating patient:', errorData);
      
      // Si es un error de validación (400), mostrar los errores de campos
      if (res.status === 400 && errorData.error?.fieldErrors) {
        const fieldErrors = errorData.error.fieldErrors;
        const errorMessages = Object.entries(fieldErrors)
          .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
          .join('\n');
        throw new Error(errorMessages);
      }
      
      // Si es otro tipo de error, mostrar el mensaje del servidor o uno genérico
      throw new Error(errorData.error?.message || errorData.error || 'Error al crear paciente');
    }

    // Invalidar la caché de pacientes para que se vuelva a cargar
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PATIENTS });
    setShowForm(false);
  };
  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setShowForm(true);
  };
  const handleDelete = (patient: Patient) => {
    console.log('Eliminar paciente', patient.id);
  };
  const handleSendQuestionnaire = (patient: Patient) => {
    console.log('Enviar cuestionario a', patient.id);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <button
          onClick={() => { setEditingPatient(undefined); setShowForm(true); }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Agregar Paciente
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <PatientForm
              patient={editingPatient}
              onSubmit={handleAdd}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      <PatientList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSendQuestionnaire={handleSendQuestionnaire}
      />
    </div>
  );
}
