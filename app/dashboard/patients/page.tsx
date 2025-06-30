'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import PatientList from '@/components/patient/PatientList';
import PatientForm from '@/components/patient/PatientForm';
import LinkModal from '@/components/common/LinkModal';
import { NewPatient, Patient } from '@/types/patients';
import { usePatients } from '@/app/hooks/usePatients';
import { QUERY_KEYS } from '@/lib/constants';

const SessionDebugger = () => {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('[PatientsPage] Session status on mount:', status);
    if (status === 'authenticated') {
      console.log('[PatientsPage] Session data on mount:', JSON.stringify(session, null, 2));
    }
  }, [session, status]);

  return null;
};

export default function PatientsPage() {
  return (
    <>
      <SessionDebugger />
      <PatientsPageContent />
    </>
  );
}

function PatientsPageContent() {
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [modalLink, setModalLink] = useState('');
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handlePatientSubmit = async (data: NewPatient) => {
    try {
      const url = editingPatient?.id ? `/api/patients/${editingPatient.id}` : '/api/patients';
      const method = editingPatient?.id ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify(data),
      });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseData.error?.message || responseData.error || 'Error al guardar el paciente');
      }
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.PATIENTS, exact: true });
      setShowForm(false);
      setEditingPatient(undefined);
    } catch (error) {
      console.error('Error saving patient:', error);
      throw error;
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setShowForm(true);
  };

  const handleDelete = (patient: Patient) => {
    setDeletePatient(patient);
  };

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
        body: JSON.stringify({ patientId: patient.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al enviar cuestionario');
      }
      const { link } = await res.json();
      setModalLink(link);
      setShowModal(true);
    } catch (error) {
      console.error('Error enviando cuestionario:', error);
      alert((error as Error).message || 'Error al enviar cuestionario');
    }
  };

  const handleViewEvolution = (patient: Patient) => {
    router.push(`/dashboard/patients/${patient.id}`);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPatient(undefined);
  };



  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="bg-white rounded-lg shadow p-6">
        <PatientList
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewEvolution={handleViewEvolution}
          onSendQuestionnaire={handleSendQuestionnaire}
          hideTitle={true}
        />
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 pt-20 overflow-y-auto z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">{editingPatient ? 'Editar Paciente' : 'Agregar Nuevo Paciente'}</h2>
              <PatientForm patient={editingPatient} onSubmit={handlePatientSubmit} onCancel={handleFormClose} />
            </div>
          </div>
        </div>
      )}
      {deletePatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">¿Estás seguro de que deseas eliminar a <span className="font-medium">{deletePatient.name}</span>? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setDeletePatient(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">Eliminar</button>
            </div>
          </div>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cuestionario Enviado</h3>
            <p className="text-gray-600 mb-4">El enlace del cuestionario ha sido generado:</p>
            <div className="mb-4">
              <input type="text" value={modalLink} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" onClick={(e) => (e.target as HTMLInputElement).select()} />
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
