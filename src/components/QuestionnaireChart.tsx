"use client";

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import React from "react";
import questionnairesMeta, { QuestionnaireCode } from "@/src/data/questionnairesMeta";

// Register the pieces we may need. Doing this once here avoids duplicate registration warnings.
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export interface EvolutionPoint {
  puntuacion: number;
  creado_en: string; // ISO date
  score_detallado?: {
    total: number | null;
    control?: number | null;
    identity?: number | null;
    interpersonality?: number | null;
    attachment?: number | null;
    dimensionLabels?: string[];
  };
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
const QuestionnaireChart: React.FC<QuestionnaireChartProps> = ({ data, codigo, className }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">Sin datos suficientes para mostrar el gráfico.</div>;
  }

  const meta = questionnairesMeta[codigo];
  if (!meta) {
    return <div className="text-center text-red-500 py-8">Cuestionario {codigo} no encontrado en metadatos.</div>;
  }

  const labels = data.map((d) => new Date(d.creado_en).toLocaleDateString());

  // Base dataset for the questionnaire scores
  const primaryDataset = {
    label: meta.title || "Puntuación",
    data: data.map((d) => d.puntuacion),
    borderColor: "rgb(59, 130, 246)",
    backgroundColor: "rgba(59, 130, 246,0.5)",
    fill: false,
    tension: 0.3,
  } as const;

  // Threshold datasets (e.g., warning thresholds) rendered as horizontal dashed lines
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
      order: 0 as const,
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
      order: 0 as const,
    });
  }

  const commonOptions = {
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: meta.scoring?.rango ? meta.scoring.rango[1] : undefined,
      },
    },
    plugins: {
      legend: {
        labels: {
          // Hide empty labels (mostly for threshold datasets without explicit label)
          filter: (item: { text: string }) => item.text !== "",
        },
      },
    },
  } as const;

  const datasets = [primaryDataset, ...thresholdDatasets];

  const chartData = {
    labels,
    datasets,
  } as const;

  const type = (meta.chartType ?? "line").toLowerCase();

  // Handle multi-dimensional bar chart (e.g., OPD-CA2-SQ)
  if (type === "bar-multidim") {
    // Use the latest data point for multi-dimensional display
    const latestData = data[data.length - 1];
    if (!latestData?.score_detallado) {
      return <div className="text-center text-gray-500 py-8">Sin datos de dimensiones disponibles.</div>;
    }

    const scoreData = latestData.score_detallado;
    const dimensionLabels = scoreData.dimensionLabels || ['Control', 'Identidad', 'Interpersonalidad', 'Apego'];
    const dimensionValues = [
      scoreData.control || 0,
      scoreData.identity || 0,
      scoreData.interpersonality || 0,
      scoreData.attachment || 0
    ];

    const multidimData = {
      labels: dimensionLabels,
      datasets: [
        {
          label: 'T-Score por Dimensión',
          data: dimensionValues,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',   // Azul - Regulación
            'rgba(16, 185, 129, 0.8)',   // Verde - Identidad
            'rgba(245, 158, 11, 0.8)',   // Amarillo - Interpersonalidad
            'rgba(239, 68, 68, 0.8)'     // Rojo - Apego
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)'
          ],
          borderWidth: 2
        }
      ]
    };

    const multidimOptions = {
      ...commonOptions,
      scales: {
        y: {
          beginAtZero: true,
          min: 20,
          max: 80,
          title: {
            display: true,
            text: 'T-Score'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Dimensiones OPD-CA2-SQ'
          }
        }
      },
      plugins: {
        ...commonOptions.plugins,
        title: {
          display: true,
          text: `Perfil de Dimensiones - ${new Date(latestData.creado_en).toLocaleDateString()}`
        }
      }
    };

    return (
      <div className={`relative w-full ${className ?? "h-96"}`}>
        <Bar data={multidimData} options={multidimOptions} />
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className ?? "h-96"}`}>
      {type === "bar" ? (
        <Bar data={chartData} options={commonOptions} />
      ) : (
        <Line data={chartData} options={commonOptions} />
      )}
    </div>
  );
};

export default QuestionnaireChart;
