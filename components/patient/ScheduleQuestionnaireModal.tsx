'use client';

import { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock, FiSend, FiRepeat } from 'react-icons/fi';
import { sortQuestionnaires } from '@/lib/questionnaire-order';
import { Button } from '@/components/ui/button';
import { X, Calendar, Send } from 'lucide-react';

interface ScheduleQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

interface Questionnaire {
  id: string;
  codigo?: string;
  nombre?: string;
  titulo?: string;
  destinatario?: string;
}

interface ScheduleData {
  pacienteId: string;
  cuestionarioId: string | undefined;
  canal: string;
  frecuencia: string;
  proximoEnvio: string;
  destinatario?: string; // Nuevo campo para especificar destinatario
}

export default function ScheduleQuestionnaireModal({
  isOpen,
  onClose,
  patientId,
  onSuccess,
  onError
}: ScheduleQuestionnaireModalProps) {
  // Estados del formulario
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(true);
  const [newCuestionarioId, setNewCuestionarioId] = useState<string>('');
  const [newCanal, setNewCanal] = useState<string>('email');
  const [newFrecuencia, setNewFrecuencia] = useState<string>('mensual');
  const [newDestinatario, setNewDestinatario] = useState<string>('paciente');
  const [newProximoEnvio, setNewProximoEnvio] = useState<string>(() =>
    new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
  );

  // Estados del modal de confirmación
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);
  const [pendingScheduleData, setPendingScheduleData] = useState<ScheduleData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar cuestionarios cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadQuestionnaires();
    }
  }, [isOpen]);

  const loadQuestionnaires = async () => {
    setLoadingQuestionnaires(true);
    try {
      const res = await fetch('/api/cuestionarios');
      const data = await res.json();
      // Aplicar ordenamiento específico
      const sortedData = sortQuestionnaires(data) as Questionnaire[];
      setQuestionnaires(sortedData);
      if (sortedData.length > 0) setNewCuestionarioId(sortedData[0].id);
    } catch (e) {
      console.error('Error al cargar cuestionarios:', e);
      onError('Error al cargar cuestionarios');
    } finally {
      setLoadingQuestionnaires(false);
    }
  };

  const handleScheduleFutureSend = async (scheduleData: ScheduleData, date: string) => {
    try {
      const proximoEnvioConHora = `${date}T08:00:00`;

      const res = await fetch('/api/envios_programados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scheduleData,
          proximoEnvio: proximoEnvioConHora,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errorCode === 'PROGRAMACION_RECURRENTE_EXISTENTE') {
          onError(data.error);
        } else {
          onError(data.error || 'Error al programar envío para el futuro');
        }
        return;
      }
      onSuccess(`Envío programado para el ${new Date(proximoEnvioConHora).toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' })} a las 08:00 AM.`);
      resetForm();
      onClose();
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      onError(errorMessage);
    }
  };

  const handleScheduleAndSendNow = async (scheduleData: ScheduleData, date: string) => {
    try {
      const proximoEnvioParaBackend = `${date}T${new Date().toTimeString().split(' ')[0]}`;

      // Primero programar
      const scheduleRes = await fetch('/api/envios_programados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scheduleData,
          proximoEnvio: proximoEnvioParaBackend,
        }),
      });
      const scheduleResData = await scheduleRes.json();
      
      if (!scheduleRes.ok) {
        if (scheduleResData.errorCode === 'PROGRAMACION_RECURRENTE_EXISTENTE') {
          onError(scheduleResData.error);
        } else {
          onError(scheduleResData.error || 'Error al programar el envío');
        }
        return;
      }

      const envioProgramadoId = scheduleResData.id;
      if (!envioProgramadoId) {
        onError("No se pudo obtener el ID del envío programado para el envío inmediato.");
        return;
      }

      // Luego enviar inmediatamente
      const sendRes = await fetch('/api/cuestionarios/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Incluir cookies de sesión
        body: JSON.stringify({
          pacienteId: scheduleData.pacienteId,
          cuestionarioId: scheduleData.cuestionarioId,
          canal: scheduleData.canal,
          envioProgramadoId: envioProgramadoId,
          destinatario: scheduleData.destinatario,
        }),
      });
      const sendData = await sendRes.json();
      
      if (!sendRes.ok) {
        onError(sendData.error || 'Error al enviar cuestionario inmediatamente');
      } else {
        onSuccess('Envío programado y cuestionario enviado inmediatamente.');
      }
      
      resetForm();
      onClose();
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      onError(errorMessage);
    }
  };

  const initiateSchedulingProcess = async () => {
    if (!newProximoEnvio) {
      onError("Por favor, seleccione una fecha de inicio.");
      return;
    }

    setIsSubmitting(true);

    const scheduleData: ScheduleData = {
      pacienteId: patientId,
      cuestionarioId: newCuestionarioId,
      canal: newCanal,
      frecuencia: newFrecuencia,
      proximoEnvio: newProximoEnvio,
      destinatario: newDestinatario,
    };
    setPendingScheduleData(scheduleData);

    const hoyStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local TZ
    const fechaParaEnviar = newProximoEnvio.split('T')[0];

    if (fechaParaEnviar === hoyStr) {
      // Fecha es hoy, mostrar modal de confirmación
      setShowConfirmationModal(true);
      setIsSubmitting(false);
    } else if (fechaParaEnviar > hoyStr) {
      // Fecha futura, programar sin modal
      await handleScheduleFutureSend(scheduleData, fechaParaEnviar);
      setIsSubmitting(false);
    } else {
      onError("No se puede programar un envío para una fecha pasada.");
      setPendingScheduleData(null);
      setIsSubmitting(false);
    }
  };

  const handleConfirmSendNow = async () => {
    if (!pendingScheduleData) return;
    
    setShowConfirmationModal(false);
    setIsSubmitting(true);
    
    await handleScheduleAndSendNow(pendingScheduleData, pendingScheduleData.proximoEnvio);
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setNewCuestionarioId(questionnaires.length > 0 ? questionnaires[0].id : '');
    setNewCanal('email');
    setNewFrecuencia('mensual');
    setNewDestinatario('paciente');
    setNewProximoEnvio(new Date().toISOString().split('T')[0]);
    setPendingScheduleData(null);
    setShowConfirmationModal(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Programar Envío de Cuestionario</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Formulario */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Selector de cuestionario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuestionario
                </label>
                {loadingQuestionnaires ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    Cargando cuestionarios...
                  </div>
                ) : (
                  <select
                    value={newCuestionarioId}
                    onChange={e => setNewCuestionarioId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  >
                    {questionnaires.map(q => (
                      <option key={q.id} value={q.id}>
                        {q.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selector de canal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Canal de envío
                </label>
                <select
                  value={newCanal}
                  onChange={e => setNewCanal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="email">📧 Email</option>
                  <option value="whatsapp">📱 WhatsApp</option>
                </select>
              </div>

              {/* Selector de destinatario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destinatario
                </label>
                <select
                  value={newDestinatario}
                  onChange={e => setNewDestinatario(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="paciente">👤 Paciente</option>
                  <option value="padre_tutor">👨‍👩‍👧‍👦 Padre/Tutor</option>
                </select>
              </div>

              {/* Selector de frecuencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia
                </label>
                <select
                  value={newFrecuencia}
                  onChange={e => setNewFrecuencia(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="unico">📋 Envío único</option>
                  <option value="semanal">🗓️ Semanal</option>
                  <option value="quincenal">📋 Quincenal</option>
                  <option value="mensual">📅 Mensual</option>
                  <option value="trimestral">📆 Trimestral</option>
                </select>
              </div>

              {/* Selector de fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  value={newProximoEnvio}
                  onChange={e => setNewProximoEnvio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={initiateSchedulingProcess}
                disabled={!newProximoEnvio || isSubmitting || loadingQuestionnaires}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Programando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Programar Envío
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación para envío inmediato */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirmación de Envío
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                ¿Confirmás que se realice el primer envío ahora mismo?
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmationModal(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmSendNow}
                  disabled={isSubmitting}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    'Confirmar Envío'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
