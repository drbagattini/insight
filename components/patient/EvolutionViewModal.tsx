"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

import { X, Edit, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EvolucionClinicaEntry } from '@/types/evolucion-clinica';
import { ENTRY_TYPE_LABELS, ENTRY_TYPE_COLORS, ENTRY_TYPE_ICONS } from '@/types/evolucion-clinica';

interface EvolutionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (entry: EvolucionClinicaEntry) => void;
  entry: EvolucionClinicaEntry | null;
}

export function EvolutionViewModal({
  isOpen,
  onClose,
  onEdit,
  entry
}: EvolutionViewModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [dbFiles, setDbFiles] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Cargar archivos de la base de datos cuando se abre el modal
  useEffect(() => {
    const loadFiles = async () => {
      if (isOpen && entry?.id) {

        try {
          const response = await fetch(`/api/files/by-entry/${entry.id}`);
          const data = await response.json();
          if (data.success) {
            setDbFiles(data.files);
          }
        } catch (error) {
          console.error('Error loading files:', error);
        }
      } else {
        setDbFiles([]);
      }
    };

    loadFiles();
  }, [isOpen, entry?.id]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 150); // Esperar a que termine la animación
  };

  const handleEdit = () => {
    if (entry && onEdit) {
      onEdit(entry);
      handleClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "EEEE, dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  // Combinar archivos de metadata y base de datos
  const getAllAttachments = () => {
    const metadataFiles = entry?.metadata?.attachments || [];
    const dbFilesFormatted = dbFiles.map(file => ({
      id: file.id,
      name: file.file_name,
      type: file.file_type,
      size: file.file_size,
      url: file.public_url,
      path: file.file_path
    }));
    
    // Combinar y eliminar duplicados por nombre
    const allFiles = [...metadataFiles, ...dbFilesFormatted];
    const uniqueFiles = allFiles.filter((file, index, self) => 
      index === self.findIndex(f => f.name === file.name)
    );
    
    return uniqueFiles;
  };

  if (!isOpen || !entry) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-150 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      {/* Modal */}
      <div
        className={`relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden transform transition-transform duration-150 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="evolution-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {ENTRY_TYPE_ICONS[entry.entry_type]}
            </span>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${ENTRY_TYPE_COLORS[entry.entry_type]}`}>
                  {ENTRY_TYPE_LABELS[entry.entry_type]}
                </span>
                {entry.is_draft === true && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium border border-orange-300 text-orange-700 bg-orange-50">
                    📝 Borrador
                  </span>
                )}
              </div>
              <h3 id="evolution-title" className="text-lg font-semibold text-gray-900">
                Evolución Clínica
              </h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">{formatDate(entry.created_at)}</span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-gray max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {entry.content}
            </div>
          </div>



          {/* Archivos Adjuntos */}
          {(() => {
            const allAttachments = getAllAttachments();
            return allAttachments.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Archivos Adjuntos:</h4>
                <div className="space-y-2">
                  {allAttachments.map((attachment: any, index: number) => (
                    <div 
                      key={attachment.id || index} 
                      className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        // Abrir PDF en nueva ventana si tiene URL
                        if (attachment.url) {
                          window.open(attachment.url, '_blank');
                        } else {
                          console.log('URL no disponible para:', attachment.name);
                          alert('Este archivo no está disponible para visualización.');
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <span className="text-red-600 text-lg">📄</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{attachment.name}</div>
                          <div className="text-xs text-gray-500">
                            {attachment.type?.toUpperCase().replace('APPLICATION/', '')} • {(attachment.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <div className="text-blue-600 hover:text-blue-800">
                        <span className="text-sm font-medium">Ver archivo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Transcripciones de Audio */}
          {entry.metadata?.audioTranscriptions && entry.metadata.audioTranscriptions.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Transcripciones de Audio:</h4>
              <div className="space-y-3">
                {entry.metadata.audioTranscriptions.map((transcription: any, index: number) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600">🎤</span>
                      <span className="text-sm font-medium text-blue-900">{transcription.fileName}</span>
                    </div>
                    <div className="text-sm text-gray-700 italic">
                      "{transcription.transcription}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata adicional (si hay más campos) */}
          {entry.metadata && Object.keys(entry.metadata).filter(key => !['attachments', 'audioTranscriptions'].includes(key)).length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Información adicional:</h4>
              <div className="bg-gray-50 rounded-md p-3">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(
                    Object.fromEntries(
                      Object.entries(entry.metadata).filter(([key]) => !['attachments', 'audioTranscriptions'].includes(key))
                    ), 
                    null, 
                    2
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-6 pt-4 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={handleClose}
            className="min-w-[80px]"
          >
            Cerrar
          </Button>
          {onEdit && (
            <Button
              onClick={handleEdit}
              className="min-w-[80px] bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
