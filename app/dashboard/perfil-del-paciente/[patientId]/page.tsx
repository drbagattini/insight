"use client";

import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo, Fragment } from 'react';
import { Tab, Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { PatientResponsesSection } from '@/components/patient/PatientResponsesSection';
import { PatientIntakeTab } from '@/components/patient/PatientIntakeTab';
import { PatientDetails } from '@/components/patient/PatientDetails';
import QuestionnaireChart from '@/src/components/QuestionnaireChart';
import questionnairesMeta from '@/src/data/questionnairesMeta';

export default function PatientProfilePage() {
  const params = useParams() as { patientId: string };
  const patientId = params.patientId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<'WHO-5' | 'OPD-CA2-SQ'>('WHO-5');
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [patientName, setPatientName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const availableDates = useMemo(() => {
    return [...new Set(evolutionData.map((item: any) => (item.fecha ?? item.creado_en).split('T')[0]))]
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [evolutionData]);

  // Seleccionar fecha por defecto o limpiar según cuestionario
  useEffect(() => {
    if (selectedQuestionnaire === 'WHO-5') {
      setSelectedDate(null);
    } else if (selectedQuestionnaire === 'OPD-CA2-SQ' && availableDates.length > 0) {
      // última fecha por defecto
      setSelectedDate(availableDates[availableDates.length - 1]);
    }
  }, [selectedQuestionnaire, availableDates]);

  const filteredEvolutionData = useMemo(() => {
    if (!selectedDate) return evolutionData;
    return evolutionData.filter((item: any) => (item.fecha ?? item.creado_en).split("T")[0] === selectedDate);
  }, [evolutionData, selectedDate]);

  const chartTitle = useMemo(() => {
    if (selectedQuestionnaire === 'OPD-CA2-SQ') {
      return 'Perfil Estructural del Adolescente';
    }
    return questionnairesMeta[selectedQuestionnaire].title;
  }, [selectedQuestionnaire]);

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
  const [questionnaires, setQuestionnaires] = useState<{ id: string; codigo: string; titulo: string }[]>([]);
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
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  useEffect(() => {
    if (error) setShowErrorModal(true);
  }, [error]);

  useEffect(() => {
    async function loadEvolution() {
      setLoading(true);
      try {
        console.log(`Cargando datos para cuestionario: ${selectedQuestionnaire}`);
        const res = await fetch(`/api/cuestionarios/resultados/paciente/${patientId}?codigo=${selectedQuestionnaire}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error al cargar evolución');
        
        if (selectedQuestionnaire === 'OPD-CA2-SQ') {
          console.log('API OPD-CA2-SQ - Respuesta completa:', json);
          console.log('API OPD-CA2-SQ - Datos procesados:', JSON.stringify(json.data, null, 2));
          
          // Verificar estructura de datos
          if (json.data && json.data.length > 0) {
            const lastItem = json.data[json.data.length - 1];
            console.log('API OPD-CA2-SQ - Último ítem:', JSON.stringify(lastItem, null, 2));
            console.log('API OPD-CA2-SQ - ¿Tiene score_detallado?', !!lastItem.score_detallado);
            if (lastItem.score_detallado) {
              console.log('API OPD-CA2-SQ - Estructura de score_detallado:', Object.keys(lastItem.score_detallado));
              console.log('API OPD-CA2-SQ - ¿Tiene subDimensions?', !!lastItem.score_detallado.subDimensions);
            }
          } else {
            console.log('API OPD-CA2-SQ - No hay datos o array vacío');
          }
        } else {
          console.log(`DATOS API ${selectedQuestionnaire}:`, JSON.stringify(json.data, null, 2));
        }
        
        setEvolutionData(json.data);
      } catch (err) {
        console.error(`Error cargando ${selectedQuestionnaire}:`, err);
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
    if (selectedTabIndex === 1) { // Only load if Cuestionarios tab is active
      loadScheduled();
    }
  }, [patientId, selectedTabIndex]);

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
    if (selectedTabIndex === 1) { // Only load if Cuestionarios tab is active
      loadQuestionnaires();
    }
  }, [selectedTabIndex]);

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

      console.log('[handleScheduleAndSendNow] Posting to /api/envios_programados', { ...scheduleData, proximoEnvio: proximoEnvioParaBackend });
    const scheduleRes = await fetch('/api/envios_programados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scheduleData,
          proximoEnvio: proximoEnvioParaBackend,
        }),
      });
      const scheduleResData = await scheduleRes.json();
    console.log('[handleScheduleAndSendNow] scheduleResData', scheduleResData);
      console.log('[handleScheduleAndSendNow] scheduleRes status', scheduleRes.status);
    if (!scheduleRes.ok) {
        if (scheduleResData.errorCode === 'PROGRAMACION_RECURRENTE_EXISTENTE') {
          setError(scheduleResData.error);
        } else {
          setError(scheduleResData.error || 'Error al programar el envío');
        console.error('[handleScheduleAndSendNow] Error al programar', scheduleResData.error);
        }
        return;
      }

      const envioProgramadoId = scheduleResData.id;
    console.log('[handleScheduleAndSendNow] envioProgramadoId', envioProgramadoId);
      if (!envioProgramadoId) {
        setError("No se pudo obtener el ID del envío programado para el envío inmediato.");
      console.error('[handleScheduleAndSendNow] Missing envioProgramadoId, aborting sendNow');
        return;
      }

      console.log('[handleScheduleAndSendNow] Posting to /api/cuestionarios/enviar');
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

    const hoyStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local TZ

    console.log('[initiateSchedulingProcess] fechaParaEnviar', fechaParaEnviar, 'hoyStr', hoyStr);
    if (fechaParaEnviar === hoyStr) {
      console.log('[initiateSchedulingProcess] Fecha es hoy, mostrando modal');
      setShowConfirmationModal(true);
    } else if (fechaParaEnviar > hoyStr) {
      console.log('[initiateSchedulingProcess] Fecha futura, programando sin modal');
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
    else if (frequency === 'mensual') date.setMonth(date.getMonth() + 1);
    else if (frequency === 'trimestral') date.setMonth(date.getMonth() + 3);
    return date.toISOString();
  }



  return (
    <>
      {/* Notification and Error Modals will be outside Tab.Group for page-level display */}
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
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold mb-4">Perfil del paciente</h1>
        <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
          <div className="mb-8">
            <Tab.List className="flex bg-gray-50 rounded-xl p-1.5 shadow-sm border border-gray-200">
              {['Entrevista inicial', 'Cuestionarios psicométricos'].map((category, index) => (
                <Tab
                  key={category}
                  className={({ selected }) =>
                    `relative flex-1 px-6 py-3.5 text-sm font-semibold transition-all duration-300 focus:outline-none ` +
                    `rounded-lg whitespace-nowrap text-center ` +
                    `${selected 
                      ? 'text-indigo-700 bg-white shadow-md ring-1 ring-indigo-100 transform scale-[1.02]' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`
                  }
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      selectedTabIndex === index 
                        ? 'bg-indigo-500 ring-2 ring-indigo-200' 
                        : 'bg-gray-300'
                    }`} />
                    <span>{category}</span>
                  </span>
                  
                  {/* Gradient overlay for active tab */}
                  {selectedTabIndex === index && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 opacity-30" />
                  )}
                </Tab>
              ))}
            </Tab.List>
          </div>
          <Tab.Panels>
            <Tab.Panel className="focus:outline-none">
              <PatientIntakeTab />
            </Tab.Panel>
            <Tab.Panel className="rounded-xl bg-white border border-gray-200 shadow-sm min-h-[600px] overflow-hidden focus:outline-none">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">Evolución Psicométrica</h3>
                <p className="text-sm text-gray-600 mt-1">Análisis y seguimiento de cuestionarios aplicados al paciente</p>
              </div>
              <div className="p-6">
                <div className="mb-6 w-fit">
                  <Listbox value={selectedQuestionnaire} onChange={setSelectedQuestionnaire}>
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-2.5 pr-8 text-left shadow-sm border border-gray-300 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500 text-sm">
                        <span className="block truncate">{questionnairesMeta[selectedQuestionnaire].title}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                        </span>
                      </Listbox.Button>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                          {(Object.keys(questionnairesMeta) as Array<'WHO-5' | 'OPD-CA2-SQ'>).map((key) => (
                            <Listbox.Option
                              key={key}
                              className={({ active }) =>
                                `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
                              }
                              value={key}
                            >
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                    {questionnairesMeta[key].title}
                                  </span>
                                  {selected ? (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  ) : null}
                                </>)}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </div>
                
                {/* Filtro de fecha (solo OPD-CA2-SQ) */}
                {selectedQuestionnaire === 'OPD-CA2-SQ' && availableDates.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 mt-2 justify-end">
                  <div>
                    <label className="block text-xs font-medium mb-1">Fecha de la toma</label>
                    <select 
                      className="w-full px-2 py-1.5 border rounded-md text-sm"
                      value={selectedDate ?? ''}
                      onChange={e => setSelectedDate(e.target.value)}
                    > 
                      {availableDates.map(d => {
                        // Parse date as local to prevent timezone shifts in display
                        const localDate = new Date(d + 'T00:00:00');
                        return (
                          <option key={d} value={d}>
                            {localDate.toLocaleDateString()}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                )}

                {loading ? (
                <p>Cargando evolución...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : filteredEvolutionData.length > 0 ? (
                <div className="bg-white p-3 rounded-lg shadow-sm mt-2 border border-gray-100">
                  <QuestionnaireChart data={filteredEvolutionData} codigo={selectedQuestionnaire} titleOverride={chartTitle} />
                </div>
                ) : (
                  <p className="mt-4">No hay datos de evolución para mostrar para el cuestionario seleccionado.</p>
                )}
                
                <div className="mt-8 mb-8">
                  <PatientResponsesSection patientId={patientId} />
                </div>

                {/* Programar nuevo envío */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6 mt-6">
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
                        data-testid="questionnaire-select"
                      >
                        {questionnaires.map(q => (
                          <option key={q.id} value={q.id}>
                            {q.codigo}
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
                      data-testid="frequency-select"
                      value={newFrecuencia}
                      onChange={e => setNewFrecuencia(e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                    >
                      <option value="unico">Envío único</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensual">Mensual</option>
                      <option value="trimestral">Trimestral</option>
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
                        <Button
                          variant="default"
                          type="button"
                          data-testid="confirm-send-now-btn"
                          onClick={async () => {
                            console.log('[PatientProfilePage] Confirmar Envío Ahora clicked');
                            setShowConfirmationModal(false);
                            const scheduleToUse = pendingScheduleData ?? {
                              pacienteId: patientId,
                              cuestionarioId: newCuestionarioId || undefined,
                              canal: newCanal,
                              frecuencia: newFrecuencia,
                              proximoEnvio: newProximoEnvio.split('T')[0],
                            };
                            await handleScheduleAndSendNow(scheduleToUse, scheduleToUse.proximoEnvio);
                          }}
                        >
                          Confirmar Envío Ahora
                        </Button>
                        <Button variant="outline" onClick={() => setShowConfirmationModal(false)}>Cancelar</Button>
                      </div>
                    </div>
                  </div>
                )}
                <Button onClick={initiateSchedulingProcess} disabled={!newProximoEnvio || showConfirmationModal}>Programar</Button>
              </div>

              {/* Tabla de envíos programados - Moved into Tab.Panel */}
              <div className={`p-6 rounded-lg shadow ${highlight ? 'bg-yellow-100' : 'bg-white'} transition-colors duration-700 mt-6`}>
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
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
      {/* Modal de confirmación para cancelar envío programado - keep at page level or move if tab-specific */}
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
    </>
  );
}
