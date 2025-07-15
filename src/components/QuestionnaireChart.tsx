"use client";

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import React from "react";
import questionnairesMeta, { QuestionnaireCode } from "@/src/data/questionnairesMeta";


// Register the pieces we may need. Doing this once here avoids duplicate registration warnings.
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// Allow a flexible, nested structure for detailed scores.
// This is intentionally 'any' to support various questionnaire formats without
// breaking the component when a new scoring structure is introduced.
export interface EvolutionPoint {
  puntuacion: number;
  creado_en: string; // ISO date
  score_detallado?: any;
}

export interface QuestionnaireChartProps {
  data: EvolutionPoint[];
  codigo: QuestionnaireCode; // Use questionnaire code to get metadata
  /** Optional override for height (in Tailwind / CSS units) */
  className?: string;
}

/**
 * Generic chart component that renders questionnaire evolution based on questionnairesMeta[codigo].chartType.
 * Currently supports "line" (default), "bar", and "bar-multidim" (for multi-dimensional questionnaires like OPD-CA2-SQ).
 */
const LABELS = {
  total: 'Puntuación Total',
  control: 'Control y Regulación',
  identity: 'Identidad',
  interpersonality: 'Interpersonalidad',
  attachment: 'Apego',
  ctr_self_perception: 'Percepción de sí mismo',
  ctr_object_perception: 'Percepción de objeto',
  ctr_self_regulation: 'Autorregulación',
  ctr_regulation_of_relationship: 'Regulación de la relación',
  id_self_reflection: 'Autorreflexión',
  id_affect_differentiation: 'Diferenciación de afectos',
  id_identity: 'Identidad',
  id_body_self: 'Cuerpo y autoimagen',
  int_empathy: 'Empatía',
  int_communication: 'Comunicación',
  int_affect_experience: 'Experiencia afectiva',
  int_object_experience: 'Experiencia de objeto',
  att_internalization: 'Internalización',
  att_separation_ability: 'Capacidad de separación',
  att_variable_attachment_patterns: 'Patrones de apego variables',
  // Subdimensiones adicionales que podrían faltar pero se incluyen por completitud
  ctr_impulse_control: 'Control de impulsos',
  id_affect_tolerance: 'Tolerancia a los afectos',
  int_relationship_building: 'Construcción de relaciones',
  att_secure_base: 'Base segura',
} as const;

const midBandPlugin = {
  id: 'midBand',
  beforeDatasetsDraw(chart: any) {
    const { ctx, chartArea: { top, bottom, left, right }, scales: { y } } = chart;
    ctx.save();

    // The band for T-Scores between 40 and 60 is considered the "healthy average" range.
    const yStart = y.getPixelForValue(60);
    const yEnd = y.getPixelForValue(40);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'; // A light grey band
    ctx.fillRect(left, yStart, right - left, yEnd - yStart);

    ctx.restore();
  }
};

