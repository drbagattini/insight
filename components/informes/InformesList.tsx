'use client';

import { useState } from 'react';
import { 
  DocumentTextIcon, 
  EyeIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { InformeListItem } from '@/app/hooks/useInformes';

interface InformesListProps {
  informes: InformeListItem[];
  onView: (informeId: string) => void;
  onEdit: (informeId: string) => void;
  onDownload: (informeId: string) => void;
  onDelete: (informeId: string) => void;
  isLoading?: boolean;
  isDeleting?: boolean;
}

export default function InformesList({
  informes,
  onView,
  onEdit,
  onDownload,
  onDelete,
  isLoading = false,
  isDeleting = false
}: InformesListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (informeId: string) => {
    setDeleteConfirm(informeId);
  };

  const handleDeleteConfirm = (informeId: string) => {
    onDelete(informeId);
    setDeleteConfirm(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
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

  const getEstadoBadge = (estado: 'borrador' | 'finalizado') => {
    if (estado === 'finalizado') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Finalizado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Borrador
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-200 pb-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (informes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-8 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay informes disponibles
          </h3>
          <p className="text-gray-500 mb-6">
            Aún no se han generado informes para este paciente. 
            Utilice el botón "Generar Nuevo Informe" para crear el primero.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
          Historial de Informes ({informes.length})
        </h3>
        
        <div className="space-y-4">
          {informes.map((informe) => (
            <div
              key={informe.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-base font-medium text-gray-900 truncate">
                      {informe.titulo}
                    </h4>
                    {getEstadoBadge(informe.estado)}
                  </div>
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      <span className="font-medium">Generado:</span>{' '}
                      {formatDate(informe.fecha_generacion)}
                    </p>
                    {informe.fecha_actualizacion !== informe.fecha_generacion && (
                      <p>
                        <span className="font-medium">Actualizado:</span>{' '}
                        {formatDate(informe.fecha_actualizacion)}
                      </p>
                    )}
                    {informe.metadatos?.ai_model && (
                      <p>
                        <span className="font-medium">Generado con:</span>{' '}
                        {informe.metadatos.ai_model}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {/* 1. Ver */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(informe.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  
                  {/* 2. Editar */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(informe.id)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  
                  {/* 3. Descargar PDF */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(informe.id)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    title="Descargar PDF"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    <span className="text-xs">PDF</span>
                  </Button>
                  
                  {/* 4. Eliminar */}
                  {deleteConfirm === informe.id ? (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteConfirm(informe.id)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-800 text-xs px-2"
                      >
                        {isDeleting ? '...' : 'Sí'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteCancel}
                        className="text-gray-600 hover:text-gray-800 text-xs px-2"
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(informe.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
