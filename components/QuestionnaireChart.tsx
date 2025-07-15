"use client";

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import React from "react";

// Register the pieces we may need. Doing this once here avoids duplicate registration warnings.
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export interface EvolutionPoint {
  puntuacion: number;
  creado_en: string; // ISO date
  /** Resultado detallado opcional para cuestionarios multidimensionales (por ejemplo, OPD-CA2-SQ) */
  score_detallado?: Record<string, any>;
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

  // --- Manejo de cuestionarios multidimensionales (p.ej. OPD-CA2-SQ) ---
  const latest = data[data.length - 1] as any;
  if (latest?.score_detallado?.subDimensions) {
    const { score_detallado } = latest;
    const sub = score_detallado.subDimensions || {};

    // Orden clínico de visualización (total → dimensiones → subdimensiones)
    const orderedKeys = [
      'total',
      'control', 'ctr_impulse', 'ctr_affect', 'ctr_consc', 'ctr_selfworth',
      'identity', 'id_coherence', 'id_selfexp', 'id_sodiff', 'id_objectexp', 'id_belong',
      'interpersonality', 'int_fantasies', 'int_emotcontact', 'int_reciprocity', 'int_affectexp', 'int_empathy', 'int_ability_detach',
      'attachment', 'att_representation', 'att_internalbasis', 'att_capacity_alone', 'att_use_relations',
    ] as const;

    // Etiquetas clínicas oficiales
    const LABELS: Record<string, string> = {
      total: 'Estructura (total)',

      control: '1. Control (total)',
      ctr_impulse: '1.1 Control de impulsos',
      ctr_affect: '1.2 Tolerancia afectiva',
      ctr_consc: '1.3 Formación de conciencia',
      ctr_selfworth: '1.4 Autovaloración',

      identity: '2. Identidad (total)',
      id_coherence: '2.1 Coherencia',
      id_selfexp: '2.2 Percepción del sí mismo',
      id_sodiff: '2.3 Diferenciación self-objeto',
      id_objectexp: '2.4 Percepción del objeto',
      id_belong: '2.5 Pertenencia',

      interpersonality: '3. Interpersonalidad (total)',
      int_fantasies: '3.1 Fantasías',
      int_emotcontact: '3.2 Contacto emocional',
      int_reciprocity: '3.3 Reciprocidad',
      int_affectexp: '3.4 Percepción de afectos',
      int_empathy: '3.5 Empatía',
      int_ability_detach: '3.6 Capacidad para separarse',

      attachment: '4. Apego (total)',
      att_representation: '4.1 Acceso a representaciones de apego',
      att_internalbasis: '4.2 Base segura interna',
      att_capacity_alone: '4.3 Capacidad para estar solo',
      att_use_relations: '4.4 Uso de relaciones de apego',
    };

    // Colores base por dimensión
    const baseColors: Record<string, string> = {
      control: 'rgb(37, 99, 235)',
      identity: 'rgb(22, 101, 52)',
      interpersonality: 'rgb(154, 52, 18)',
      attachment: 'rgb(161, 98, 7)',
      total: 'rgb(55, 65, 81)',
    };

    const bgColors: string[] = [];
    const values: number[] = [];
    const displayLabels: string[] = [];

    orderedKeys.forEach((k) => {
      const val = k === 'total'
        ? score_detallado.total
        : (k === 'control' || k === 'identity' || k === 'interpersonality' || k === 'attachment')
          ? score_detallado[k]
          : sub[k];

      if (val !== null && val !== undefined) {
        values.push(val as number);
        displayLabels.push(LABELS[k] ?? k);

        const dim = (() => {
          if (k === 'total') return 'total';
          if (k.startsWith('ctr_') || k === 'control') return 'control';
          if (k.startsWith('id_') || k === 'identity') return 'identity';
          if (k.startsWith('int_') || k === 'interpersonality') return 'interpersonality';
          if (k.startsWith('att_') || k === 'attachment') return 'attachment';
          return 'total';
        })();

        const isMain = ['total', 'control', 'identity', 'interpersonality', 'attachment'].includes(k);
        const alpha = isMain ? 0.85 : 0.45;
        const rgb = baseColors[dim];
        bgColors.push(rgb.replace('rgb', 'rgba').replace(')', `, ${alpha})`));
      }
    });

    const barData = {
      labels: displayLabels,
      datasets: [
        {
          label: 'T-Score',
          data: values,
          backgroundColor: bgColors,
          borderColor: bgColors.map(c => c.replace(/, [\d.]+\)$/, ', 1)')),
          borderWidth: 1,
        },
      ],
    } as const;

    // Plugin para banda saludable 40-60
    const midBandPlugin = {
      id: 'midBand',
      beforeDatasetsDraw(chart: any) {
        const { ctx, chartArea: { top, bottom, left, right }, scales: { y } } = chart;
        ctx.save();
        const yStart = y.getPixelForValue(60);
        const yEnd = y.getPixelForValue(40);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(left, yStart, right - left, yEnd - yStart);
        ctx.restore();
      },
    };

    const barOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: false, min: 20, max: 80, title: { display: true, text: 'T-Score' } },
        x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 30, font: { size: 10 } }, grid: { display: false } },
      },
      plugins: {
        legend: { display: false },
        title: { display: true, text: `Perfil Estructura Psíquica – ${new Date(latest.creado_en).toLocaleDateString()}` },
        tooltip: {
          callbacks: {
            title: (ctx: any) => ctx[0].label,
            label: (ctx: any) => `T-Score: ${ctx.parsed.y}`,
          },
        },
      },
    } as const;

    return (
      <div className={`relative w-full ${className ?? 'h-[620px]'}`}>
        <Bar data={barData} options={barOptions} plugins={[midBandPlugin]} />
      </div>
    );
  }

  // ---- Gráficos genéricos (no multidimensionales) ----
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
