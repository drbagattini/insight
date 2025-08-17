"use client";

import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo, Fragment } from 'react';
import { Tab, Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Calendar } from 'lucide-react';
import { PatientResponsesSection } from '@/components/patient/PatientResponsesSection';
import { PatientIntakeTab } from '@/components/patient/PatientIntakeTab';
import { PatientDetails } from '@/components/patient/PatientDetails';
import { EvolutionTab } from '@/components/patient/EvolutionTab';
import QuestionnaireChart from '@/components/QuestionnaireChart';
import questionnairesMeta from '@/src/data/questionnairesMeta';
import { QUESTIONNAIRE_ORDER } from '@/lib/questionnaire-order';
import InformesTab from '@/components/informes/InformesTab';
import ScheduleQuestionnaireModal from '@/components/patient/ScheduleQuestionnaireModal';
import { SupervisionChatStreaming } from '@/components/patient/SupervisionChatStreaming';

export default function PatientProfilePage() {
  const params = useParams() as { patientId: string };
  const patientId = params.patientId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string>('WHO-5');
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [patientName, setPatientName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSupervisionChat, setShowSupervisionChat] = useState(false);

  const availableDates = useMemo(() => {
    return [...new Set(evolutionData.map((item: any) => (item.fecha ?? item.creado_en).split('T')[0]))]
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [evolutionData]);

  // Seleccionar fecha por defecto o limpiar según cuestionario
  useEffect(() => {
    if (selectedQuestionnaire === 'WHO-5' || selectedQuestionnaire === 'BR-WAI' || selectedQuestionnaire === 'PHQ-9' || selectedQuestionnaire === 'GAD-7') {
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
    activo: boolean;
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
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  // Detect URL hash and set correct tab on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#cuestionarios') {
      setSelectedTabIndex(1);
    }
  }, []);

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
        console.log('[DEBUG] Loading scheduled sends for patient:', patientId);
        const res = await fetch(`/api/envios_programados?pacienteId=${patientId}`);
        const data = await res.json();
        console.log('[DEBUG] Scheduled sends API response:', data);
        if (!res.ok) throw new Error(data.error || 'Error al cargar envíos programados');
        
        // Filtrar envíos cancelados completamente (activo = false)
        const filteredSends = data.filter((send: any) => {
          // Si cancel_all o cancel_next de envío único, no mostrar
          if (!send.activo) return false;
          return true;
        });
        
        setScheduledSends(filteredSends);
        console.log('[DEBUG] Set scheduled sends state (filtered):', filteredSends);
      } catch (e) {
        console.error('[DEBUG] Error loading scheduled sends:', e);
      } finally {
        setLoadingSends(false);
      }
    }
    console.log('[DEBUG] useEffect for scheduled sends - selectedTabIndex:', selectedTabIndex);
    if (selectedTabIndex === 2) { // Only load if Cuestionarios psicométricos tab is active (index 2)
      console.log('[DEBUG] Loading scheduled sends because tab index is 2 (Cuestionarios psicométricos)');
      loadScheduled();
    } else {
      console.log('[DEBUG] Not loading scheduled sends, tab index is not 2');
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
    if (selectedTabIndex === 2) { // Only load if Cuestionarios psicométricos tab is active (index 2)
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
      if (listRes.ok) {
        // Filtrar envíos cancelados completamente (activo = false)
        const filteredSends = listData.filter((send: any) => {
          if (!send.activo) return false;
          return true;
        });
        setScheduledSends(filteredSends);
      }
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
      if (listRes.ok) {
        // Filtrar envíos cancelados completamente (activo = false)
        const filteredSends = listData.filter((send: any) => {
          if (!send.activo) return false;
          return true;
        });
        setScheduledSends(filteredSends);
      }
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
      if (listRes.ok) {
        // Filtrar envíos cancelados completamente (activo = false)
        const filteredSends = listData.filter((send: any) => {
          if (!send.activo) return false;
          return true;
        });
        setScheduledSends(filteredSends);
      }
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    }
  };

  // Cancelación avanzada con opciones granulares
  const handleAdvancedCancel = async (id: string, action: 'cancel_next' | 'cancel_all' | 'pause' | 'unpause', razon: string) => {
    try {
      const res = await fetch('/api/envios_programados/cancelar-avanzado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          envioId: id,
          action,
          razon
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error en la operación');
      }
      
      const result = await res.json();
      
      // Mostrar mensaje de éxito
      setNotification(result.message);
      setTimeout(() => setNotification(null), 3000);
      
      // Cerrar el modal
      setCancelSendId(null);
      
      // Refrescar lista de envíos programados
      const listRes = await fetch(`/api/envios_programados?pacienteId=${patientId}`);
      const listData = await listRes.json();
      if (listRes.ok) {
        // Filtrar envíos cancelados completamente (activo = false)
        const filteredSends = listData.filter((send: any) => {
          // Si cancel_all o cancel_next de envío único, no mostrar
          if (!send.activo) return false;
          return true;
        });
        setScheduledSends(filteredSends);
      }
      
    } catch (e) {
      console.error('Error en cancelación avanzada:', e);
      setError((e as Error).message);
      setShowErrorModal(true);
    }
  };

  // Computar próxima fecha según frecuencia
  const computeNextDate = (start: string, frequency: string): string => {
    if (frequency === 'unico') return 'N/A'; // No hay próximo envío para 'unico'
    const date = new Date(start);
    if (frequency === 'semanal') date.setDate(date.getDate() + 7);
    else if (frequency === 'quincenal') date.setDate(date.getDate() + 14);
    else if (frequency === 'mensual') date.setMonth(date.getMonth() + 1);
    else if (frequency === 'trimestral') date.setMonth(date.getMonth() + 3);
    return date.toISOString();
  };

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">{patientName || 'Perfil del paciente'}</h1>
          <p className="text-lg text-gray-600">Seguimiento clínico integral</p>
        </div>
        <Tab.Group selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex}>
          <div className="mb-8">
            <Tab.List className="flex bg-gray-100 rounded-xl p-2 shadow-sm border border-gray-200">
              {['Entrevista inicial', 'Evolución Clínica', 'Evaluación Psicométrica', 'Informes'].map((category, index) => (
                <Tab
                  key={category}
                  className={({ selected }) =>
                    `relative flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 focus:outline-none ` +
                    `rounded-lg whitespace-nowrap text-center ` +
                    `${selected 
                      ? 'text-blue-700 bg-white shadow-lg ring-1 ring-blue-100 transform scale-[1.02]' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                    }`
                  }
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      selectedTabIndex === index 
                        ? 'bg-blue-500 ring-2 ring-blue-200' 
                        : 'bg-gray-400'
                    }`} />
                    <span>{category}</span>
                  </span>
                  
                  {/* Gradient overlay for active tab */}
                  {selectedTabIndex === index && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 opacity-40" />
                  )}
                </Tab>
              ))}
            </Tab.List>
          </div>
          <Tab.Panels>
            <Tab.Panel className="focus:outline-none">
              <PatientIntakeTab />
            </Tab.Panel>
            <Tab.Panel className="focus:outline-none">
              <EvolutionTab patientId={patientId} />
            </Tab.Panel>
            <Tab.Panel className="focus:outline-none">
              <div className="space-y-4 p-6">
                {/* Header con botón principal */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-gray-900 p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-700">Evaluación Psicométrica</h2>
                      <p className="text-gray-500 mt-0.5 text-sm">
                        Análisis y seguimiento de escalas aplicadas
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowScheduleModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      Programar Envío
                    </Button>
                  </div>
                </div>
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
                          {QUESTIONNAIRE_ORDER
                            .filter(code => questionnairesMeta[code as keyof typeof questionnairesMeta])
                            .map((key) => (
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
                            <div className="flex flex-col space-y-1">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                // Detectar si está pausado (fecha muy lejana en 2099-01-01)
                                send.proximo_envio && send.proximo_envio.startsWith('2099-01-01') 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : send.activo 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                              }`}>
                                {send.proximo_envio && send.proximo_envio.startsWith('2099-01-01') 
                                  ? 'Pausado' 
                                  : send.activo 
                                    ? 'Activo' 
                                    : 'Cancelado'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                send.respondido ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {send.respondido ? 'Respondido' : 'Pendiente'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center space-x-2">
                            <button onClick={() => sendNow(send)} disabled={!!reminderSent[send.id]} title="Envía un recordatorio amable para que el paciente complete el cuestionario" className={`px-2 py-1 rounded text-white ${
                              reminderSent[send.id] ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                            }`}>
                              {reminderSent[send.id] ? 'Recordatorio enviado' : 'Enviar Recordatorio'}
                            </button>
                            <button onClick={() => setCancelSendId(send.id)} title="Gestionar envíos programados" className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400">
                              Gestionar envíos
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
            <Tab.Panel className="focus:outline-none">
              <InformesTab 
                patientId={patientId} 
                patientName={patientName}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
      {/* Modal de gestión de envíos programados */}
      {cancelSendId && (() => {
        // Encontrar el envío seleccionado para determinar si está pausado
        const selectedSend = scheduledSends.find(send => send.id === cancelSendId);
        const isPaused = selectedSend?.proximo_envio?.startsWith('2099-01-01');
        
        return (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Gestionar envíos programados</h3>
              <p className="mb-6 text-gray-600">Selecciona qué acción deseas realizar con este envío recurrente:</p>
            
            <div className="space-y-3 mb-6">
              {/* Opción 1: Posponer próximo envío */}
              <button
                onClick={() => {
                  handleAdvancedCancel(cancelSendId, 'cancel_next', 'Posponer próximo envío por decisión del psicólogo');
                  setCancelSendId(null);
                }}
                className="w-full p-4 text-left border-2 border-yellow-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                  <div>
                    <div className="font-medium text-gray-800">Posponer próximo envío</div>
                    <div className="text-sm text-gray-600">Salta el próximo envío, continúa la recurrencia normal</div>
                  </div>
                </div>
              </button>
              
              {/* Opción 2: Pausar/Despausar */}
              <button
                onClick={() => {
                  const action = isPaused ? 'unpause' : 'pause';
                  const reason = isPaused ? 'Reactivar envíos programados' : 'Pausar envíos temporalmente para evaluación';
                  handleAdvancedCancel(cancelSendId, action, reason);
                  setCancelSendId(null);
                }}
                className={`w-full p-4 text-left border-2 rounded-lg transition-colors ${
                  isPaused 
                    ? 'border-green-200 hover:border-green-300 hover:bg-green-50' 
                    : 'border-blue-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    isPaused ? 'bg-green-400' : 'bg-blue-400'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {isPaused ? 'Reactivar envíos' : 'Pausar temporalmente'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {isPaused 
                        ? 'Reactiva los envíos programados con la próxima fecha' 
                        : 'Detiene todos los envíos, se puede reactivar después'
                      }
                    </div>
                  </div>
                </div>
              </button>
              
              {/* Opción 3: Finalizar completamente */}
              <button
                onClick={() => {
                  handleAdvancedCancel(cancelSendId, 'cancel_all', 'Finalizar tratamiento - alta médica');
                  setCancelSendId(null);
                }}
                className="w-full p-4 text-left border-2 border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-3"></div>
                  <div>
                    <div className="font-medium text-gray-800">Finalizar completamente</div>
                    <div className="text-sm text-gray-600">Cancela todos los envíos futuros permanentemente</div>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setCancelSendId(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
        );
      })()}
      {/* Modal de programar envío de cuestionarios */}
      <ScheduleQuestionnaireModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        patientId={patientId}
        onSuccess={(message) => {
          setNotification(message);
          // Refrescar envíos programados si estamos en la pestaña de cuestionarios
          if (selectedTabIndex === 2) {
            // Trigger refresh of scheduled sends
            const refreshScheduledSends = async () => {
              try {
                const listRes = await fetch(`/api/envios_programados?pacienteId=${patientId}`);
                const listData = await listRes.json();
                if (listRes.ok) {
                  const filteredSends = listData.filter((send: any) => {
                    if (!send.activo) return false;
                    return true;
                  });
                  setScheduledSends(filteredSends);
                }
              } catch (e) {
                console.error('Error refreshing scheduled sends:', e);
              }
            };
            refreshScheduledSends();
          }
        }}
        onError={(error) => {
          setError(error);
        }}
      />
      
      {/* Componente de Supervisión Clínica Interactiva */}
      <SupervisionChatStreaming
        patientId={patientId}
        patientName={patientName}
        isVisible={showSupervisionChat}
        onToggle={() => setShowSupervisionChat(!showSupervisionChat)}
      />
    </>
  );
}
