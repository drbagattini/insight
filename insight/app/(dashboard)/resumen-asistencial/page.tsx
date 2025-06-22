'use client';

import { useState, Fragment } from 'react';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format, subDays } from 'date-fns'; 
import { es as esLocaleDate } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, 
  CalendarClock, 
  ClipboardList, 
  AlertTriangle, 
} from 'lucide-react';

import KpiCard from '@/components/dashboard/KpiCard';
import PatientForm from '@/components/patients/PatientForm';
import { NewPatient } from '@/types/patients';
import { AppointmentModal, ModalAppointmentData } from '@/components/appointments/AppointmentModal';
import HeaderActions from '@/components/dashboard/HeaderActions';
import RiskPatientsDrawer from '@/components/dashboard/RiskPatientsDrawer';
import PendingQuestionnairesModal from '@/components/dashboard/PendingQuestionnairesModal';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { Dialog, Transition } from '@headlessui/react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

export default function DashboardPage() {
  const router = useRouter();
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [currentAppointmentData, setCurrentAppointmentData] = useState<ModalAppointmentData | null>(null);
  const [isRiskDrawerOpen, setIsRiskDrawerOpen] = useState(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);

  // State for WHO-5 date range (default 90 days)
  const ninetyDaysAgo = subDays(new Date(), 90);
  const today = new Date();

  const [startDate, setStartDate] = useState<string>(format(ninetyDaysAgo, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(today, 'yyyy-MM-dd'));

  // Fetch Dashboard Summary Data (KPIs, Risk Patients)
  const { data: summaryData, isLoading: loadingSummary } = useDashboardSummary();

  // Fetch WHO-5 trend data
  const fetchWho5TrendData = async (start: string, end: string): Promise<any[]> => {
    const { data } = await axios.get('/api/dashboard/who5-trend', {
      params: { startDate: start, endDate: end },
    });
    return data.map((point: any) => ({
      x: point.x, 
      y: point.y, 
      patientName: point.patientName || 'Desconocido',
    }));
  };

  const { data: who5ScatterData = [], isLoading: loadingWho5Data } = useQuery<any[], Error>({
    queryKey: ['who5Trend', startDate, endDate],
    queryFn: () => fetchWho5TrendData(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });

  // Fetch Upcoming Appointments
  const { data: upcomingAppointments = [], isLoading: loadingUpcoming } = useQuery<any[]>({    
    queryKey: ['upcomingAppointmentsDashboard'], 
    queryFn: async () => {
      const now = new Date().toISOString();
      // Buscar próximas citas en los próximos 30 días
      const endPeriod = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); 
      const res = await axios.get('/api/appointments', { params: { start: now, end: endPeriod, limit: 5, sortBy: 'start_time_asc' } });
      return (res.data as any[])
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, 5); 
    },
  });

  const handleAddPatientSubmit = async (data: NewPatient) => {
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al crear paciente');
      const { paciente } = await response.json();
      setShowPatientForm(false);
      // Redirigir a la página del nuevo paciente
      router.push(`/dashboard/perfil-del-paciente/${paciente.id}`);
    } catch (error) {
      console.error('Error creating patient:', error);
      // Handle error appropriately in UI
    }
  };

  const riskPatientIds = summaryData?.riskPatients?.map(p => p.id) || [];

  return (
    <div className="space-y-6">
      <HeaderActions 
        onNewPatientClick={() => setShowPatientForm(true)}
        onScheduleAppointmentClick={() => { setCurrentAppointmentData(null); setIsAppointmentModalOpen(true); }}
      />
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Pacientes Activos"
          value={summaryData?.activePatients ?? '-'}
          icon={Users}
          isLoading={loadingSummary}
        />
        <KpiCard
          title="Citas esta Semana"
          value={summaryData?.weekAppointments ?? '-'}
          delta={summaryData?.weekVariation}
          icon={CalendarClock}
          isLoading={loadingSummary}
        />
        <KpiCard
          title="Cuestionarios Pendientes"
          value={summaryData?.questionnairesPending ?? '-'}
          icon={ClipboardList}
          isLoading={loadingSummary}
          onClick={() => setIsPendingModalOpen(true)}
        />
        <KpiCard
          title="Pacientes en Riesgo"
          value={summaryData?.riskPatients?.length ?? '-'}
          icon={AlertTriangle}
          isLoading={loadingSummary}
          onClick={() => setIsRiskDrawerOpen(true)}
          bgColor="bg-red-700"
          textColor="text-white"
        />
      </div>
      {/* Gráfico WHO-5 Scatter Plot */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Tendencia WHO-5</h3>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-start sm:items-center w-full sm:w-auto">
            <div className='flex items-center w-full sm:w-auto'>
              <label htmlFor="startDateWho5" className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Desde:</label>
              <input
                type="date"
                id="startDateWho5"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
            <div className='flex items-center w-full sm:w-auto'>
              <label htmlFor="endDateWho5" className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Hasta:</label>
              <input
                type="date"
                id="endDateWho5"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
          </div>
        </div>
        <div className="h-96">
          {loadingWho5Data ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Cargando datos del gráfico...</p>
            </div>
          ) : (
            <Scatter
              data={{
                datasets: [
                  {
                    label: 'Puntuaciones WHO-5',
                    data: who5ScatterData,
                    backgroundColor: 'rgb(59, 130, 246)',
                    borderColor: 'rgb(59, 130, 246)',
                    pointRadius: 5,
                  },
                  {
                    label: 'Umbral de Referencia (25)',
                    hidden: true,
                    data: who5ScatterData.length > 0 
                          ? [{ x: who5ScatterData[0].x, y: 25 }, { x: who5ScatterData[who5ScatterData.length - 1].x, y: 25 }] 
                          : [], 
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    tension: 0.1,
                  }
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    type: 'time',
                    time: {
                      unit: 'day',
                      tooltipFormat: 'PP',
                      displayFormats: { day: 'MMM d' }
                    },
                    title: { display: true, text: 'Fecha' },
                  },
                  y: {
                    title: { display: true, text: 'Puntuación WHO-5' },
                    beginAtZero: true,
                    suggestedMax: 100,
                    ticks: { stepSize: 10 }
                  },
                },
                plugins: {
                  legend: {
                    position: 'top' as const,
                    labels: {
                      filter: function(legendItem, chartData) {
                        if (legendItem.text && legendItem.text.includes('Umbral de Referencia')) {
                          return false;
                        }
                        return true;
                      }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context: any) {
                        let label = context.dataset.label || '';
                        if (label.includes('Umbral de Referencia')) return null;
                        if (label) label += ': ';
                        if (context.parsed.y !== null) label += context.parsed.y;
                        const dataPoint = context.raw as { patientName?: string };
                        if (dataPoint && dataPoint.patientName) label += ` (${dataPoint.patientName})`;
                        return label;
                      }
                    }
                  }
                }
              }}
            />
          )}
        </div>
      </div>
      {/* Próximas 5 citas */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mt-4 mb-6">Próximas 5 citas</h2>
        {loadingUpcoming ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : upcomingAppointments.length > 0 ? (
          <ul className="divide-y divide-gray-300 border-t border-gray-300">
            {upcomingAppointments.map((ev: any) => (
              <li
                key={ev.id}
                className={`first:pt-2 last:pb-0 py-4 px-4 transition-colors hover:bg-gray-50 ${riskPatientIds.includes(ev.paciente_id) ? 'bg-red-50' : ''}`}
              >
                <div className="flex justify-between items-center">
                  {/* Nombre + icono riesgo + título */}
                  <div>
                    <div className="flex items-center space-x-1">
                      <p className="text-gray-900 font-semibold leading-5">
                        {ev.patient_name || 'Sin paciente'}
                      </p>
                      {riskPatientIds.includes(ev.paciente_id) && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    {(() => {
                      const title = (ev.title || '').trim();
                      if (!title) return null;
                      if (title === ev.patient_name) return null;
                      if (title === `Cita con ${ev.patient_name}`) return null;
                      return <p className="text-sm text-gray-500 mt-0.5">{title}</p>;
                    })()}
                  </div>

                  {/* Fecha + acción */}
                  <div className="flex items-center space-x-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-700">
                      <CalendarClock className="h-4 w-4 mr-1 text-gray-500" />
                      {format(new Date(ev.start_time), 'EEE dd MMM, HH:mm', { locale: esLocaleDate })}
                    </div>
                    <Link
                      href={`/dashboard/patients/${ev.paciente_id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 text-xs font-medium rounded-md hover:bg-blue-50 transition"
                    >
                      Ver evolución
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No hay próximas citas programadas.</p>
        )}
      </div>
      {/* Modal de Agregar Paciente */}
      <Transition.Root show={showPatientForm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowPatientForm(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Agregar Nuevo Paciente
                  </h2>
                  <PatientForm
                    onSubmit={handleAddPatientSubmit}
                    onCancel={() => setShowPatientForm(false)}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => {
          setIsAppointmentModalOpen(false);
          setCurrentAppointmentData(null);
        }}
        appointment={currentAppointmentData}
        // onAppointmentUpdated={() => upcomingAppointments.refetch()} 
      />
      <RiskPatientsDrawer 
        isOpen={isRiskDrawerOpen}
        onClose={() => setIsRiskDrawerOpen(false)}
        patients={summaryData?.riskPatients || []}
      />
      <PendingQuestionnairesModal
        isOpen={isPendingModalOpen}
        onClose={() => setIsPendingModalOpen(false)}
      />
    </div>
  );
}
