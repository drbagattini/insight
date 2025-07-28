"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  EvolucionClinicaWithAuthor, 
  EntryType, 
  ENTRY_TYPE_LABELS, 
  ENTRY_TYPE_ICONS, 
  ENTRY_TYPE_COLORS 
} from '@/types/evolucion-clinica';
import { EvolutionViewModal } from './EvolutionViewModal';

interface EvolutionListProps {
  entries: EvolucionClinicaWithAuthor[];
  onEdit?: (entry: EvolucionClinicaWithAuthor) => void;
  onDelete?: (entryId: string) => void;
  isLoading?: boolean;
}

export function EvolutionList({ entries, onEdit, onDelete, isLoading = false }: EvolutionListProps) {
  const [viewModalEntry, setViewModalEntry] = useState<EvolucionClinicaWithAuthor | null>(null);

  const handleViewEntry = (entry: EvolucionClinicaWithAuthor) => {
    setViewModalEntry(entry);
  };

  const handleCloseModal = () => {
    setViewModalEntry(null);
  };

  const truncateContent = (content: string, maxLength: number = 80) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Función para obtener colores por tipo de entrada
  const getTypeColors = (entryType: string) => {
    const colorMap = {
      'clinica': 'text-blue-700',
      'sesion': 'text-green-700', 
      'supervision': 'text-purple-700',
      'paciente': 'text-orange-700'
    };
    return colorMap[entryType as keyof typeof colorMap] || 'text-gray-700';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (isDraft: boolean) => {
    if (isDraft) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          📝 Borrador
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Finalizado
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-200 rounded mr-3 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div>
                      <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-3 text-blue-600" />
              Evoluciones Clínicas
            </h3>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
              0 registros
            </span>
          </div>
        </div>
        <div className="p-12 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <DocumentTextIcon className="h-10 w-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Aún no hay evoluciones registradas
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
            Comience el seguimiento clínico registrando la primera evolución del paciente. 
            Podrá documentar el progreso, observaciones y adjuntar archivos relevantes.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 max-w-sm mx-auto">
            <p className="text-sm text-blue-800">
              💡 <strong>Consejo:</strong> Use el botón "Registrar Nueva Evolución" en la parte superior para comenzar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="space-y-6">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="group relative bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/30"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      {/* Fecha en lugar del icono */}
                      <div className="flex-shrink-0 text-center">
                        <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                          {new Date(entry.created_at).toLocaleDateString('es-AR', { month: 'short' })}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {new Date(entry.created_at).getDate()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(entry.created_at).toLocaleDateString('es-AR', { year: '2-digit' })}
                        </div>
                      </div>
                      
                      {/* Contenido principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{ENTRY_TYPE_ICONS[entry.entry_type]}</span>
                            <h4 className={`text-sm font-semibold ${getTypeColors(entry.entry_type)}`}>
                              {ENTRY_TYPE_LABELS[entry.entry_type]}
                            </h4>
                          </div>
                          {getEstadoBadge(entry.is_draft === true)}
                          
                          {/* Metadatos en la misma línea */}
                          <div className="flex items-center space-x-3 text-xs text-gray-500 ml-auto">
                            <div className="flex items-center space-x-1">
                              <UserIcon className="h-3 w-3" />
                              <span className="truncate max-w-20">{entry.author_name || 'Usuario'}</span>
                            </div>
                            
                            {/* Indicador de archivos */}
                            {entry.metadata?.attachments && entry.metadata.attachments.length > 0 && (
                              <div className="flex items-center space-x-1 text-blue-600">
                                <PaperClipIcon className="h-3 w-3" />
                                <span>{entry.metadata.attachments.length}</span>
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-400">
                              {new Date(entry.created_at).toLocaleTimeString('es-AR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                        
                        {/* Preview del contenido */}
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                          {truncateContent(entry.content, 140)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex items-center space-x-1 flex-shrink-0 ml-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewEntry(entry)}
                        className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                        title="Ver completa"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(entry)}
                          className="h-8 px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(entry.id)}
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-100"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para ver evolución completa */}
      <EvolutionViewModal
        isOpen={!!viewModalEntry}
        onClose={handleCloseModal}
        onEdit={onEdit}
        entry={viewModalEntry}
      />
    </>
  );
}
