"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Save, Check, AlertCircle, Mic, MicOff, Loader2, Volume2, FileText, Upload, Trash2 } from 'lucide-react';
import { EntryType, ManualEntryType, MANUAL_ENTRY_TYPE_LABELS, ENTRY_TYPE_ICONS } from '@/types/evolucion-clinica';
import { validateEvolutionEntry } from '@/lib/validations/evolucion-clinica';
import { ZodError } from 'zod';

interface EvolutionEditorProps {
  patientId: string;
  onSave: (data: {
    entry_type: ManualEntryType;
    content: string;
    metadata?: Record<string, any>;
    isDraft?: boolean;
  }) => Promise<any>;
  onCancel: () => void;
  isLoading?: boolean;
  editingEntry?: any; // Para futuras ediciones
}

export function EvolutionEditor({ patientId, onSave, onCancel, isLoading = false, editingEntry }: EvolutionEditorProps) {
  const [entryType, setEntryType] = useState<ManualEntryType>('clinica');
  const [content, setContent] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, any>>({});

  // Estados para funcionalidades integradas
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  // Ref para el input de archivos
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos cuando se está editando
  useEffect(() => {
    if (editingEntry) {
      setEntryType(editingEntry.entry_type || 'clinica');
      setContent(editingEntry.content || '');
      setMetadata(editingEntry.metadata || {});
      setIsDraftMode(editingEntry.is_draft || false);
      
      // Cargar archivos existentes si los hay
      if (editingEntry.id) {
        // Los archivos existentes se cargarán cuando se abra el modal de vista
        // Por ahora no necesitamos cargarlos en el editor
      }
    } else {
      // Limpiar cuando no se está editando
      setEntryType('clinica');
      setContent('');
      setMetadata({});
      setIsDraftMode(false);
      setAttachedFiles([]);
    }
  }, [editingEntry]);

  // Funciones para funcionalidades avanzadas
  const startRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';
      
      recognition.onstart = () => {
        setIsRecording(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setContent(prev => prev + (prev ? ' ' : '') + transcript);
      };
      
      recognition.onerror = () => {
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.start();
      (window as any).currentRecognition = recognition;
    }
  };

  const stopRecording = () => {
    if ((window as any).currentRecognition) {
      (window as any).currentRecognition.stop();
    }
    setIsRecording(false);
  };

  // Función para manejar subida de archivos de audio
  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingAudio(true);
    const newFiles = Array.from(files);
    
    try {
      for (const file of newFiles) {
        if (file.type.startsWith('audio/')) {
          await transcribeAudioFile(file);
        }
      }
    } catch (error) {
      console.error('Error processing audio files:', error);
    } finally {
      setIsProcessingAudio(false);
      if (audioInputRef.current) {
        audioInputRef.current.value = '';
      }
    }
  };

  // Función para manejar subida de archivos PDF
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingAudio(true);
    const newFiles = Array.from(files);
    
    try {
      for (const file of newFiles) {
        // Crear FormData para enviar el archivo
        const formData = new FormData();
        formData.append('file', file);
        formData.append('patientId', patientId);
        // No enviar entryId si está vacío

        // Subir archivo al servidor
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          // Agregar archivo a la lista local
          setAttachedFiles(prev => [...prev, file]);
          
          // Guardar metadata con URL del archivo
          setMetadata(prev => ({
            ...prev,
            attachments: [...(prev.attachments || []), {
              id: data.file.id,
              name: file.name,
              type: 'pdf',
              size: file.size,
              url: data.file.url,
              path: data.file.path
            }]
          }));
        } else {
          console.error('Error uploading file:', data.error);
          alert(`Error al subir ${file.name}: ${data.error}`);
        }
      }
    } catch (error) {
      console.error('Error processing PDF files:', error);
      alert('Error al procesar los archivos PDF');
    } finally {
      setIsProcessingAudio(false);
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
    }
  };

  // Función para transcribir audio con indicador de progreso
  const transcribeAudioFile = async (audioFile: File) => {
    try {
      // Estimar tiempo basado en el tamaño del archivo (1MB ≈ 1 minuto)
      const estimatedMinutes = audioFile.size / (1024 * 1024);
      const estimatedSeconds = Math.max(10, Math.round(estimatedMinutes * 60));
      setEstimatedTime(estimatedSeconds);
      setTranscriptionProgress(0);
      
      // Simular progreso durante la transcripción
      const progressInterval = setInterval(() => {
        setTranscriptionProgress(prev => {
          const increment = Math.random() * 15 + 5; // 5-20% por intervalo
          return Math.min(prev + increment, 90); // Máximo 90% hasta completar
        });
      }, 1000);
      
      const formData = new FormData();
      formData.append('audio', audioFile);
      
      const response = await fetch('/api/audio/transcribe-file', {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTranscriptionProgress(100);
        
        // Agregar transcripción al contenido directamente
        setContent(prev => {
          const separator = prev ? '\n\n' : '';
          const transcriptionText = data.transcription;
          const footer = data.method === 'simulated' ? '\n\n[Nota: Esta es una transcripción simulada para desarrollo]' : '';
          
          return prev + separator + transcriptionText + footer;
        });
        
        // Guardar metadata del archivo
        setMetadata(prev => ({
          ...prev,
          audioTranscriptions: [...(prev.audioTranscriptions || []), {
            fileName: audioFile.name,
            transcription: data.transcription,
            duration: data.duration,
            confidence: data.confidence,
            method: data.method,
            timestamp: new Date().toISOString()
          }]
        }));
        
        // Mostrar mensaje de éxito
        setTimeout(() => {
          setTranscriptionProgress(0);
        }, 2000);
        
      } else {
        throw new Error(data.error || 'Error en la transcripción');
      }
      
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setTranscriptionProgress(0);
      
      // Mostrar error al usuario
      alert(`Error al transcribir el audio: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      
      // Fallback: adjuntar el archivo sin transcribir
      setAttachedFiles(prev => [...prev, audioFile]);
    }
  };



  // Función para guardar con estado de borrador específico
  const handleSaveWithDraft = useCallback(async (isDraft: boolean) => {
    setIsDraftMode(isDraft);
    setValidationErrors([]);
    
    // Validar con Zod antes de enviar
    try {
      validateEvolutionEntry({
        entry_type: entryType,
        content: content.trim(),
        tags: [],
        metadata: {}
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        setValidationErrors(errors);
        return;
      }
    }

    setIsSaving(true);
    try {
      const savedEntry = await onSave({
        entry_type: entryType,
        content: content.trim(),
        metadata,
        isDraft: isDraft // Usar el parámetro directamente
      });
      
      // Si hay archivos subidos y la entrada se guardó, asociar los archivos
      if (savedEntry?.id && metadata.attachments && metadata.attachments.length > 0) {
        try {
          const fileIds = metadata.attachments.map((file: any) => file.id).filter(Boolean);
          if (fileIds.length > 0) {
            await fetch('/api/files/update-entry-id', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fileIds,
                entryId: savedEntry.id
              })
            });
          }
        } catch (fileError) {
          console.error('Error associating files:', fileError);
          // No fallar el guardado por esto
        }
      }
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving entry:', error);
      if (error instanceof Error) {
        setValidationErrors([error.message]);
      } else {
        setValidationErrors(['Error desconocido al guardar']);
      }
    } finally {
      setIsSaving(false);
    }
  }, [entryType, content, metadata, onSave]);

  const handleSave = useCallback(async () => {
    setValidationErrors([]);
    
    // Validar con Zod antes de enviar
    try {
      validateEvolutionEntry({
        entry_type: entryType,
        content: content.trim(),
        tags: [],
        metadata: {}
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        setValidationErrors(errors);
        return;
      }
    }

    setIsSaving(true);
    try {
      const savedEntry = await onSave({
        entry_type: entryType,
        content: content.trim(),
        metadata,
        isDraft: isDraftMode
      });
      
      // Si hay archivos subidos y la entrada se guardó, asociar los archivos
      if (savedEntry?.id && metadata.attachments && metadata.attachments.length > 0) {
        try {
          const fileIds = metadata.attachments.map((file: any) => file.id).filter(Boolean);
          if (fileIds.length > 0) {
            await fetch('/api/files/update-entry-id', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fileIds,
                entryId: savedEntry.id
              })
            });
          }
        } catch (error) {
          console.error('Error associating files with entry:', error);
          // No fallar el guardado por este error
        }
      }
      
      // Mostrar feedback de éxito
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      // Reset form
      setEntryType('clinica');
      setContent('');
      setMetadata({});
      setIsDraftMode(false);
      setValidationErrors([]);
    } catch (error) {
      console.error('Error saving entry:', error);
      setValidationErrors(['Error al guardar la entrada. Intente nuevamente.']);
    } finally {
      setIsSaving(false);
    }
  }, [entryType, content, onSave]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
      
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingEntry ? 'Editar Evolución Clínica' : 'Nueva Evolución Clínica'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="p-6">

      {/* Errores de validación */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-2">Errores de validación:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Feedback de éxito */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-400 mr-3" />
            <span className="text-sm font-medium text-green-800">
              ¡Entrada guardada exitosamente!
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Selector de tipo de entrada */}
        <div>
          <label 
            htmlFor="entry-type-select" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Tipo de Entrada *
          </label>
          <Select 
            value={entryType} 
            onValueChange={(value: ManualEntryType) => setEntryType(value)}
          >
            <SelectTrigger 
              id="entry-type-select"
              className="w-full"
              aria-label="Seleccionar tipo de entrada"
              aria-describedby="entry-type-help"
            >
              <SelectValue placeholder="Seleccione el tipo de entrada" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MANUAL_ENTRY_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span role="img" aria-label={`Icono ${label}`}>
                      {ENTRY_TYPE_ICONS[key as EntryType]}
                    </span>
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p id="entry-type-help" className="text-xs text-gray-500 mt-1">
            Seleccione el tipo de registro que desea crear
          </p>
        </div>
        
        {/* Campo de contenido */}
        <div className="space-y-4">
          <label 
            htmlFor="content-textarea"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Contenido *
          </label>
          
          {/* Botones de herramientas - DINÁMICOS SEGÚN TIPO */}
          <div className="flex gap-3 mb-3">
            {/* Botón de dictado - texto dinámico */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isSaving}
              className={
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isRecording 
                    ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse' 
                    : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`
              }
            >
              <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
              {isRecording 
                ? 'Detener Dictado' 
                : entryType === 'sesion' 
                  ? 'Dictar Registro de Sesión' 
                  : 'Dictar Evolución'
              }
            </button>
            
            {/* Botón de audio/transcripción - solo para sesiones */}
            {entryType === 'sesion' ? (
              <button
                type="button"
                onClick={() => audioInputRef.current?.click()}
                disabled={isSaving || isProcessingAudio}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Volume2 className="h-4 w-4" />
                Transcribir Audio de Sesión
              </button>
            ) : null}
            
            {/* Botón de adjuntar PDF - solo para evolución clínica */}
            {entryType === 'clinica' ? (
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                disabled={isSaving || isProcessingAudio}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <FileText className="h-4 w-4" />
                Adjuntar PDF
              </button>
            ) : null}
          </div>
          <div className="relative">
            <Textarea
              id="content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escriba aquí la evolución clínica del paciente..."
              className="min-h-[300px] resize-none text-base leading-relaxed"
              disabled={isSaving}
            />
            
            {/* Inputs ocultos para archivos */}
            <input
              type="file"
              ref={audioInputRef}
              onChange={handleAudioUpload}
              accept=".mp3,.wav,.m4a,.ogg"
              className="hidden"
              multiple
            />
            
            <input
              type="file"
              ref={pdfInputRef}
              onChange={handlePdfUpload}
              accept=".pdf"
              className="hidden"
              multiple
            />
          </div>

            {/* Indicador de estado de grabación */}
            {isRecording && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Grabando...
              </div>
            )}

            {/* Indicador de procesamiento con progreso - Esquina inferior derecha */}
            {isProcessingAudio && (
              <div className="absolute bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-4 shadow-xl min-w-72 z-50">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-base font-medium text-gray-700">
                    Transcribiendo audio...
                  </span>
                </div>
                
                {/* Barra de progreso */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${transcriptionProgress}%` }}
                  ></div>
                </div>
                
                {/* Información de progreso */}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{Math.round(transcriptionProgress)}% completado</span>
                  {estimatedTime > 0 && (
                    <span>
                      ~{Math.max(1, Math.round((estimatedTime * (100 - transcriptionProgress)) / 100))}s restantes
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Contador de caracteres */}
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {content.length} caracteres
            </div>
          </div>
        </div>

        {/* Archivos adjuntos */}
        {attachedFiles.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Archivos Adjuntos ({attachedFiles.length})
            </h4>
            <div className="space-y-2">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      {file.type.startsWith('audio/') ? (
                        <Mic className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Plus className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{file.name}</div>
                      <div className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                        {file.type.startsWith('audio/') && ' • Transcrito automáticamente'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAttachedFiles(prev => prev.filter((_, i) => i !== index));
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Botones de acción mejorados */}
        <div className="bg-gray-50 -mx-6 -mb-6 px-6 py-4 border-t border-gray-200">
          <div className="flex gap-3">
            {/* Cancelar */}
            <Button
              onClick={onCancel}
              disabled={isSaving}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2"
            >
              Cancelar
            </Button>
            
            {/* Guardar como Borrador */}
            <Button
              onClick={() => handleSaveWithDraft(true)}
              disabled={!content.trim() || isSaving}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2"
            >
              {isSaving && isDraftMode ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  💾 {editingEntry ? 'Guardar Cambios' : 'Guardar Borrador'}
                </>
              )}
            </Button>
            
            {/* Finalizar y Guardar */}
            <Button
              onClick={() => handleSaveWithDraft(false)}
              disabled={!content.trim() || isSaving}
              className="
                bg-gradient-to-r from-blue-600 to-indigo-600 
                hover:from-blue-700 hover:to-indigo-700
                text-white border-0 shadow-lg
                disabled:opacity-50 disabled:cursor-not-allowed
                px-6 py-2 font-medium
              "
            >
              {isSaving && !isDraftMode ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  {editingEntry ? 'Actualizando...' : 'Finalizando...'}
                </>
              ) : (
                <>
                  ✓ {editingEntry ? 'Actualizar' : 'Finalizar y Guardar'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
