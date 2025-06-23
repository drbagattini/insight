"use client";

import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { PatientResponsesSection } from '@/components/patients/PatientResponsesSection';
import IntakeWizardSkeleton from '@/components/intake/IntakeWizardSkeleton';
import IntakeWizardEditor from '@/components/intake/IntakeWizardEditor';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function PatientEvolutionPage() {
  const params = useParams() as { patientId: string };
  const patientId = params.patientId;
  const [loading, setLoading] = useState(true);
  const [evolution, setEvolution] = useState<{ puntuacion: number; creado_en: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'evolution' | 'intake'>('intake');
  
  // Separate state variables for better control
  const [intakeRowExists, setIntakeRowExists] = useState<boolean | null>(null);
  const [intakeHasContent, setIntakeHasContent] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [creating, setCreating] = useState(false);

  const checkIntakeExists = useCallback(async () => {
    if (!patientId) return;
    console.log('Checking for intake interview...');
    try {
      const response = await fetch(`/api/patients/${patientId}/evolutions/intake`);
      if (response.ok) {
        try {
          const intakeData = await response.json();
          const actualData = intakeData.data || intakeData;
          
          // Row exists if we got a successful response
          setIntakeRowExists(true);
          
          if (!actualData || Object.keys(actualData).length === 0) {
            setIntakeHasContent(false);
            return;
          }
          
          // Check if the interview has meaningful content beyond defaults
          const isDefaultInterview = actualData && 
            (!actualData.motivoConsulta || actualData.motivoConsulta.trim() === '') &&
            (!actualData.presentacion || actualData.presentacion.trim() === '') &&
            (!actualData.diagnosticoTexto || actualData.diagnosticoTexto.trim() === '') &&
            (!actualData.diagnosticoCodigo || actualData.diagnosticoCodigo.trim() === '') &&
            (!actualData.estrategia || actualData.estrategia.trim() === '') &&
            (!actualData.antecedentesSM || actualData.antecedentesSM.trim() === '') &&
            (!actualData.biologicos || actualData.biologicos.trim() === '') &&
            (!actualData.medicacionPrev || actualData.medicacionPrev.trim() === '') &&
            (!actualData.grupoFamiliar || actualData.grupoFamiliar.trim() === '') &&
            (!actualData.conviveCon || actualData.conviveCon.trim() === '') &&
            (!actualData.ocupacion || actualData.ocupacion === 'Estudiante' || actualData.ocupacion.trim() === '') &&
            (actualData.malestarPaciente === 1 || actualData.malestarPaciente === undefined) &&
            (actualData.gaf === 1 || actualData.gaf === undefined) &&
            (actualData.apoyoSocial === 1 || actualData.apoyoSocial === undefined);
          
          setIntakeHasContent(!isDefaultInterview);
          
        } catch (jsonErr) {
          console.warn('Non-JSON response when checking intake.');
          setIntakeRowExists(true); // Response was OK, so row exists
          setIntakeHasContent(false);
        }
      } else {
        if (response.status === 404) {
          console.log('No intake interview found (404).');
        } else {
          const errorText = await response.text().catch(() => 'Could not read error response body');
          console.error(`API error checking intake: ${response.status}`, errorText.substring(0, 200));
        }
        setIntakeRowExists(false);
        setIntakeHasContent(false);
      }
    } catch (error) {
      console.error('Error checking intake exists:', error);
      setIntakeRowExists(false);
      setIntakeHasContent(false);
    }
  }, [patientId]);

  const handleCreateInterview = useCallback(async () => {
    if (!patientId || creating) return;
    
    setCreating(true);
    setError(null);
    
    try {
      const defaultData = {
        fechaEntrevista: new Date().toISOString().split('T')[0],
        sexo: 'Femenino',
        edad: 25,
        estadoCivil: 'Soltero/a',
        ocupacion: 'Estudiante',
        motivoConsulta: '',
        presentacion: '',
        diagnosticoTexto: '',
        diagnosticoCodigo: '',
        estrategia: '',
        antecedentesSM: '',
        biologicos: '',
        medicacionPrev: '',
        grupoFamiliar: '',
        conviveCon: '',
        malestarPaciente: 1,
        gaf: 1,
        apoyoSocial: 1,
        posicionTerap: 'Predominantemente interpretativa'
      };

      const response = await fetch(`/api/patients/${patientId}/evolutions/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultData)
      });

      if (response.ok) {
        // Optimistic update: we know the row exists now, but content is minimal
        setIntakeRowExists(true);
        setIntakeHasContent(false);
        setIsEditing(true);
        
        // Refresh the data to get the latest state
        await checkIntakeExists();
      } else {
        const errorText = await response.text();
        setError(`Error creating interview: ${errorText}`);
        console.error('Error creating interview:', errorText);
      }
    } catch (error) {
      console.error('Error creating interview:', error);
      setError('Error creating interview. Please try again.');
    } finally {
      setCreating(false);
    }
  }, [patientId, creating, checkIntakeExists]);

  const handleSaveSuccess = useCallback(() => {
    setIsEditing(false);
    checkIntakeExists();
  }, [checkIntakeExists]);

  useEffect(() => {
    if (activeTab === 'intake' && patientId) {
      checkIntakeExists();
    }
  }, [patientId, activeTab, checkIntakeExists]);

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

  useEffect(() => {
    if (error) setShowErrorModal(true);
  }, [error]);

  useEffect(() => {
    async function loadEvolution() {
      try {
        const res = await fetch(`/api/cuestionarios/resultados/paciente/${patientId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error al cargar evolución');
        setEvolution(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    loadEvolution();
  }, [patientId]);

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
    else if (frequency === 'mensual') date.setMonth(date.getMonth() + 1);
    else if (frequency === 'trimestral') date.setMonth(date.getMonth() + 3);
    return date.toISOString();
  }

  if (loading) return <div className="p-6">Cargando evolución...</div>;

  const labels = evolution.map(e => new Date(e.creado_en).toLocaleDateString());
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Puntuación WHO-5',
        data: evolution.map(e => e.puntuacion),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
      {
        label: '', // Oculta leyenda
        data: labels.map(() => 13),
        borderColor: 'red',
        borderWidth: 1,
        borderDash: [5,5],
        pointRadius: 0,
        fill: false,
        borderCapStyle: 'butt' as 'butt',
        borderJoinStyle: 'miter' as 'miter',
        order: 0,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, max: 100 } },
    plugins: {
      legend: {
        labels: {
          filter: (item: any) => item.text !== '', // Oculta leyenda vacía
        },
      },
    },
  };

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
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Evolución de {patientName || 'Paciente'}</h1>
        <div className="flex space-x-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('intake')}
            className={`pb-2 ${activeTab==='intake' ? 'border-b-2 border-blue-600 text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
            data-testid="intake-tab"
          >
            Entrevista Inicial
          </button>
          <button
            onClick={() => setActiveTab('evolution')}
            className={`pb-2 ${activeTab==='evolution' ? 'border-b-2 border-blue-600 text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
            data-testid="evolution-tab"
          >
            Evolución
          </button>
        </div>
        {activeTab === 'evolution' && (
          <div className="bg-white p-6 rounded-lg shadow h-96">
            <Line data={chartData} options={options} />
          </div>
        )}
        {activeTab === 'evolution' && (
          <div className="mb-8">
            <PatientResponsesSection patientId={patientId} />
          </div>
        )}
        {activeTab === 'evolution' && (
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
        )}
        {activeTab === 'evolution' && (
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
        )}
        {activeTab === 'intake' && (
          <div className="w-full">
            {/* Header with buttons */}
            <div className="flex justify-between items-center mb-4">
              {intakeRowExists === null ? (
                <Button size="sm" variant="outline" disabled>
                  Cargando...
                </Button>
              ) : intakeRowExists && intakeHasContent ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(!isEditing)} data-testid="edit-interview-btn">
                    {isEditing ? 'Cancelar y Ver' : 'Editar Entrevista'}
                  </Button>
                  {/* Optional: Allow creating a new interview even when one exists */}
                  {!isEditing && (
                    <Button size="sm" variant="secondary" onClick={handleCreateInterview} disabled={creating} data-testid="register-new-interview-btn">
                      {creating ? 'Creando...' : 'Registrar Nueva Entrevista'}
                    </Button>
                  )}
                </div>
              ) : intakeRowExists && !intakeHasContent ? (
                <Button size="sm" variant="default" onClick={() => setIsEditing(true)} data-testid="complete-interview-btn">
                  Completar Entrevista
                </Button>
              ) : (
                <div></div> // Empty div to maintain layout when no row exists
              )}
            </div>

            {/* Main content: Editor, Skeleton, or Empty State */}
            {isEditing ? (
              <IntakeWizardEditor
                patientId={patientId}
                onSaveSuccess={handleSaveSuccess}
                data-testid="intake-wizard-editor"
              />
            ) : intakeRowExists && intakeHasContent ? (
              <IntakeWizardSkeleton patientId={patientId} data-testid="intake-wizard-skeleton" />
            ) : intakeRowExists && !intakeHasContent ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg" data-testid="incomplete-interview-state">
                <p className="text-gray-500">Entrevista creada pero incompleta</p>
                <p className="text-sm text-gray-400 mt-2">Haz clic en "Completar Entrevista" para continuar</p>
                {error && <p className="text-red-500 mt-2">{error}</p>}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg" data-testid="empty-interview-state">
                <p className="text-gray-500">No hay entrevista inicial registrada</p>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                <Button
                  className="mt-6"
                  variant="default"
                  onClick={handleCreateInterview}
                  disabled={creating}
                  data-testid="register-first-interview-btn"
                >
                  {creating ? 'Creando primera entrevista...' : 'Registrar primera entrevista'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
