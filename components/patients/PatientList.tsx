import { useState } from 'react';
import { Patient } from '@/types/patients';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';

interface PatientListProps {
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  onSendQuestionnaire: (patient: Patient) => void;
}

export default function PatientList({ onEdit, onDelete, onSendQuestionnaire }: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: patients = [], isLoading, error } = useQuery<Patient[]>({
    queryKey: QUERY_KEYS.PATIENTS,
    queryFn: async () => {
      const response = await fetch('/api/patients');
      if (!response.ok) {
        throw new Error('Error al cargar pacientes');
      }
      return response.json();
    }
  });

  // Filtrar pacientes solo si hay término de búsqueda
  const filteredPatients = searchTerm
    ? patients.filter(patient => {
        const nameMatch = patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
        const emailMatch = patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
        const whatsappMatch = patient.whatsapp?.includes(searchTerm) ?? false;
        return nameMatch || emailMatch || whatsappMatch;
      })
    : patients;

  if (isLoading) return <div className="p-4">Cargando pacientes...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {(error as Error).message}</div>;

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar pacientes..."
          className="w-full p-2 border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista de pacientes */}
      <div className="space-y-2">
        {filteredPatients.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            No se encontraron pacientes
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{patient.name || 'Sin nombre'}</h3>
                  {patient.email && (
                    <p className="text-sm text-gray-600">{patient.email}</p>
                  )}
                  {patient.whatsapp && (
                    <p className="text-sm text-gray-600">{patient.whatsapp}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onSendQuestionnaire(patient)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Enviar Cuestionario
                  </button>
                  <button
                    onClick={() => onEdit(patient)}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(patient)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
