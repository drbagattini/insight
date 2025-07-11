"use client";

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import React from "react";
import questionnairesMeta, { QuestionnaireCode } from "@/src/data/questionnairesMeta";
import { LABELS } from "@/src/scoring/opdCa2";

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
const QuestionnaireChart: React.FC<QuestionnaireChartProps> = ({ data, codigo, className }) => {

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
    }
  };
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

  // Special handling for bar-multidim chart type (e.g. OPD-CA2-SQ):
  // This complex chart renders multiple dimensions and subdimensions from detailed score data
  if (type === "bar-multidim" && data.length > 0) {
    // Get latest data point (we only show current profile, not evolution for multi-dimensional)
    const latestData = data[data.length - 1];
    
    // Sanity check for detailed scores
    if (!latestData.score_detallado?.subDimensions) {
      return <div className="text-center text-red-500 py-8">Datos detallados no disponibles para {meta.title}.</div>;
    }

    const subDimensions = latestData.score_detallado.subDimensions;
    
    // Order for specific keys to ensure correct sequence
    // This makes Control items appear before Identity items, etc.
    const keyOrder = {
      // Control items
      'ctr_impulse': 1.1,
      'ctr_affect': 1.2,
      'ctr_consc': 1.3,
      'ctr_selfworth': 1.4,
      // Identity items
      'id_coherence': 2.1,
      'id_selfexp': 2.2,
      'id_sodiff': 2.3,
      'id_objectexp': 2.4,
      'id_belong': 2.5,
      // Interpersonality items
      'int_fantasies': 3.1,
      'int_emotcontact': 3.2,
      'int_reciprocity': 3.3,
      'int_affectexp': 3.4,
      'int_empathy': 3.5,
      'int_ability_detach': 3.6,
      // Attachment items
      'att_representation': 4.1,
      'att_internalbasis': 4.2,
      'att_capacity_alone': 4.3,
      'att_use_relations': 4.4
    } as const;

    // Definir colores para dimensiones totales (más intensos) y subdimensiones (más claros)
    const dimensionColors = {
      TOTAL: 'rgba(131, 56, 236, 0.8)', // Purple - Total global
      // Colores para dimensiones totales - más intensos
      CONTROL_TOTAL: 'rgba(59, 130, 246, 0.85)', // Blue - Control total
      IDENTITY_TOTAL: 'rgba(34, 197, 94, 0.85)', // Green - Identidad total
      INTERPERSONALITY_TOTAL: 'rgba(249, 115, 22, 0.85)', // Orange - Interpersonalidad total
      ATTACHMENT_TOTAL: 'rgba(234, 179, 8, 0.85)', // Yellow - Apego total
      // Colores para subdimensiones - más claros
      CONTROL: 'rgba(59, 130, 246, 0.6)', // Blue - subdimensiones de Control
      IDENTITY: 'rgba(34, 197, 94, 0.6)', // Green - subdimensiones de Identidad
      INTERPERSONALITY: 'rgba(249, 115, 22, 0.6)', // Orange - subdimensiones de Interpersonalidad
      ATTACHMENT: 'rgba(234, 179, 8, 0.6)' // Yellow - subdimensiones de Apego
    } as const;

    const borderColors = {
      TOTAL: 'rgb(131, 56, 236)', // Purple - Total global
      // Bordes para dimensiones totales - más oscuros
      CONTROL_TOTAL: 'rgb(30, 64, 175)', // Blue oscuro - Control total
      IDENTITY_TOTAL: 'rgb(22, 101, 52)', // Green oscuro - Identidad total
      INTERPERSONALITY_TOTAL: 'rgb(154, 52, 18)', // Orange oscuro - Interpersonalidad total
      ATTACHMENT_TOTAL: 'rgb(161, 98, 7)', // Yellow oscuro - Apego total
      // Bordes para subdimensiones - normales
      CONTROL: 'rgb(59, 130, 246)', // Blue - subdimensiones de Control
      IDENTITY: 'rgb(34, 197, 94)', // Green - subdimensiones de Identidad
      INTERPERSONALITY: 'rgb(249, 115, 22)', // Orange - subdimensiones de Interpersonalidad
      ATTACHMENT: 'rgb(234, 179, 8)' // Yellow - subdimensiones de Apego
    } as const;

    // Obtenemos las dimensiones principales (totales por categoría)
    const dimensions = latestData.score_detallado.dimensions;
    console.log('Dimensiones (totales por categoría):', dimensions);
    
    // Crear arrays de subdimensiones agrupados por categoría
    const controlEntries = Object.entries(subDimensions)
      .filter(([k]) => k.startsWith('ctr_'))
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => (keyOrder[a.key as keyof typeof keyOrder] ?? 999) - (keyOrder[b.key as keyof typeof keyOrder] ?? 999));
      
    const identityEntries = Object.entries(subDimensions)
      .filter(([k]) => k.startsWith('id_'))
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => (keyOrder[a.key as keyof typeof keyOrder] ?? 999) - (keyOrder[b.key as keyof typeof keyOrder] ?? 999));
      
    const interpersonalityEntries = Object.entries(subDimensions)
      .filter(([k]) => k.startsWith('int_'))
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => (keyOrder[a.key as keyof typeof keyOrder] ?? 999) - (keyOrder[b.key as keyof typeof keyOrder] ?? 999));
      
    const attachmentEntries = Object.entries(subDimensions)
      .filter(([k]) => k.startsWith('att_'))
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => (keyOrder[a.key as keyof typeof keyOrder] ?? 999) - (keyOrder[b.key as keyof typeof keyOrder] ?? 999));

    // Crear una estructura con claves ordenadas intercalando dimensión total seguido por subdimensiones
    const orderedItems = [
      { key: 'total', isTotal: true, tScore: latestData.score_detallado.total },
      
      // Control y sus subdimensiones
      { key: 'control', isTotal: true, tScore: dimensions.control.tScore },
      ...controlEntries.map(e => ({ key: e.key, isTotal: false, tScore: e.tScore })),
      
      // Identity y sus subdimensiones
      { key: 'identity', isTotal: true, tScore: dimensions.identity.tScore },
      ...identityEntries.map(e => ({ key: e.key, isTotal: false, tScore: e.tScore })),
      
      // Interpersonality y sus subdimensiones
      { key: 'interpersonality', isTotal: true, tScore: dimensions.interpersonality.tScore },
      ...interpersonalityEntries.map(e => ({ key: e.key, isTotal: false, tScore: e.tScore })),
      
      // Attachment y sus subdimensiones
      { key: 'attachment', isTotal: true, tScore: dimensions.attachment.tScore },
      ...attachmentEntries.map(e => ({ key: e.key, isTotal: false, tScore: e.tScore }))
    ];
    
    // Generar etiquetas usando LABELS para denominaciones clínicas correctas
    const chartLabels = orderedItems.map(item => {
      if (item.key === 'total') return LABELS.total;
      if (item.key === 'control') return LABELS.control;
      if (item.key === 'identity') return LABELS.identity;
      if (item.key === 'interpersonality') return LABELS.interpersonality;
      if (item.key === 'attachment') return LABELS.attachment;
      
      // Para subdimensiones usar LABELS con la clave correcta
      const key = item.key as keyof typeof LABELS;
      return LABELS[key] || item.key; // Fallback a la clave si no hay etiqueta
    });
    
    // Valores para el gráfico en el mismo orden
    const chartValues = orderedItems.map(item => item.tScore);
    
    // Generar colores según si es dimensión total o subdimensión
    const backgroundColors = orderedItems.map(item => {
      // Total global
      if (item.key === 'total') return dimensionColors.TOTAL;
      
      // Dimensiones totales - colores más intensos
      if (item.key === 'control' && item.isTotal) return dimensionColors.CONTROL_TOTAL;
      if (item.key === 'identity' && item.isTotal) return dimensionColors.IDENTITY_TOTAL;
      if (item.key === 'interpersonality' && item.isTotal) return dimensionColors.INTERPERSONALITY_TOTAL;
      if (item.key === 'attachment' && item.isTotal) return dimensionColors.ATTACHMENT_TOTAL;
      
      // Subdimensiones - colores más claros
      if (item.key.startsWith('ctr_')) return dimensionColors.CONTROL;
      if (item.key.startsWith('id_')) return dimensionColors.IDENTITY;
      if (item.key.startsWith('int_')) return dimensionColors.INTERPERSONALITY;
      if (item.key.startsWith('att_')) return dimensionColors.ATTACHMENT;
      
      return dimensionColors.TOTAL; // Fallback
    });
    
    // Colores de borde en el mismo orden
    const chartBorderColors = orderedItems.map(item => {
      // Total global
      if (item.key === 'total') return borderColors.TOTAL;
      
      // Dimensiones totales - bordes más oscuros
      if (item.key === 'control' && item.isTotal) return borderColors.CONTROL_TOTAL;
      if (item.key === 'identity' && item.isTotal) return borderColors.IDENTITY_TOTAL;
      if (item.key === 'interpersonality' && item.isTotal) return borderColors.INTERPERSONALITY_TOTAL;
      if (item.key === 'attachment' && item.isTotal) return borderColors.ATTACHMENT_TOTAL;
      
      // Subdimensiones - bordes normales
      if (item.key.startsWith('ctr_')) return borderColors.CONTROL;
      if (item.key.startsWith('id_')) return borderColors.IDENTITY;
      if (item.key.startsWith('int_')) return borderColors.INTERPERSONALITY;
      if (item.key.startsWith('att_')) return borderColors.ATTACHMENT;
      
      return borderColors.TOTAL; // Fallback
    });

    console.log('Total de dimensiones y subdimensiones:', chartLabels.length);
    console.log('Etiquetas clínicas usadas:', chartLabels);
    console.log('Valores T-Score:', chartValues);

    const multidimData = {
      labels: chartLabels,
      datasets: [
        {
          label: 'T-Score por Sub-dimensión',
          data: chartValues,
          backgroundColor: backgroundColors,
          borderColor: chartBorderColors,
          borderWidth: 2,
          barPercentage: 0.6,
          categoryPercentage: 0.9,
        }
      ]
    };

    const multidimOptions = {
      ...commonOptions,
      scales: {
        y: {
          beginAtZero: false,
          min: 20,
          max: 80,
          title: {
            display: true,
            text: 'T-Score',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 30,
            font: {
              size: 11,
              weight: '500'
            },
            color: '#374151'
          },
          grid: {
            display: false
          }
        }
      },
      // Make bars thinner for better visual clarity
      barThickness: 25,
      maxBarThickness: 30,
      plugins: {
        legend: {
          display: false // Ocultar la leyenda principal, los colores son suficientes
        },
        title: {
          display: true,
          text: `Perfil de Estructura Psíquica - ${new Date(latestData.creado_en).toLocaleDateString()}`,
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
            callbacks: {
                title: function(context: any) {
                    return context[0].label;
                },
                label: function(context: any) {
                    return `T-Score: ${context.parsed.y}`;
                }
            }
        }
      }
    };

    return (
      <div className={`relative w-full ${className ?? "h-[600px]"}`}>
        <Bar data={multidimData} options={multidimOptions as any} plugins={[midBandPlugin]} />
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
