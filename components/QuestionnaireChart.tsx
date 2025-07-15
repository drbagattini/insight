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
    console.log('DATA RECIBIDA:', data);
    console.log('LATEST ITEM:', latest);
    
    if (latest?.score_detallado) { 
      const { score_detallado } = latest;
      console.log('SCORE DETALLADO:', score_detallado);
      const sub = score_detallado.subDimensions || {};
      console.log('SUBDIMENSIONS:', sub);

    // Orden clínico de visualización exacto para OPD-CA2-SQ
    // 1. Estructura total
    // 2-5. Las 4 dimensiones principales
    // 6-24. Las 19 subdimensiones en orden clínico
    const orderedKeys = [
      // Total - debe ir primero
      'total', 

      // 1. Control (total) y sus subdimensiones
      'control',
      'ctr_impulse', 
      'ctr_affect', 
      'ctr_consc', 
      'ctr_selfworth',

      // 2. Identidad (total) y sus subdimensiones
      'identity',
      'id_coherence', 
      'id_selfexp', 
      'id_sodiff', 
      'id_objectexp', 
      'id_belong',

      // 3. Interpersonalidad (total) y sus subdimensiones
      'interpersonality',
      'int_fantasies', 
      'int_emotcontact', 
      'int_reciprocity', 
      'int_affectexp', 
      'int_empathy', 
      'int_ability_detach',

      // 4. Apego (total) y sus subdimensiones
      'attachment',
      'att_representation', 
      'att_internalbasis', 
      'att_capacity_alone', 
      'att_use_relations',
    ];

    // Etiquetas clínicas oficiales
    const LABELS: Record<string, string> = {
      // Total
      OPD_total_t: 'Estructura (total)',
      total: 'Estructura (total)',

      // Control
      OPD_control_t: '1. Control (total)',
      control: '1. Control (total)',
      OPD_CTR_Impulse_t: '1.1 Control de impulsos',
      ctr_impulse: '1.1 Control de impulsos',
      OPD_CTR_Affect_t: '1.2 Tolerancia afectiva',
      ctr_affect: '1.2 Tolerancia afectiva',
      OPD_CTR_Consc_t: '1.3 Formación de conciencia',
      ctr_consc: '1.3 Formación de conciencia',
      OPD_CTR_Selfworth_t: '1.4 Autovaloración',
      ctr_selfworth: '1.4 Autovaloración',

      // Identidad
      OPD_Identity_t: '2. Identidad (total)',
      identity: '2. Identidad (total)',
      OPD_Id_Coherence_t: '2.1 Coherencia',
      id_coherence: '2.1 Coherencia',
      OPD_Id_Selfexp_t: '2.2 Percepción del sí mismo',
      id_selfexp: '2.2 Percepción del sí mismo',
      OPD_Id_SODiff_t: '2.3 Diferenciación self-objeto',
      id_sodiff: '2.3 Diferenciación self-objeto',
      OPD_Id_Objectexp_t: '2.4 Percepción del objeto',
      id_objectexp: '2.4 Percepción del objeto',
      OPD_Id_Belong_t: '2.5 Pertenencia',
      id_belong: '2.5 Pertenencia',

      // Interpersonalidad
      OPD_Interpersonality_t: '3. Interpersonalidad (total)',
      interpersonality: '3. Interpersonalidad (total)',
      OPD_Int_Fantasies_t: '3.1 Fantasías',
      int_fantasies: '3.1 Fantasías',
      OPD_Int_emotContact_t: '3.2 Contacto emocional',
      int_emotcontact: '3.2 Contacto emocional',
      OPD_Int_Reciprocity_t: '3.3 Reciprocidad',
      int_reciprocity: '3.3 Reciprocidad',
      OPD_Int_Affectexp_t: '3.4 Percepción de afectos',
      int_affectexp: '3.4 Percepción de afectos',
      OPD_Int_Empathy_t: '3.5 Empatía',
      int_empathy: '3.5 Empatía',
      OPD_Int_Ability_detach_t: '3.6 Capacidad para separarse',
      int_ability_detach: '3.6 Capacidad para separarse',

      // Apego
      OPD_Attachment_t: '4. Apego (total)',
      attachment: '4. Apego (total)',
      OPD_Att_Representation_t: '4.1 Acceso a representaciones de apego',
      att_representation: '4.1 Acceso a representaciones de apego',
      OPD_Att_internalBasis_t: '4.2 Base segura interna',
      att_internalbasis: '4.2 Base segura interna',
      OPD_Att_Capacity_Alone_t: '4.3 Capacidad para estar solo',
      att_capacity_alone: '4.3 Capacidad para estar solo',
      OPD_Att_Use_relations_t: '4.4 Uso de relaciones de apego',
      att_use_relations: '4.4 Uso de relaciones de apego',
    };

    // Mapa bidireccional para buscar claves en ambas direcciones
    const altKeyMap: Record<string, string> = {
      // OPD -> original
      'OPD_total_t': 'total',
      'OPD_control_t': 'control',
      'OPD_Identity_t': 'identity',
      'OPD_Interpersonality_t': 'interpersonality',
      'OPD_Attachment_t': 'attachment',
      'OPD_CTR_Impulse_t': 'ctr_impulse',
      'OPD_CTR_Affect_t': 'ctr_affect',
      'OPD_CTR_Consc_t': 'ctr_consc',
      'OPD_CTR_Selfworth_t': 'ctr_selfworth',
      'OPD_Id_Coherence_t': 'id_coherence',
      'OPD_Id_Selfexp_t': 'id_selfexp',
      'OPD_Id_SODiff_t': 'id_sodiff',
      'OPD_Id_Objectexp_t': 'id_objectexp',
      'OPD_Id_Belong_t': 'id_belong',
      'OPD_Int_Fantasies_t': 'int_fantasies',
      'OPD_Int_emotContact_t': 'int_emotcontact',
      'OPD_Int_Reciprocity_t': 'int_reciprocity',
      'OPD_Int_Affectexp_t': 'int_affectexp',
      'OPD_Int_Empathy_t': 'int_empathy',
      'OPD_Int_Ability_detach_t': 'int_ability_detach',
      'OPD_Att_Representation_t': 'att_representation',
      'OPD_Att_internalBasis_t': 'att_internalbasis',
      'OPD_Att_Capacity_Alone_t': 'att_capacity_alone',
      'OPD_Att_Use_relations_t': 'att_use_relations',
      // original -> OPD
      'total': 'OPD_total_t',
      'control': 'OPD_control_t',
      'identity': 'OPD_Identity_t',
      'interpersonality': 'OPD_Interpersonality_t',
      'attachment': 'OPD_Attachment_t',
      'ctr_impulse': 'OPD_CTR_Impulse_t',
      'ctr_affect': 'OPD_CTR_Affect_t',
      'ctr_consc': 'OPD_CTR_Consc_t',
      'ctr_selfworth': 'OPD_CTR_Selfworth_t',
      'id_coherence': 'OPD_Id_Coherence_t',
      'id_selfexp': 'OPD_Id_Selfexp_t',
      'id_sodiff': 'OPD_Id_SODiff_t',
      'id_objectexp': 'OPD_Id_Objectexp_t',
      'id_belong': 'OPD_Id_Belong_t',
      'int_fantasies': 'OPD_Int_Fantasies_t',
      'int_emotcontact': 'OPD_Int_emotContact_t',
      'int_reciprocity': 'OPD_Int_Reciprocity_t',
      'int_affectexp': 'OPD_Int_Affectexp_t',
      'int_empathy': 'OPD_Int_Empathy_t',
      'int_ability_detach': 'OPD_Int_Ability_detach_t',
      'att_representation': 'OPD_Att_Representation_t',
      'att_internalbasis': 'OPD_Att_internalBasis_t',
      'att_capacity_alone': 'OPD_Att_Capacity_Alone_t',
      'att_use_relations': 'OPD_Att_Use_relations_t',
    };

    // Paleta de colores clínicos oficiales exacta
    const baseColors: Record<string, string> = {
      total: 'rgb(0, 0, 0)',       // Negro para estructura total
      control: 'rgb(0, 75, 150)',  // Azul para dimensión Control
      identity: 'rgb(0, 150, 75)', // Verde para dimensión Identidad
      interpersonality: 'rgb(180, 75, 0)',  // Naranja-marrón para Interpersonalidad
      attachment: 'rgb(180, 120, 0)',       // Dorado para dimensión Apego
    };

    const bgColors: string[] = [];
    const values: number[] = [];
    const displayLabels: string[] = [];

    // Recorremos las claves en el orden clínico
    orderedKeys.forEach((k) => {
      let val;
      
      // La estrategia de búsqueda depende de si es dimensión principal o subdimensión
      const isMainDimension = ['total', 'control', 'identity', 'interpersonality', 'attachment'].includes(k);
      
      // Buscar el valor en la ubicación correcta
      if (isMainDimension) {
        // Para dimensiones principales y total, buscamos directamente en score_detallado
        val = score_detallado[k];
        } else {
        // Para subdimensiones, buscamos en subDimensions
        val = sub[k];
      }
      
      console.log(`Key: ${k}, Value: ${val}, Label: ${LABELS[k]}`);


      if (val !== null && val !== undefined) {
        values.push(val as number);
        // Siempre usar la etiqueta clínica del mapeo LABELS
        displayLabels.push(LABELS[k] || k);

        // Determina a qué dimensión pertenece para aplicar color
        const dim = (() => {
          if (k === 'total') return 'total';
          if (k === 'control' || k.startsWith('ctr_')) return 'control';
          if (k === 'identity' || k.startsWith('id_')) return 'identity';
          if (k === 'interpersonality' || k.startsWith('int_')) return 'interpersonality';
          if (k === 'attachment' || k.startsWith('att_')) return 'attachment';
          return 'total'; // fallback
        })();

        // Determina si es dimensión principal para ajustar la opacidad
        const isMain = ['total', 'control', 'identity', 'interpersonality', 'attachment'].includes(k);
        
        // Usa diferentes niveles de opacidad para distinguir claramente los niveles:
        // - Total: opacidad máxima
        // - Dimensiones principales: opacidad alta
        // - Subdimensiones: opacidad media
        let alpha = 0.45; // subdimensiones
        if (k === 'total') {
          alpha = 1.0; // total con opacidad completa
        } else if (isMain) {
          alpha = 0.85; // dimensiones principales
        }
        const rgb = baseColors[dim];
        bgColors.push(rgb.replace('rgb', 'rgba').replace(')', `, ${alpha})`));
      }
    });

    const barData: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor: string[];
        borderColor: string[];
        borderWidth: number;
      }>;
    } = {
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
    };

    // Plugin para banda saludable 40-60
    const midBandPlugin = {
      id: 'midBand',
      beforeDatasetsDraw(chart: ChartJS<'bar'>) {
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
        y: { 
          beginAtZero: false, 
          min: 20, 
          max: 80, 
          title: { display: true, text: 'T-Score' },
          grid: {
            color: (ctx: any) => {
              // Resaltar la línea del valor 40 y 60 (banda saludable)
              if (ctx.tick.value === 40 || ctx.tick.value === 60) {
                return 'rgba(0,0,0,0.2)';
              }
              return 'rgba(0,0,0,0.1)';
            }
          }
        },
        x: { 
          ticks: { 
            autoSkip: false, 
            maxRotation: 65, 
            minRotation: 40, 
            font: { size: 9 } 
          }, 
          grid: { display: false } 
        },
      },
      plugins: {
        legend: { display: false },
        title: { 
          display: true, 
          font: { size: 14, weight: 'bold' },
          text: `Perfil Estructural Adolescente – ${latest.fecha ? new Date(latest.fecha).toLocaleDateString() : 'Última evaluación'}` 
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
            }
          },
        },
      },
    } as const;

    return (
      <div className={`relative w-full ${className ?? 'h-[800px]'}`}>
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
