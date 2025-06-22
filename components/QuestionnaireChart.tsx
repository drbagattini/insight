"use client";

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import React from "react";

// Register the pieces we may need. Doing this once here avoids duplicate registration warnings.
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export interface EvolutionPoint {
  puntuacion: number;
  creado_en: string; // ISO date
}

export interface QuestionnaireChartProps {
  data: EvolutionPoint[];
  meta: {
    chartType?: "line" | "bar" | string;
    nombre?: string;
    scoring?: {
      rango?: readonly [number, number];
      puntosDeCorte?: readonly { readonly umbral: number; readonly label?: string }[];
    };
  };
  /** Optional override for height (in Tailwind / CSS units) */
  className?: string;
}

/**
 * Generic chart component that renders questionnaire evolution based on meta.chartType.
 * Currently supports "line" (default) and "bar".
 */
const QuestionnaireChart: React.FC<QuestionnaireChartProps> = ({ data, meta, className }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">Sin datos suficientes para mostrar el gráfico.</div>;
  }

  const labels = data.map((d) => new Date(d.creado_en).toLocaleDateString());

  // Base dataset for the questionnaire scores
  const primaryDataset = {
    label: meta.nombre || "Puntuación",
    data: data.map((d) => d.puntuacion),
    borderColor: "rgb(59, 130, 246)",
    backgroundColor: "rgba(59, 130, 246,0.5)",
    fill: false,
    tension: 0.3,
  } as const;

  // Threshold datasets (e.g., puntosDeCorte) rendered as horizontal dashed lines
  const thresholdDatasets = (meta.scoring?.puntosDeCorte || []).map((p) => ({
    label: p.label ?? `Umbral ${p.umbral}`,
    data: labels.map(() => p.umbral),
    borderColor: "red",
    borderWidth: 1,
    borderDash: [5, 5],
    pointRadius: 0,
    fill: false,
    order: 0 as const,
  }));

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
          filter: (item: any) => item.text !== "",
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
