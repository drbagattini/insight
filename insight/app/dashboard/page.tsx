'use client';

import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import StatCard from '@/components/dashboard/StatCard';
import PatientForm from '@/components/patients/PatientForm';
import { NewPatient } from '@/types/patients';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
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

// Datos de ejemplo para el gráfico WHO-5
const whoData = {
  labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
  datasets: [
    {
      label: 'WHO-5 Promedio',
      data: [65, 70, 68, 72, 75, 78],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
    },
  ],
};

export default function DashboardPage() {
  const [showPatientForm, setShowPatientForm] = useState(false);

  const handleAddPatient = async (data: NewPatient) => {
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al crear paciente');
      }

      setShowPatientForm(false);
      // Aquí podrías actualizar la caché de react-query o recargar los datos
    } catch (error) {
      console.error('Error:', error);
      // Manejar el error apropiadamente
    }
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Pacientes Activos"
          value="24"
          icon={UserGroupIcon}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Cuestionarios Pendientes"
          value="8"
          icon={ClipboardDocumentListIcon}
          trend={{ value: 5, isPositive: false }}
        />
        <StatCard
          title="Citas esta Semana"
          value="15"
          icon={CalendarIcon}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Gráfico WHO-5 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Tendencia WHO-5 (últimos 6 meses)
        </h2>
        <div className="h-64">
          <Line data={whoData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setShowPatientForm(true)}
          className="p-6 bg-white rounded-lg shadow text-left hover:bg-gray-50"
        >
          <h3 className="text-lg font-medium text-gray-900">Agregar Paciente</h3>
          <p className="mt-2 text-sm text-gray-600">
            Registra un nuevo paciente en el sistema
          </p>
        </button>
        <button className="p-6 bg-white rounded-lg shadow text-left hover:bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Enviar Cuestionario</h3>
          <p className="mt-2 text-sm text-gray-600">
            Envía un cuestionario WHO-5 a un paciente
          </p>
        </button>
        <button className="p-6 bg-white rounded-lg shadow text-left hover:bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Programar Cita</h3>
          <p className="mt-2 text-sm text-gray-600">
            Agenda una nueva cita con un paciente
          </p>
        </button>
      </div>

      {/* Modal de Agregar Paciente */}
      {showPatientForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Agregar Nuevo Paciente
            </h2>
            <PatientForm
              onSubmit={handleAddPatient}
              onCancel={() => setShowPatientForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
