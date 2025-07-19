import { useState } from 'react';
import { Patient } from '@/types/patients';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { FiSearch, FiUser, FiEdit2, FiTrash2, FiEye, FiMail, FiPhone, FiPlus } from 'react-icons/fi';

interface PatientListProps {
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  onViewEvolution: (patient: Patient) => void;
  onSendQuestionnaire: (patient: Patient) => void;
  hideTitle?: boolean;
}

// Función para generar color único basado en el nombre
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
    'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-rose-500'
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Función para obtener iniciales del nombre
const getInitials = (name: string) => {
  if (!name) return 'U';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export default function PatientList({ 
  onEdit, 
  onDelete, 
  onViewEvolution, 
  onSendQuestionnaire,
  hideTitle = false 
}: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const { 
    data: patients = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Patient[]>({
    queryKey: QUERY_KEYS.PATIENTS,
    queryFn: async () => {
      console.log('Obteniendo lista de pacientes...');
      const response = await fetch('/api/patients', {
        // Evitar caché del navegador
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error en la respuesta del servidor:', errorData);
        throw new Error(errorData.error || 'Error al cargar pacientes');
      }
      
      const data = await response.json();
      console.log('Pacientes recibidos:', data);
      return Array.isArray(data) ? data : [];
    },
    // Forzar recarga cuando el componente se monta
    refetchOnMount: true,
    // No volver a intentar automáticamente en caso de error
    retry: 1
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
      {/* Header elegante y simplificado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        {!hideTitle && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
            <p className="text-sm text-gray-600 mt-1">Gestiona la información de tus pacientes</p>
          </div>
        )}
        <div className={hideTitle ? 'ml-auto' : ''}>
          <button
            onClick={() => onEdit({} as Patient)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-md"
          >
            <FiPlus className="h-4 w-4 mr-2" />
            Agregar Paciente
          </button>
        </div>
      </div>

      {/* Barra de búsqueda elegante */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar pacientes..."
          className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista moderna y eficiente */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-12 text-center">
            <FiUser className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No se encontraron pacientes</h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer paciente'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => onEdit({} as Patient)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiPlus className="h-4 w-4 mr-2" />
                  Agregar primer paciente
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="px-6 py-5 hover:bg-gray-50 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  {/* Información del paciente */}
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* Avatar compacto con iniciales */}
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getAvatarColor(patient.name || '')} flex items-center justify-center shadow-sm`}>
                      <span className="text-sm font-bold text-white">
                        {getInitials(patient.name || '')}
                      </span>
                    </div>
                    
                    {/* Información principal en una línea */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {patient.name || 'Paciente sin nombre'}
                        </h3>
                        
                        {/* Información de contacto inline */}
                        <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-600">
                          {patient.email && (
                            <div className="flex items-center">
                              <FiMail className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{patient.email}</span>
                            </div>
                          )}
                          {patient.whatsapp && (
                            <div className="flex items-center">
                              <FiPhone className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{patient.whatsapp}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Información de contacto en móvil */}
                      <div className="sm:hidden mt-1 space-y-1">
                        {patient.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FiMail className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span className="truncate">{patient.email}</span>
                          </div>
                        )}
                        {patient.whatsapp && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FiPhone className="h-3 w-3 mr-2 flex-shrink-0" />
                            <span className="truncate">{patient.whatsapp}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onViewEvolution(patient)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <FiEye className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Ver Perfil</span>
                      <span className="sm:hidden">Ver</span>
                    </button>
                    
                    <button
                      onClick={() => onEdit(patient)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      title="Editar paciente"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => onDelete(patient)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      title="Eliminar paciente"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
