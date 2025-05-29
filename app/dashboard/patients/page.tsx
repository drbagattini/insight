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
  
  // Handle patient form submission (create/update)
  const handlePatientSubmit = async (data: NewPatient) => {
    try {
      const url = editingPatient?.id 
        ? `/api/patients/${editingPatient.id}`
        : '/api/patients';
      const method = editingPatient?.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error al guardar el paciente');
      }

      // Refresh the patients list
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PATIENTS });
      setShowForm(false);
      setEditingPatient(undefined);
    } catch (error) {
      console.error('Error saving patient:', error);
      throw error; // Let the form handle the error
    }
  };

  // Handle editing a patient
  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setShowForm(true);
  };

  // Handle deleting a patient
  const handleDelete = (patient: Patient) => {
    setDeletePatient(patient);
  };

  // Confirm and execute patient deletion
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

  // Handle sending questionnaire to patient
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
      
      // Show modal with the shareable link
      setModalLink(data.link);
      setShowModal(true);
    } catch (err) {
      console.error('Error al enviar cuestionario:', err);
      alert('Error al enviar cuestionario');
    }
  };

  // Navigate to patient's evolution page
  const handleViewEvolution = (patient: Patient) => {
    router.push(`/dashboard/patients/${patient.id}`);
  };

  // Close the patient form
  const handleFormClose = () => {
    setShowForm(false);
    setEditingPatient(undefined);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Lista de pacientes */}
      <div className="bg-white rounded-lg shadow p-6">
        <PatientList
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewEvolution={handleViewEvolution}
          onSendQuestionnaire={handleSendQuestionnaire}
          hideTitle={true}
        />
      </div>

      {/* Patient Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 pt-20 overflow-y-auto z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">
                {editingPatient ? 'Editar Paciente' : 'Agregar Nuevo Paciente'}
              </h2>
              <PatientForm
                patient={editingPatient}
                onSubmit={handlePatientSubmit}
                onCancel={handleFormClose}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletePatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmar eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar a <span className="font-medium">{deletePatient.name}</span>? 
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeletePatient(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questionnaire Link Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cuestionario Enviado</h3>
            <p className="text-gray-600 mb-4">El enlace del cuestionario ha sido generado:</p>
            <div className="mb-4">
              <input
                type="text"
                value={modalLink}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
