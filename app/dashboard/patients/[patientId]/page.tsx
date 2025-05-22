"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
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
  }
  const [scheduledSends, setScheduledSends] = useState<ScheduledSend[]>([]);
  const [loadingSends, setLoadingSends] = useState(true);

  // Estado de remider enviado per-row
  const [reminderSent, setReminderSent] = useState<{ [id: string]: boolean }>({});

  const [newCanal, setNewCanal] = useState<string>('email');
  const [newFrecuencia, setNewFrecuencia] = useState<string>('mensual');
  const [newProximoEnvio, setNewProximoEnvio] = useState<string>(() =>
    new Date().toISOString().slice(0, 16)
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
        body: JSON.stringify({ pacienteId: patientId, cuestionarioId: send.cuestionario_id, canal: send.canal }),
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
      alert((e as Error).message);
    }
  };

  const createScheduledSend = async () => {
    try {
      const res = await fetch('/api/envios_programados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacienteId: patientId, cuestionarioId: newCuestionarioId, canal: newCanal, frecuencia: newFrecuencia, proximoEnvio: newProximoEnvio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al programar envío');
      // Refrescar lista completa para obtener campo `codigo`
      const listRes = await fetch(`/api/envios_programados?pacienteId=${patientId}`);
      const listData = await listRes.json();
      if (listRes.ok) setScheduledSends(listData);
      setNewProximoEnvio(new Date().toISOString().slice(0, 16));
      // Enviar primer cuestionario automáticamente
      const sendRes = await fetch('/api/cuestionarios/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacienteId: patientId, cuestionarioId: newCuestionarioId, canal: newCanal }),
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData.error || 'Error al enviar primer cuestionario');
      setNotification('Primer cuestionario enviado');
      setHighlight(true);
      setTimeout(() => setHighlight(false), 1500);
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
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
      alert((e as Error).message);
    }
  };

  // Computar próxima fecha según frecuencia
  function computeNextDate(start: string, frequency: string): string {
    const date = new Date(start);
    if (frequency === 'semanal') date.setDate(date.getDate() + 7);
    else if (frequency === 'mensual') date.setMonth(date.getMonth() + 1);
    else if (frequency === 'trimestral') date.setMonth(date.getMonth() + 3);
    return date.toISOString();
  }

  if (loading) return <div className="p-6">Cargando evolución...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

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
    <div>
      {notification && (
        <div className="fixed top-4 right-4 px-4 py-2 rounded shadow z-50 text-white bg-blue-600">
          {notification}
        </div>
      )}
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Evolución de {patientName || 'Paciente'}</h1>
        <div className="bg-white p-6 rounded-lg shadow h-96">
          <Line data={chartData} options={options} />
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
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Fecha de inicio</label>
              <input
                type="datetime-local"
                value={newProximoEnvio}
                onChange={e => setNewProximoEnvio(e.target.value)}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
          </div>
          <button onClick={createScheduledSend} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            Programar
          </button>
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
                  <th className="px-4 py-2 text-center">Envío inicial</th>
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
                    <td className="px-4 py-2 text-center">{new Date(send.creado_en).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-center">{new Date(computeNextDate(send.lastSent ?? send.creado_en, send.frecuencia)).toLocaleDateString()}</td>
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
  );
}