export const QuestionnaireChart: React.FC<QuestionnaireChartProps> = ({ data, codigo, className }) => {

  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">Sin datos suficientes para mostrar el gráfico.</div>;
  }

  const meta = questionnairesMeta[codigo];
  if (!meta) {
    return <div className="text-center text-red-500 py-8">Cuestionario {codigo} no encontrado en metadatos.</div>;
  }

  // Special handling for bar-multidim chart type (e.g. OPD-CA2-SQ):
  if (meta.chartType === 'bar-multidim') {
    const latestData = data[data.length - 1];

    if (!latestData || !latestData.score_detallado) {
      return <div className="text-center text-red-500 py-8">Datos detallados no disponibles para {meta.title}.</div>;
    }

    const { score_detallado } = latestData;

    const dimensionKeys = ['control', 'identity', 'interpersonality', 'attachment'];
    const hasValidData = dimensionKeys.some(key => score_detallado[key] !== null && score_detallado[key] !== undefined);

    if (!hasValidData) {
        return <div className="text-center text-yellow-500 py-8">Este paciente aún no tiene resultados válidos para {meta.title}.</div>;
    }

    const dimensionColors = {
      control: 'rgba(59, 130, 246, 0.85)',
      identity: 'rgba(34, 197, 94, 0.85)',
      interpersonality: 'rgba(249, 115, 22, 0.85)',
      attachment: 'rgba(234, 179, 8, 0.85)',
    } as const;

    const borderColors = {
      control: 'rgb(30, 64, 175)',
      identity: 'rgb(22, 101, 52)',
      interpersonality: 'rgb(154, 52, 18)',
      attachment: 'rgb(161, 98, 7)',
    } as const;

    const chartLabels = score_detallado.dimensionLabels || dimensionKeys.map(k => LABELS[k as keyof typeof LABELS] || k);
    const chartValues = dimensionKeys.map(key => score_detallado[key]);

    const multidimData = {
      labels: chartLabels,
      datasets: [
        {
          label: 'T-Score por Dimensión',
          data: chartValues,
          backgroundColor: dimensionKeys.map(key => dimensionColors[key as keyof typeof dimensionColors]),
          borderColor: dimensionKeys.map(key => borderColors[key as keyof typeof borderColors]),
          borderWidth: 2,
          barPercentage: 0.6,
          categoryPercentage: 0.9,
        },
      ],
    };

    const multidimOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          min: 20,
          max: 80,
          title: {
            display: true,
            text: 'T-Score',
            font: { size: 14, weight: 'bold' },
          },
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
        },
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 30,
            font: { size: 11, weight: '500' },
            color: '#374151',
          },
          grid: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `Perfil de Estructura Psíquica - ${new Date(latestData.creado_en).toLocaleDateString()}`,
          font: { size: 16, weight: 'bold' },
          padding: { top: 10, bottom: 20 },
        },
        tooltip: {
          callbacks: {
            title: (context: any) => context[0].label,
            label: (context: any) => `T-Score: ${context.parsed.y}`,
          },
        },
      },
    };

    return (
      <div className={`relative w-full ${className ?? "h-[600px]"}`}>
        <Bar data={multidimData} options={multidimOptions as any} plugins={[midBandPlugin]} />
      </div>
    );
  }

  // Default chart rendering for line and simple bar charts
  const labels = data.map((d) => new Date(d.creado_en).toLocaleDateString());

  const primaryDataset = {
    label: meta.title || "Puntuación",
    data: data.map((d) => d.puntuacion),
    borderColor: "rgb(59, 130, 246)",
    backgroundColor: "rgba(59, 130, 246,0.5)",
    fill: false,
    tension: 0.3,
  };

  const thresholdDatasets = [];
  if (meta.thresholds?.warning !== undefined) {
    thresholdDatasets.push({
      label: `Umbral de alerta (${meta.thresholds.warning})`,
      data: labels.map(() => meta.thresholds!.warning!),
      borderColor: "red",
      backgroundColor: "transparent",
      borderWidth: 1,
      borderDash: [5, 5],
      pointRadius: 0,
      fill: false,
    });
  }
  if (meta.thresholds?.danger !== undefined) {
    thresholdDatasets.push({
      label: `Umbral de peligro (${meta.thresholds.danger})`,
      data: labels.map(() => meta.thresholds!.danger!),
      borderColor: "darkred",
      backgroundColor: "transparent",
      borderWidth: 2,
      borderDash: [3, 3],
      pointRadius: 0,
      fill: false,
    });
  }

  const chartData = {
    labels,
    datasets: [primaryDataset, ...thresholdDatasets],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const, labels: { filter: (item: { text: string }) => !!item.text } },
      title: { display: true, text: meta.title || "Evolución" },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: meta.scoring?.rango ? meta.scoring.rango[0] : undefined,
        max: meta.scoring?.rango ? meta.scoring.rango[1] : undefined,
      },
    },
  };

  return (
    <div className={`relative w-full ${className ?? "h-96"}`}>
      <Line data={chartData} options={commonOptions} />
    </div>
  );
};

export default QuestionnaireChart;


