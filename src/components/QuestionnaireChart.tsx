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

    // --- Custom rendering for OPD-CA2-SQ full profile (total + dimensiones + subdimensiones) ---
    if (codigo === 'OPD-CA2-SQ') {
      // Orden clínico exacto
      const orderedKeys = [
        'total',
        // Control
        'control','ctr_impulse','ctr_affect','ctr_consc','ctr_selfworth',
        // Identidad
        'identity','id_coherence','id_selfexp','id_sodiff','id_objectexp','id_belong',
        // Interpersonalidad
        'interpersonality','int_fantasies','int_emotcontact','int_reciprocity','int_affectexp','int_empathy','int_ability_detach',
        // Apego
        'attachment','att_representation','att_internalbasis','att_capacity_alone','att_use_relations',
      ];

      // Etiquetas clínicas oficiales (número + nombre)
      const LABEL_MAP: Record<string,string> = {
        total: 'Estructura (total)',
        control: '1. Control (total)',
        ctr_impulse: '1.1 Control de impulsos',
        ctr_affect: '1.2 Tolerancia afectiva',
        ctr_consc: '1.3 Formación de conciencia',
        ctr_selfworth: '1.4 Autovaloración',
        identity: '2. Identidad (total)',
        id_coherence: '2.1 Coherencia',
        id_selfexp: '2.2 Percepción del self',
        id_sodiff: '2.3 Diferenciación self-objeto',
        id_objectexp: '2.4 Percepción del objeto',
        id_belong: '2.5 Sentido de pertenencia',
        interpersonality: '3. Interpersonalidad (total)',
        int_fantasies: '3.1 Fantasías',
        int_emotcontact: '3.2 Contacto emocional',
        int_reciprocity: '3.3 Reciprocidad',
        int_affectexp: '3.4 Expresión afectiva',
        int_empathy: '3.5 Empatía',
        int_ability_detach: '3.6 Capacidad de distanciarse',
        attachment: '4. Apego (total)',
        att_representation: '4.1 Representación de figuras de apego',
        att_internalbasis: '4.2 Base interna de apego',
        att_capacity_alone: '4.3 Capacidad de estar a solas',
        att_use_relations: '4.4 Uso de relaciones de apego',
      };

      // Paleta base por dimensión
      const BASE_COLORS: Record<string,string> = {
        total: 'rgba(0,0,0,1)',
        control: 'rgba(37, 99, 235, 1)',            // blue-600
        identity: 'rgba(22, 101, 52, 1)',           // green-700
        interpersonality: 'rgba(154, 52, 18, 1)',   // orange-700
        attachment: 'rgba(161, 98, 7, 1)',          // yellow-700
      };

      // Helper para asignar colores de dimensión base
      const getBaseKey = (k: string): string => {
        if (k === 'total') return 'total';
        if (k.startsWith('ctr_') || k === 'control') return 'control';
        if (k.startsWith('id_') || k === 'identity') return 'identity';
        if (k.startsWith('int_') || k === 'interpersonality') return 'interpersonality';
        if (k.startsWith('att_') || k === 'attachment') return 'attachment';
        return 'total';
      };

      const labels: string[] = [];
      const values: number[] = [];
      const bgColors: string[] = [];
      const borderColors: string[] = [];

      // Conjunto para identificar etiquetas que deben ir en negrita (dimensiones generales + total)
      const boldLabelSet = new Set<string>([
        LABEL_MAP['total'],
        LABEL_MAP['control'],
        LABEL_MAP['identity'],
        LABEL_MAP['interpersonality'],
        LABEL_MAP['attachment'],
      ]);

      orderedKeys.forEach((key) => {
        // Buscar valor en score_detallado o en subDimensions
        let val: number | null | undefined = (score_detallado as any)[key];
        if (val === undefined && score_detallado.subDimensions) {
          val = score_detallado.subDimensions[key];
        }
        if (val === null || val === undefined) return; // Skip no data

        labels.push(LABEL_MAP[key] ?? key);
        values.push(val);

        const baseKey = getBaseKey(key);
        const base = BASE_COLORS[baseKey];

        // Opacidad: total 0.85, dimensiones 0.85, subdimensiones 0.35
        let bg = base;
        if (key === 'total') {
          bg = 'rgba(0,0,0,0.85)';
        } else if (['control','identity','interpersonality','attachment'].includes(key)) {
          bg = base.replace(', 1)', ', 0.85)');
        } else {
          bg = base.replace(', 1)', ', 0.35)');
        }
        bgColors.push(bg);
        borderColors.push(base);
      });

      const barData = {
        labels,
        datasets: [{
          label: 'T-Score',
          data: values,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1,
        }],
      } as const;

      const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            min: 20,
            max: 80,
            title: { display: true, text: 'T-Score', font: { size: 14, weight: 'bold' } },
            grid: {
              color: (ctx: any) => (ctx.tick.value === 40 || ctx.tick.value === 60) ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.1)',
            },
          },
          x: {
            ticks: {
              autoSkip: false,
              maxRotation: 65,
              minRotation: 40,
              // Scriptable font to bold main dimensions & total
              font: (ctx: any) => {
                const label = ctx.tick?.label as string;
                return {
                  size: 13, // aumentado a 13 según feedback
                  weight: boldLabelSet.has(label) ? 'bold' as const : 'normal' as const,
                };
              },
            },
            grid: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: `Perfil Estructural Adolescente – ${new Date(latestData.creado_en).toLocaleDateString()}`,
            font: { size: 16, weight: 'bold' },
            padding: { top: 10, bottom: 20 },
          },
          tooltip: {
            callbacks: {
              title: (ctx: any) => ctx[0].label,
              label: (ctx: any) => `T-Score: ${ctx.parsed.y}`,
              afterLabel: (ctx: any) => {
                const score = ctx.parsed.y;
                if (score >= 60) return 'Nivel clínico';
                if (score <= 40) return 'Nivel vulnerable';
                return 'Rango saludable';
              },
            },
          },
        },
      } as const;

      return (
        <div className={`relative w-[80%] mx-auto ${className ?? 'h-[720px]'}`}>
          <Bar data={barData} options={barOptions as any} plugins={[midBandPlugin]} />
        </div>
      );
    }

    const dimensionKeys = ['control', 'identity', 'interpersonality', 'attachment'];

    // Si existen subdimensiones válidas, las usamos para el gráfico
    const subDimensions = score_detallado.subDimensions;
    let subChartElement: React.ReactNode = null;
    if (subDimensions) {
      const subEntries = Object.entries(subDimensions).filter(([, val]) => val !== null && val !== undefined);
      if (subEntries.length > 0) {
        const subLabels = subEntries.map(([key]) => LABELS[key as keyof typeof LABELS] || key);
        const subValues = subEntries.map(([, val]) => val as number);
        const baseColors = {
          control: 'rgb(37, 99, 235)',
          identity: 'rgb(22, 101, 52)',
          interpersonality: 'rgb(154, 52, 18)',
          attachment: 'rgb(161, 98, 7)',
        } as const;

        // Determine color by dimension prefix
        const bgColors = subEntries.map(([key]) => {
          if (key.startsWith('ctr_')) return baseColors.control + '99';
          if (key.startsWith('id_')) return baseColors.identity + '99';
          if (key.startsWith('int_')) return baseColors.interpersonality + '99';
          if (key.startsWith('att_')) return baseColors.attachment + '99';
          return 'rgba(100,100,100,0.6)';
        });
        const borderColors = bgColors.map(c => c.replace('99', ''));

        const subData = {
          labels: subLabels,
          datasets: [
            {
              label: 'T-Score por Subdimensión',
              data: subValues,
              backgroundColor: bgColors,
              borderColor: borderColors,
              borderWidth: 1,
            },
          ],
        };

        const subOptions = {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: false,
              min: 20,
              max: 80,
              title: { display: true, text: 'T-Score', font: { size: 14, weight: 'bold' } },
              grid: { color: 'rgba(0,0,0,0.1)' },
            },
            x: {
              ticks: { autoSkip: false, maxRotation: 45, minRotation: 30, font: { size: 10 } },
              grid: { display: false },
            },
          },
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: `Perfil Subdimensiones - ${new Date(latestData.creado_en).toLocaleDateString()}`,
              font: { size: 16, weight: 'bold' },
              padding: { top: 10, bottom: 20 },
            },
            tooltip: {
              callbacks: {
                title: (ctx: any) => ctx[0].label,
                label: (ctx: any) => `T-Score: ${ctx.parsed.y}`,
              },
            },
          },
        } as const;

        return (
          <div className={`relative w-[80%] mx-auto ${className ?? 'h-[620px]'}`}>
            <Bar data={subData} options={subOptions as any} plugins={[midBandPlugin]} />
          </div>
        );
      }
    }
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
            font: { size: 13, weight: 'bold' as const },
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
      <div className={`relative w-[80%] mx-auto ${className ?? "h-[600px]"}`}>
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


