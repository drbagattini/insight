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
  /** Optional override for the chart title (e.g., to include a date range) */
  titleOverride?: string;
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
  // Subdimensiones Control
  ctr_impulse: 'Impulsos',
  ctr_affect: 'Afecto',
  ctr_consc: 'Consciencia',
  ctr_selfworth: 'Autoestima',
  // Subdimensiones Identity
  id_coherence: 'Coherencia',
  id_selfexp: 'Expresión del Self',
  id_sodiff: 'Autodiferenciación',
  id_objectexp: 'Exp. de objeto',
  id_belong: 'Pertenencia',
  // Subdimensiones Interpersonality
  int_fantasies: 'Fantasías',
  int_emotcontact: 'Contacto Emocional',
  int_reciprocity: 'Reciprocidad',
  int_affectexp: 'Expresión Afectiva',
  int_empathy: 'Empatía',
  int_ability_detach: 'Desapego',
  // Subdimensiones Attachment
  att_representation: 'Representación',
  att_internalbasis: 'Base Interna',
  att_capacity_alone: 'Capacidad Soledad',
  att_use_relations: 'Uso Relacional',
} as const;

const midBandPlugin = {
  id: 'midBand',
  beforeDatasetsDraw(chart: any) {
    const { ctx, chartArea: { top, bottom, left, right }, scales } = chart;
    const isHorizontal = chart.options.indexAxis === 'y';
    const valueScale = isHorizontal ? scales.x : scales.y;

    ctx.save();

    // The band for T-Scores between 40 and 60 is considered the "healthy average" range.
    const bandStartPixel = valueScale.getPixelForValue(60);
    const bandEndPixel = valueScale.getPixelForValue(40);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)'; // Lighter grey band (less intrusive)

    if (isHorizontal) {
      // For horizontal bar chart, the band is a vertical rectangle.
      ctx.fillRect(bandEndPixel, top, bandStartPixel - bandEndPixel, bottom - top);
    } else {
      // For vertical line/bar chart, the band is a horizontal rectangle.
      ctx.fillRect(left, bandStartPixel, right - left, bandEndPixel - bandStartPixel);
    }

    ctx.restore();
  }
};

