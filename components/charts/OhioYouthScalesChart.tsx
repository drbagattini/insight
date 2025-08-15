'use client';

import { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import questionnairesMeta from '@/src/data/questionnairesMeta';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface OYSResponse {
  id: string;
  fecha_respuesta: string;
  puntuacion: number;
  respuestas: number[];
  cuestionarios: {
    codigo: string;
    nombre: string;
  };
}

interface OhioYouthScalesChartProps {
  responses: OYSResponse[];
  viewType: 'combined' | 'subdomains';
  informant: 'parent' | 'youth' | 'both';
}

export default function OhioYouthScalesChart({ 
  responses, 
  viewType = 'combined',
  informant = 'both' 
}: OhioYouthScalesChartProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [selectedSubdomain, setSelectedSubdomain] = useState<string>('all');

  useEffect(() => {
    if (responses && responses.length > 0) {
      if (viewType === 'combined') {
        generateCombinedChart();
      } else {
        generateSubdomainChart();
      }
    }
  }, [responses, viewType, informant, selectedSubdomain]);

  // Filtrar respuestas por informante
  const getFilteredResponses = () => {
    if (informant === 'both') return responses;
    
    return responses.filter(response => {
      const codigo = response.cuestionarios.codigo;
      if (informant === 'parent') {
        return codigo.includes('-P-');
      } else {
        return codigo.includes('-Y-');
      }
    });
  };

  // Generar gráfico combinado de líneas para Problemas y Funcionamiento
  const generateCombinedChart = () => {
    const filteredResponses = getFilteredResponses();
    
    // Separar respuestas por tipo (PS = Problemas, F = Funcionamiento)
    const problemsResponses = filteredResponses.filter(r => r.cuestionarios.codigo.includes('PS'));
    const functioningResponses = filteredResponses.filter(r => r.cuestionarios.codigo.includes('F'));

    // Ordenar por fecha
    problemsResponses.sort((a, b) => new Date(a.fecha_respuesta).getTime() - new Date(b.fecha_respuesta).getTime());
    functioningResponses.sort((a, b) => new Date(a.fecha_respuesta).getTime() - new Date(b.fecha_respuesta).getTime());

    const labels = Array.from(new Set([
      ...problemsResponses.map(r => new Date(r.fecha_respuesta).toLocaleDateString('es-ES')),
      ...functioningResponses.map(r => new Date(r.fecha_respuesta).toLocaleDateString('es-ES'))
    ])).sort();

    const problemsData = labels.map(label => {
      const response = problemsResponses.find(r => 
        new Date(r.fecha_respuesta).toLocaleDateString('es-ES') === label
      );
      return response ? response.puntuacion : null;
    });

    const functioningData = labels.map(label => {
      const response = functioningResponses.find(r => 
        new Date(r.fecha_respuesta).toLocaleDateString('es-ES') === label
      );
      return response ? response.puntuacion : null;
    });

    setChartData({
      labels,
      datasets: [
        {
          label: 'Severidad de Problemas',
          data: problemsData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1,
          spanGaps: true,
        },
        {
          label: 'Nivel de Funcionamiento',
          data: functioningData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.1,
          spanGaps: true,
        },
      ],
    });
  };

  // Generar gráfico de barras para subdominios
  const generateSubdomainChart = () => {
    const filteredResponses = getFilteredResponses();
    
    if (filteredResponses.length === 0) {
      setChartData(null);
      return;
    }

    // Usar la respuesta más reciente para mostrar subdominios
    const latestResponse = filteredResponses.reduce((latest, current) => 
      new Date(current.fecha_respuesta) > new Date(latest.fecha_respuesta) ? current : latest
    );

    const codigo = latestResponse.cuestionarios.codigo;
    const meta = questionnairesMeta[codigo];

    if (!meta || !meta.subescalas) {
      setChartData(null);
      return;
    }

    // Calcular puntuaciones de subdominios
    const subdomainScores = meta.subescalas.map((subescala: any) => {
      const items = subescala.items;
      const sum = items.reduce((total: number, itemIndex: number) => {
        const responseValue = latestResponse.respuestas[itemIndex - 1] || 0;
        return total + responseValue;
      }, 0);
      
      return {
        name: subescala.nombre,
        score: sum,
        maxScore: items.length * (codigo.includes('PS') ? 5 : 4),
        percentage: (sum / (items.length * (codigo.includes('PS') ? 5 : 4))) * 100
      };
    });

    const labels = subdomainScores.map((s: any) => s.name);
    const data = selectedSubdomain === 'percentage' 
      ? subdomainScores.map((s: any) => s.percentage)
      : subdomainScores.map((s: any) => s.score);

    setChartData({
      labels,
      datasets: [
        {
          label: selectedSubdomain === 'percentage' ? 'Porcentaje' : 'Puntuación',
          data,
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(147, 51, 234, 0.8)',
            'rgba(236, 72, 153, 0.8)',
          ],
          borderColor: [
            'rgb(239, 68, 68)',
            'rgb(245, 158, 11)',
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
            'rgb(147, 51, 234)',
            'rgb(236, 72, 153)',
          ],
          borderWidth: 1,
        },
      ],
    });
  };

  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: viewType === 'combined' 
          ? 'Evolución Ohio Youth Scales' 
          : 'Subdominios - Evaluación Más Reciente',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (viewType === 'subdomains' && selectedSubdomain === 'percentage') {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
            }
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: viewType === 'combined' ? {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Puntuación'
        }
      }
    } : {
      y: {
        beginAtZero: true,
        max: selectedSubdomain === 'percentage' ? 100 : undefined,
        title: {
          display: true,
          text: selectedSubdomain === 'percentage' ? 'Porcentaje (%)' : 'Puntuación'
        }
      }
    },
  };

  if (!chartData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500 text-center">No hay datos disponibles para mostrar</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Controles */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vista
          </label>
          <select
            value={viewType}
            onChange={(e) => {
              // Esta prop debería ser manejada por el componente padre
            }}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            disabled
          >
            <option value="combined">Evolución Combinada</option>
            <option value="subdomains">Subdominios</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Informante
          </label>
          <select
            value={informant}
            onChange={(e) => {
              // Esta prop debería ser manejada por el componente padre
            }}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            disabled
          >
            <option value="both">Ambos</option>
            <option value="parent">Padre/Tutor</option>
            <option value="youth">Joven</option>
          </select>
        </div>

        {viewType === 'subdomains' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Métrica
            </label>
            <select
              value={selectedSubdomain}
              onChange={(e) => setSelectedSubdomain(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="score">Puntuación</option>
              <option value="percentage">Porcentaje</option>
            </select>
          </div>
        )}
      </div>

      {/* Gráfico */}
      <div className="h-96">
        {viewType === 'combined' ? (
          <Line data={chartData} options={chartOptions as ChartOptions<'line'>} />
        ) : (
          <Bar data={chartData} options={chartOptions as ChartOptions<'bar'>} />
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-4 text-sm text-gray-600">
        {viewType === 'combined' ? (
          <p>
            <strong>Interpretación:</strong> Valores más altos en Severidad de Problemas indican mayor problemática. 
            Valores más altos en Funcionamiento indican mejor desempeño.
          </p>
        ) : (
          <p>
            <strong>Subdominios:</strong> Análisis detallado de las diferentes áreas evaluadas en la medición más reciente.
          </p>
        )}
      </div>
    </div>
  );
}
