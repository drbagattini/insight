'use client';

import { useState, useEffect } from 'react';
import { Line, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Plugin personalizado para texto de interpretación
const interpretationTextPlugin = {
  id: 'interpretationText',
  afterDraw: (chart: any) => {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    
    if (!chartArea) return;
    
    // Configurar el texto
    ctx.save();
    ctx.font = 'italic 13px Arial';
    ctx.fillStyle = '#4B5563';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Texto de interpretación
    const text1 = 'Valores más altos en Severidad de Problemas indican mayor problemática.';
    const text2 = 'Valores más altos en Funcionamiento indican mejor desempeño.';
    
    // Posición: debajo de la leyenda, arriba de la línea del 100
    const x = chartArea.left + (chartArea.right - chartArea.left) / 2;
    const y = chartArea.top + 25; // 25px dentro del área del gráfico
    
    // Dibujar las líneas de texto
    ctx.fillText(text1, x, y);
    ctx.fillText(text2, x, y + 15);
    
    ctx.restore();
  }
};

interface OYSConsolidatedData {
  id: string;
  fecha: string;
  codigo_cuestionario: string;
  score_detallado: {
    problem_severity: {
      total: number;
      valido: boolean;
      respuestas: (number | null)[];
    };
    functioning: {
      total: number;
      valido: boolean;
      respuestas: (number | null)[];
    };
    flags: {
      consumo?: boolean;
      autolesion?: boolean;
      muerte?: boolean;
      tdah?: boolean;
    };
    informante: 'padre_tutor' | 'paciente';
  };
}

interface OhioYouthScalesChartProps {
  data: OYSConsolidatedData[];
  viewType: 'evolution' | 'scatter';
  className?: string;
}

export default function OhioYouthScalesChart({ 
  data, 
  viewType = 'evolution',
  className = "h-96"
}: OhioYouthScalesChartProps) {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    console.log('OhioYouthScalesChart - Datos recibidos:', data);
    console.log('OhioYouthScalesChart - Cantidad de datos:', data?.length);
    if (data && data.length > 0) {
      console.log('OhioYouthScalesChart - Primer elemento:', JSON.stringify(data[0], null, 2));
      if (viewType === 'evolution') {
        generateEvolutionChart();
      } else {
        generateScatterChart();
      }
    } else {
      console.log('OhioYouthScalesChart - No hay datos o array vacío');
      setChartData(null);
    }
  }, [data, viewType]);

  // Generar gráfico de evolución temporal (líneas)
  const generateEvolutionChart = () => {
    // Ordenar por fecha
    const sortedData = [...data].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
    const labels = sortedData.map(d => new Date(d.fecha).toLocaleDateString('es-ES'));
    
    const problemSeverityData = sortedData.map(d => 
      d.score_detallado?.problem_severity?.valido ? d.score_detallado.problem_severity.total : null
    );
    
    const functioningData = sortedData.map(d => 
      d.score_detallado?.functioning?.valido ? d.score_detallado.functioning.total : null
    );

    setChartData({
      labels,
      datasets: [
        {
          label: 'Severidad de Problemas (0-100)',
          data: problemSeverityData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3,
          spanGaps: true,
          pointRadius: 5,
          pointHoverRadius: 7,
          yAxisID: 'y',
        },
        {
          label: 'Funcionamiento (0-80)',
          data: functioningData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3,
          spanGaps: true,
          pointRadius: 5,
          pointHoverRadius: 7,
          yAxisID: 'y1',
        },
      ],
    });
  };

  // Generar gráfico de dispersión (PS vs F)
  const generateScatterChart = () => {
    const validData = data.filter(d => 
      d.score_detallado?.problem_severity?.valido && d.score_detallado?.functioning?.valido
    );

    const scatterData = validData.map(d => ({
      x: d.score_detallado.problem_severity.total,
      y: d.score_detallado.functioning.total,
      fecha: new Date(d.fecha).toLocaleDateString('es-ES'),
      flags: d.score_detallado.flags,
      informante: d.score_detallado.informante
    }));

    setChartData({
      datasets: [
        {
          label: 'Evaluaciones OYS',
          data: scatterData,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgb(59, 130, 246)',
          pointRadius: 8,
          pointHoverRadius: 10,
        },
      ],
    });
  };

  const evolutionOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolución Ohio Youth Scales',
        font: { size: 16, weight: 'bold' }
      },
      subtitle: {
        display: true,
        text: ['Valores más altos en Severidad de Problemas indican mayor problemática.', 'Valores más altos en Funcionamiento indican mejor desempeño.'],
        font: { size: 12, style: 'italic' },
        color: '#6B7280',
        padding: { bottom: 20 }
      },
      tooltip: {
        enabled: false
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        max: 100,
        title: {
          display: false
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        max: 80,
        title: {
          display: false
        },
        grid: {
          drawOnChartArea: false,
          color: 'rgba(156, 163, 175, 0.2)'
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    }
  };

  const scatterOptions: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Relación Problemas vs Funcionamiento',
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            const point = context[0].raw as any;
            return `Fecha: ${point.fecha}`;
          },
          label: function(context) {
            const point = context.raw as any;
            return [
              `Severidad de Problemas: ${point.x}`,
              `Funcionamiento: ${point.y}`,
              `Informante: ${point.informante === 'padre_tutor' ? 'Padre/Tutor' : 'Paciente'}`
            ];
          },
          afterLabel: function(context) {
            const point = context.raw as any;
            const flags = point.flags;
            const warnings = [];
            
            if (flags.consumo) warnings.push('⚠️ Consumo de sustancias');
            if (flags.autolesion) warnings.push('⚠️ Riesgo de autolesión');
            if (flags.muerte) warnings.push('⚠️ Ideación suicida');
            if (flags.tdah) warnings.push('⚠️ Indicadores TDAH');
            
            return warnings;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Severidad de Problemas'
        },
        min: 0,
        max: 100
      },
      y: {
        title: {
          display: true,
          text: 'Funcionamiento'
        },
        min: 0,
        max: 80
      }
    }
  };

  if (!chartData) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
        <p className="text-gray-500 text-center">No hay datos disponibles para mostrar el gráfico OYS</p>
      </div>
    );
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className} relative`}>
      {/* Gráfico */}
      <div className="h-full">
        {viewType === 'evolution' ? (
          <Line data={chartData} options={evolutionOptions} />
        ) : (
          <Scatter data={chartData} options={scatterOptions} />
        )}
      </div>

      {viewType === 'scatter' && (
        <div className="mt-3 text-xs text-gray-600 text-center">
          <span className="italic">
            Los puntos en la esquina inferior izquierda indican mejor estado general.
          </span>
        </div>
      )}
    </div>
  );
}
