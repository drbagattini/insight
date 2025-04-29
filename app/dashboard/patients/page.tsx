'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import PatientList from '@/components/patients/PatientList';
import PatientForm from '@/components/patients/PatientForm';
import LinkModal from '@/components/common/LinkModal';
import { NewPatient, Patient } from '@/types/patients';
import { QUERY_KEYS } from '@/lib/constants';

export default function PatientsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [modalLink, setModalLink] = useState('');
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
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
  // Muestra modal interno para confirmar eliminación
  const handleDelete = (patient: Patient) => {
    setDeletePatient(patient);
  };

  // Confirmar y ejecutar borrado
  const confirmDelete = async () => {
    if (!deletePatient) return;
    try {
      const res = await fetch(`/api/patients/${deletePatient.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar paciente');
      }
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PATIENTS });
      setDeletePatient(null);
    } catch (error) {
      console.error('Error eliminando paciente:', error);
      alert((error as Error).message || 'Error al eliminar paciente');
    }
  };
  const handleSendQuestionnaire = async (patient: Patient) => {
    try {
      const res = await fetch('/api/cuestionarios/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacienteId: patient.id }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        alert(`Error: ${data.error || 'Error al enviar cuestionario'}`);
        return;
      }
      
      // Mostrar modal con el link copiable
      setModalLink(data.link);
      setShowModal(true);
    } catch (err) {
      console.error('Error al enviar cuestionario:', err);
      alert('Error al enviar cuestionario');
    }
  };
  const handleViewEvolution = (patient: Patient) => {
    router.push(`/dashboard/patients/${patient.id}`);
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-2">Cuestionario enviado exitosamente</h2>
            <p>Link: <input type="text" value={modalLink} readOnly className="w-full p-2 border border-gray-300" /></p>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación de borrado */}
      {deletePatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Confirmar eliminación</h2>
            <p className="mb-6">¿Seguro que deseas eliminar al paciente {deletePatient.name}?</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setDeletePatient(null)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <PatientList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSendQuestionnaire={handleSendQuestionnaire}
        onViewEvolution={handleViewEvolution}
      />
    </div>
  );
}
