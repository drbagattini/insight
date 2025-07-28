"use client";

import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from 'react';
import QuestionnaireChart from '@/components/QuestionnaireChart';
import questionnairesMeta from '@/src/data/questionnairesMeta';
import { PatientResponsesSection } from '@/components/patient/PatientResponsesSection';
import { PatientDetails } from '@/components/patient/PatientDetails';
import { PatientIntakeTab } from '@/components/patient/PatientIntakeTab';




export default function PatientEvolutionPage() {
  const params = useParams() as { patientId: string };
  const patientId = params.patientId;
  const [loading, setLoading] = useState(true);
  const [evolution, setEvolution] = useState<{ puntuacion: number; creado_en: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>('');
  
  // Estado para el selector de cuestionario
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<'WHO-5' | 'OPD-CA2-SQ' | 'BR-WAI' | 'PHQ-9' | 'GAD-7'>('WHO-5');
  const [evolutionData, setEvolutionData] = useState<any[]>([]);

  // Tipado y estados para envíos programados
  interface ScheduledSend {
    id: string;
    cuestionario_id: string;
    canal: string;
    frecuencia: string;
    proximo_envio: string;
    creado_en: string;
    lastSent?: string;
    respondido?: boolean;
    // Objeto del cuestionario relacionado
    cuestionarios?: { codigo: string };
    fecha_inicio_programada?: string;
  }
  const [scheduledSends, setScheduledSends] = useState<ScheduledSend[]>([]);
  const [loadingSends, setLoadingSends] = useState(true);

  // Estado de remider enviado per-row
  const [reminderSent, setReminderSent] = useState<{ [id: string]: boolean }>({});

  const [newCanal, setNewCanal] = useState<string>('email');
  const [newFrecuencia, setNewFrecuencia] = useState<string>('mensual');
  const [newProximoEnvio, setNewProximoEnvio] = useState<string>(() =>
    new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
  );

  // Listado de cuestionarios para selector
  const [questionnaires, setQuestionnaires] = useState<{ id: string; codigo: string; nombre: string }[]>([]);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(true);
  const [newCuestionarioId, setNewCuestionarioId] = useState<string>('');

  // Modal de cancelación de envío programado
  const [cancelSendId, setCancelSendId] = useState<string | null>(null);

  // Notificaciones breves
  const [notification, setNotification] = useState<string | null>(null);
  useEffect(() => {
    if (notification) {
      const duration = notification === 'Primer cuestionario enviado' ? 2000 : 1500;
      const timer = setTimeout(() => setNotification(null), duration);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const [highlight, setHighlight] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);
  const [pendingScheduleData, setPendingScheduleData] = useState<{
    pacienteId: string;
    cuestionarioId: string | undefined;
    canal: string;
    frecuencia: string;
    proximoEnvio: string; // YYYY-MM-DD date string
  } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);

  useEffect(() => {
    if (error) setShowErrorModal(true);
  }, [error]);

  useEffect(() => {
    async function loadEvolution() {
      try {
        const res = await fetch(`/api/cuestionarios/resultados/paciente/${patientId}?codigo=${selectedQuestionnaire}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error al cargar evolución');
        setEvolution(json.data);
        setEvolutionData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    loadEvolution();
  }, [patientId, selectedQuestionnaire]);

  useEffect(() => {
    async function loadPatientName() {
      try {
        const res = await fetch('/api/patients');
        const list = await res.json();
        const p = list.find((p: any) => p.id === patientId);
        setPatientName(p?.name || '');
      } catch (e) {
        console.error('Error al cargar paciente:', e);
      }
    }
    loadPatientName();
  }, [patientId]);

  // Cargar envíos programados
  useEffect(() => {
    setLoadingSends(true);
    async function loadScheduled() {
      try {
        const res = await fetch(`/api/envios_programados?pacienteId=${patientId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al cargar envíos programados');
        setScheduledSends(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSends(false);
      }
    }
    loadScheduled();
  }, [patientId]);

  // Cargar cuestionarios activos
  useEffect(() => {
    async function loadQuestionnaires() {
      setLoadingQuestionnaires(true);
      try {
        const res = await fetch('/api/cuestionarios');
        const data = await res.json();
        setQuestionnaires(data);
        if (data.length > 0) setNewCuestionarioId(data[0].id);
      } catch (e) {
        console.error('Error al cargar cuestionarios:', e);
      } finally {
        setLoadingQuestionnaires(false);
      }
    }
    loadQuestionnaires();
  }, []);

  // Enviar ahora (manual)
  const sendNow = async (send: ScheduledSend) => {
    try {
      const res = await fetch('/api/cuestionarios/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacienteId: patientId,
          cuestionarioId: send.cuestionario_id,
          canal: send.canal,
          envioProgramadoId: send.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      setNotification('Recordatorio enviado');
      // Marcar recordatorio enviado y actualizar lastSent
      setReminderSent(prev => ({ ...prev, [send.id]: true }));
      setScheduledSends(prev =>
        prev.map(s => (s.id === send.id ? { ...s, lastSent: new Date().toISOString() } : s))
      );
      setTimeout(() => {
        setReminderSent(prev => {
          const newState = { ...prev };
          delete newState[send.id];
          return newState;
        });
      }, 2000);
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    }
  };

  const handleScheduleFutureSend = async (scheduleData: any, date: string) => {
    setError(null);
    setNotification(null);
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
          setError(data.error);
        } else {
          setError(data.error || 'Error al programar envío para el futuro');
        }
        return;
      }
      setNotification(`Envío programado para el ${new Date(proximoEnvioConHora).toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' })} a las 08:00 AM.`);
      const listRes = await fetch(`/api/envios_programados?pacienteId=${patientId}`);
      const listData = await listRes.json();
      if (listRes.ok) setScheduledSends(listData);
      setNewProximoEnvio(new Date().toISOString().split('T')[0]);
      setPendingScheduleData(null);
      setHighlight(true);
      setTimeout(() => setHighlight(false), 1500);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(errorMessage);
    }
  };

  const handleScheduleAndSendNow = async (scheduleData: any, date: string) => {
    setError(null);
    setNotification(null);
    try {
      const proximoEnvioParaBackend = `${date}T${new Date().toTimeString().split(' ')[0]}`;

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
          setError(scheduleResData.error);
        } else {
          setError(scheduleResData.error || 'Error al programar el envío');
        }
        return;
      }

      const envioProgramadoId = scheduleResData.id;
      if (!envioProgramadoId) {
        setError("No se pudo obtener el ID del envío programado para el envío inmediato.");
        return;
      }

      const sendRes = await fetch('/api/cuestionarios/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacienteId: scheduleData.pacienteId,
          cuestionarioId: scheduleData.cuestionarioId,
          canal: scheduleData.canal,
          envioProgramadoId: envioProgramadoId,
        }),
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        setError(prevError => prevError ? `${prevError}\n${sendData.error || 'Error al enviar cuestionario inmediatamente'}` : (sendData.error || 'Error al enviar cuestionario inmediatamente'));
      } else {
        setNotification('Envío programado y cuestionario enviado inmediatamente.');
      }

      const listRes = await fetch(`/api/envios_programados?pacienteId=${patientId}`);
      const listData = await listRes.json();
      if (listRes.ok) setScheduledSends(listData);
      setNewProximoEnvio(new Date().toISOString().split('T')[0]);
      setPendingScheduleData(null);
      setHighlight(true);
      setTimeout(() => setHighlight(false), 1500);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(errorMessage);
    }
  };

  const initiateSchedulingProcess = async () => {
    setError(null);
    setNotification(null);

    if (!newProximoEnvio) {
      setError("Por favor, seleccione una fecha de inicio.");
      return;
    }

    const fechaParaEnviar = newProximoEnvio.split('T')[0];
    const currentScheduleData = {
      pacienteId: patientId,
      cuestionarioId: newCuestionarioId || undefined,
      canal: newCanal,
      frecuencia: newFrecuencia,
      proximoEnvio: fechaParaEnviar,
    };
    setPendingScheduleData(currentScheduleData);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const [year, month, day] = fechaParaEnviar.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, day);

    if (selectedDateObj.getTime() === hoy.getTime()) {
      setShowConfirmationModal(true);
    } else if (selectedDateObj.getTime() > hoy.getTime()) {
      await handleScheduleFutureSend(currentScheduleData, fechaParaEnviar);
    } else {
      setError("No se puede programar un envío para una fecha pasada.");
      setPendingScheduleData(null); // Clear pending data if error
    }
  };

  // Cancelar envío programado - internal
  const cancelSendInternal = async (id: string) => {
    try {
      const res = await fetch(`/api/envios_programados/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al cancelar envío');
      }
      // Refrescar lista
      const listRes = await fetch(`/api/envios_programados?pacienteId=${patientId}`);
      const listData = await listRes.json();
      if (listRes.ok) setScheduledSends(listData);
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    }
  };

  // Computar próxima fecha según frecuencia
  function computeNextDate(start: string, frequency: string): string {
    if (frequency === 'unico') return 'N/A'; // No hay próximo envío para 'unico'
    const date = new Date(start);
    if (frequency === 'semanal') date.setDate(date.getDate() + 7);
    else if (frequency === 'quincenal') date.setDate(date.getDate() + 14);
    else if (frequency === 'mensual') date.setMonth(date.getMonth() + 1);
    else if (frequency === 'trimestral') date.setMonth(date.getMonth() + 3);
    return date.toISOString();
  }

  if (loading) return <div className="p-6">Cargando evolución...</div>;

    // Using WHO-5 as default questionnaire code

  return (
    <>
    <div>
      {notification && (
        <div className="fixed top-4 right-4 px-4 py-2 rounded shadow z-50 text-white bg-blue-600">
          {notification}
        </div>
      )}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xs">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="mb-4">{error}</p>
            <div className="flex justify-end">
              <Button variant="default" onClick={() => { setShowErrorModal(false); setError(null); }}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{patientName || 'Paciente'}</h1>
        <p className="text-lg text-gray-600">Información del paciente</p>

            {/* Entrevista Inicial */}
            <div className="mt-8">
              <PatientIntakeTab />
            </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">Evolución de Cuestionarios</h2>
          
          {/* Selector de Pestañas */}
          <div className="mb-4 flex justify-center">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setSelectedQuestionnaire('WHO-5')}
                className={`px-4 py-2 text-sm font-medium ${selectedQuestionnaire === 'WHO-5' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'} border border-gray-200 rounded-l-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-500`}
              >
                {questionnairesMeta['WHO-5'].title}
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuestionnaire('OPD-CA2-SQ')}
                className={`px-4 py-2 text-sm font-medium ${selectedQuestionnaire === 'OPD-CA2-SQ' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'} border-t border-b border-gray-200 hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-500`}
              >
                {questionnairesMeta['OPD-CA2-SQ'].title}
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuestionnaire('BR-WAI')}
                className={`px-4 py-2 text-sm font-medium ${selectedQuestionnaire === 'BR-WAI' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'} border-t border-b border-gray-200 hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-500`}
              >
                {questionnairesMeta['BR-WAI'].title}
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuestionnaire('PHQ-9')}
                className={`px-4 py-2 text-sm font-medium ${selectedQuestionnaire === 'PHQ-9' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'} border-t border-b border-gray-200 hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-500`}
              >
                {questionnairesMeta['PHQ-9'].title}
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuestionnaire('GAD-7')}
                className={`px-4 py-2 text-sm font-medium ${selectedQuestionnaire === 'GAD-7' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'} border-t border-b border-r border-gray-200 rounded-r-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-500`}
              >
                {questionnairesMeta['GAD-7'].title}
              </button>
            </div>
          </div>

          {/* Contenedor del Gráfico */}
          <div className="h-96">
            {loading ? (
              <p className="text-center pt-4">Cargando evolución...</p>
            ) : error ? (
              <p className="text-red-500 text-center pt-4">Error: {error}</p>
            ) : evolutionData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No hay datos de evolución disponibles para {questionnairesMeta[selectedQuestionnaire]?.title || selectedQuestionnaire}.</p>
              </div>
            ) : (
              <QuestionnaireChart 
                data={evolutionData} 
                codigo={selectedQuestionnaire} 
              />
            )}
          </div>
        </div>
        {/* Patient Responses Section */}
        <div className="mb-8">
          <PatientResponsesSection patientId={patientId} />
        </div>

        {/* Programar nuevo envío */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Programar nuevo envío</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block font-medium mb-1">Cuestionario</label>
              {loadingQuestionnaires ? (
                <p>Cargando cuestionarios...</p>
              ) : (
                <select
                  value={newCuestionarioId}
                  onChange={e => setNewCuestionarioId(e.target.value)}
                  className="w-full px-2 py-1 border rounded"
                >
                  {questionnaires.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block font-medium mb-1">Canal</label>
              <select
                value={newCanal}
                onChange={e => setNewCanal(e.target.value)}
                className="w-full px-2 py-1 border rounded"
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Frecuencia</label>
              <select
                value={newFrecuencia}
                onChange={e => setNewFrecuencia(e.target.value)}
                className="w-full px-2 py-1 border rounded"
              >
                <option value="unico">Envío único</option>
                <option value="semanal">🗓️ Semanal</option>
                <option value="quincenal">📋 Quincenal</option>
                <option value="mensual">📅 Mensual</option>
                <option value="trimestral">📆 Trimestral</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Fecha de inicio</label>
              <input
                type="date"
                value={newProximoEnvio}
                onChange={e => setNewProximoEnvio(e.target.value)}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
          </div>
          {showConfirmationModal && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-xs">
                <h3 className="font-semibold text-lg mb-2">Confirmación</h3>
                <p className="mb-4">¿Confirmás que se realice el primer envío ahora mismo?</p>
                <div className="flex justify-end space-x-2">
                  <Button variant="default" onClick={async () => {
                    setShowConfirmationModal(false);
                    if (pendingScheduleData) {
                      await handleScheduleAndSendNow(pendingScheduleData, pendingScheduleData.proximoEnvio);
                    }
                  }}>Confirmar Envío Ahora</Button>
                  <Button variant="outline" onClick={() => setShowConfirmationModal(false)}>Cancelar</Button>
                </div>
              </div>
            </div>
          )}
          <Button onClick={initiateSchedulingProcess} disabled={!newProximoEnvio || showConfirmationModal}>Programar</Button>
        </div>

        {/* Tabla de envíos programados */}
        <div className={`p-6 rounded-lg shadow ${highlight ? 'bg-yellow-100' : 'bg-white'} transition-colors duration-700`}>
          <h2 className="text-xl font-semibold mb-4">Envíos programados</h2>
          {loadingSends ? (
            <p>Cargando envíos...</p>
          ) : scheduledSends.length > 0 ? (
            <table className="min-w-full table-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-center">Cuestionario</th>
                  <th className="px-4 py-2 text-center">Canal</th>
                  <th className="px-4 py-2 text-center">Frecuencia</th>
                  <th className="px-4 py-2 text-center">Fecha de inicio</th>
                  <th className="px-4 py-2 text-center">Próximo envío</th>
                  <th className="px-4 py-2 text-center">Último envío</th>
                  <th className="px-4 py-2 text-center">Estado</th>
                  <th className="px-4 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {scheduledSends.map(send => (
                  <tr key={send.id} className="border-t">
                    <td className="px-4 py-2 text-center">{send.cuestionarios?.codigo || send.cuestionario_id}</td>
                    <td className="px-4 py-2 text-center">{send.canal}</td>
                    <td className="px-4 py-2 text-center">{send.frecuencia}</td>
                    <td className="px-4 py-2 text-center">
                      {send.fecha_inicio_programada
                        ? new Date(send.fecha_inicio_programada).toLocaleDateString()
                        : new Date(send.creado_en).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {send.frecuencia === 'unico' 
                        ? 'N/A' 
                        : new Date(computeNextDate(send.lastSent ?? send.proximo_envio ?? send.creado_en, send.frecuencia)).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-center">{new Date(send.lastSent ?? send.creado_en).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        send.respondido ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {send.respondido ? 'respondido' : 'pendiente de respuesta'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center space-x-2">
                      <button onClick={() => sendNow(send)} disabled={!!reminderSent[send.id]} title="Envía un recordatorio amable para que el paciente complete el cuestionario" className={`px-2 py-1 rounded text-white ${
                        reminderSent[send.id] ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                      }`}>
                        {reminderSent[send.id] ? 'Recordatorio enviado' : 'Enviar Recordatorio'}
                      </button>
                      <button onClick={() => setCancelSendId(send.id)} title="Cancela todo el ciclo de envíos programados" className="px-2 py-1 bg-gray-300 rounded">
                        Cancelar envíos programados
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay envíos programados</p>
          )}
        </div>



        {/* Modal de confirmación para cancelar envío programado */}
        {cancelSendId && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs">
              <h3 className="text-lg font-semibold mb-2">Cancelar envío programado</h3>
              <p className="mb-4">¿Seguro que deseas cancelar este envío programado?</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setCancelSendId(null)}
                  className="px-3 py-1 bg-gray-200 rounded"
                >
                  Volver
                </button>
                <button
                  onClick={() => {
                    cancelSendInternal(cancelSendId);
                    setCancelSendId(null);
                  }}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
