'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientList from '@/components/patients/PatientList';
import PatientForm from '@/components/patients/PatientForm';
import { NewPatient, Patient } from '@/types/patients';

export default function PatientsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);
  const router = useRouter();

  const handleAdd = async (data: NewPatient) => {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('Error al crear paciente');
    }
    setShowForm(false);
    router.refresh();
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
