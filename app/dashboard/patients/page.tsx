'use client';

import React, { useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Handle patient form submission (create/update)
  const handlePatientSubmit = async (data: NewPatient) => {
    try {
      const url = editingPatient?.id 
        ? `/api/patients/${editingPatient.id}`
        : '/api/patients';
      const method = editingPatient?.id ? 'PUT' : 'POST';
      
      console.log('[PatientsPage] Enviando datos del paciente:', { 
        url, 
        method, 
        name: data.name,
        email: data.email,
        sendInitial: data.sendInitial,
        cuestionario_id: (data.metadata as any)?.cuestionario_id,
        canal: (data.metadata as any)?.preferencias_cuestionario?.canal
      });
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.error('Error en la respuesta del servidor:', responseData);
        throw new Error(
          responseData.error?.message || 
          responseData.error || 
          'Error al guardar el paciente'
        );
      }

      console.log('Paciente guardado exitosamente:', responseData);
      
      // Forzar recarga de la lista de pacientes
      console.log('Refrescando la lista de pacientes...');
      await queryClient.refetchQueries({
        queryKey: QUERY_KEYS.PATIENTS,
        exact: true // Asegura que solo se refresque esta query específica
      });
      console.log('Lista de pacientes refrescada.');
      
      // Cerrar el formulario
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
      {/* Título principal y controles */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Mis pacientes</h1>
          <p className="text-lg text-gray-600">Gestiona tu lista de pacientes</p>
        </div>
        
        {/* Acción principal y búsqueda */}
        <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-md flex-1">
          <input
            type="text"
            placeholder="Buscar pacientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Paciente
        </button>
        </div>
      </div>
      
      {/* Lista de pacientes */}
      <div className="bg-white rounded-lg shadow p-6">
        <PatientList
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewEvolution={handleViewEvolution}
          onSendQuestionnaire={handleSendQuestionnaire}
          hideTitle={true}
          searchTerm={searchTerm}
        />
      </div>

      {/* Patient Form Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl h-fit max-h-[95vh]">
            <div className="p-4">
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