export const QuestionnaireChart: React.FC<QuestionnaireChartProps> = ({ data, codigo, className, titleOverride }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">Sin datos suficientes para mostrar el gráfico.</div>;
  }

  const meta = questionnairesMeta[codigo];
  if (!meta) {
    return <div className="text-center text-red-500 py-8">Cuestionario {codigo} no encontrado en metadatos.</div>;
  }

  if (meta.chartType === 'bar-multidim') {
    // Elegir el último punto con puntajes válidos
    const findLatestValid = () => {
      for (let i = data.length - 1; i >= 0; i--) {
        const d = data[i];
        if (!d || !d.score_detallado) continue;
        const sd = d.score_detallado;
        // Revisa al menos que TOTAL sea número válido o cualquier subdimension
        if (sd && (typeof sd.total === 'number' || (sd.total && typeof sd.total.tScore === 'number'))) {
          return d;
        }
        if (sd.subDimensions) {
          const anyValid = Object.values(sd.subDimensions).some((v: any) => typeof v === 'number' || (v && typeof v.tScore === 'number'));
          if (anyValid) return d;
        }
      }
      return null;
    };

    const latestData = findLatestValid();
    if (!latestData) {
      return <div className="text-center text-red-500 py-8">No se encontraron puntajes válidos para {meta.title}.</div>;
    }

    const { score_detallado } = latestData;

    const orderedKeys = [
      'total',
      'control', 'ctr_impulse', 'ctr_affect', 'ctr_consc', 'ctr_selfworth',
      'identity', 'id_coherence', 'id_selfexp', 'id_sodiff', 'id_objectexp', 'id_belong',
      'interpersonality', 'int_fantasies', 'int_emotcontact', 'int_reciprocity', 'int_affectexp', 'int_empathy', 'int_ability_detach',
      'attachment', 'att_representation', 'att_internalbasis', 'att_capacity_alone', 'att_use_relations'
    ];

    // Helper to obtain numeric T-score from diverse shapes
    const extractScore = (key: string): number | null => {
      // 1) Subdimension key in nested subDimensions object
      if (score_detallado.subDimensions && key in score_detallado.subDimensions) {
        const v = score_detallado.subDimensions[key];
        if (typeof v === 'number') return v;
        if (v && typeof v === 'object' && 'tScore' in v) return v.tScore as number;
      }
      // 2) Main dimension or total directly on root
      if (key in score_detallado) {
        const v = (score_detallado as any)[key];
        if (typeof v === 'number') return v;
        if (v && typeof v === 'object' && 'tScore' in v) return v.tScore as number;
      }
      // 3) Main dimension inside dimensions object
      if (score_detallado.dimensions && key in score_detallado.dimensions) {
        const v = score_detallado.dimensions[key];
        if (typeof v === 'number') return v;
        if (v && typeof v === 'object' && 'tScore' in v) return v.tScore as number;
      }
      return null;
    };

    const validKeys = orderedKeys.filter(k => extractScore(k) !== null);

    const chartLabels = validKeys.map(k => LABELS[k as keyof typeof LABELS] || k);
    const chartValues = validKeys.map(k => extractScore(k) as number);

    const baseColors = {
      total: 'rgb(107, 114, 128)',
      control: 'rgb(59, 130, 246)',
      identity: 'rgb(16, 185, 129)',
      interpersonality: 'rgb(245, 158, 11)',
      attachment: 'rgb(239, 68, 68)',
    };

    const getBaseKey = (k: string): string => {
      if (k.startsWith('ctr_')) return 'control';
      if (k.startsWith('id_')) return 'identity';
      if (k.startsWith('int_')) return 'interpersonality';
      if (k.startsWith('att_')) return 'attachment';
      return k;
    };

    const bgColors = validKeys.map(k => {
      const baseKey = getBaseKey(k);
      const color = (baseColors as any)[baseKey] || baseColors.total;
      return k === baseKey || k === 'total' ? color : color.replace(')', ', 0.6)').replace('rgb', 'rgba');
    });

    const multidimData = {
      labels: chartLabels,
      datasets: [{
        label: 'T-Score',
        data: chartValues,
        backgroundColor: bgColors,
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      }],
    };

    const multidimOptions = {
      responsive: true,
      maintainAspectRatio: false,
      // Vertical bar chart (categorías en eje X, valores T-score en eje Y)
      scales: {
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 30,
            font: (ctx: any) => {
              const label = ctx.tick.label as string;
              const isMain = ['Puntuación Total', 'Control y Regulación', 'Identidad', 'Interpersonalidad', 'Apego'].includes(label);
              return { weight: isMain ? 'bold' : 'normal' };
            },
          },
          grid: { display: false },
        },
        y: {
          beginAtZero: false,
          min: 20,
          max: 80,
          title: { display: true, text: 'T-Score' },
        },
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: titleOverride ?? meta.title ?? 'Perfil de Estructura Psíquica',
          font: { size: 16, weight: 'bold' as const },
          padding: { top: 10, bottom: 20 },
        },
        tooltip: {
          callbacks: {
            title: (ctx: any) => ctx[0].label,
            label: (ctx: any) => `T-Score: ${ctx.parsed.y}`,
            afterLabel: (ctx: any) => {
              const key = validKeys[ctx.dataIndex];
              const description = (meta.scoring as any)?.dimensionDescriptions?.[key];
              return description || '';
            }
          },
        },
      },
    };

    return (
      <div className={`relative w-full ${className ?? "h-[28rem]"}`}>
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

  const chartData = {
    labels,
    datasets: [primaryDataset],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: titleOverride ?? meta.title ?? "Evolución" },
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
      <Line data={chartData} options={commonOptions} plugins={[midBandPlugin]} />
    </div>
  );
};

export default QuestionnaireChart;

