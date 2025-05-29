import { useState } from 'react';
import { Patient } from '@/types/patients';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { FiSearch, FiUser, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface PatientListProps {
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  onViewEvolution: (patient: Patient) => void;
  onSendQuestionnaire: (patient: Patient) => void;
  hideTitle?: boolean;
}

export default function PatientList({ 
  onEdit, 
  onDelete, 
  onViewEvolution, 
  onSendQuestionnaire,
  hideTitle = false 
}: PatientListProps) {
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

  // Filtrar pacientes por nombre
  const filteredPatients = searchTerm
    ? patients.filter(patient => 
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false
      )
    : patients;

  if (isLoading) return <div className="p-6 text-gray-600">Cargando pacientes...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {(error as Error).message}</div>;

  return (
    <div className="space-y-6">
      {/* Título y botón de agregar */}
      <div className="flex justify-between items-center">
        {!hideTitle && <h1 className="text-2xl font-bold text-gray-800">Pacientes</h1>}
        <div className={hideTitle ? 'ml-auto' : ''}>
          <button
            onClick={() => onEdit({} as Patient)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>+</span> Agregar Paciente
          </button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar pacientes..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista de pacientes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron pacientes
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
              <li 
                key={patient.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <FiUser className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">
                        {patient.name || 'Paciente sin nombre'}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewEvolution(patient)}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Ver Perfil
                    </button>
                    <button
                      onClick={() => onEdit(patient)}
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      title="Editar paciente"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(patient)}
                      className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      title="Eliminar paciente"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
