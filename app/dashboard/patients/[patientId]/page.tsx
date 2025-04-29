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
        borderCapStyle: 'butt',
        borderJoinStyle: 'miter',
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
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Evolución de {patientName || 'Paciente'}</h1>
      <div className="bg-white p-6 rounded-lg shadow h-96">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
