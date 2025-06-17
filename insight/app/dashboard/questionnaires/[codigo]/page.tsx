"use client";

import { useState, use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { QUERY_KEYS } from "@/lib/constants";
import QuickSendDialog from "@/components/questionnaire/QuickSendDialog";
import SectionCard from "@/components/ui/SectionCard";
import { Send } from "lucide-react";
import clsx from "clsx";

interface QuestionnaireMeta {
  nombre: string;
  dominio: string;
  descripcion?: string;
  poblacion?: string;
  tiempoMin?: number;
  items?: { orden: number; texto: string }[];
  respuestaTipo?: string;
  scoring?: {
    rango?: [number, number];
    sentido?: string;
    puntosDeCorte?: { umbral: number; label: string }[];
    formulaFrontEnd?: string;
  };
  validez?: {
    fiabilidad?: string;
    estudiosClave?: { cita: string; doi?: string }[];
  };
}

interface QuestionnaireDetail {
  id: string;
  codigo: string;
  titulo: string;
  activo: boolean;
  meta: QuestionnaireMeta | null;
  // other DB fields if needed
}

// Color mapping reused from list page (keep in sync)
const DOMAIN_COLOR_CLASSES: Record<string, string> = {
  Ansiedad: "bg-yellow-100 text-yellow-800",
  Depresión: "bg-red-100 text-red-800",
  "Estado de ánimo": "bg-blue-100 text-blue-800",
  Bienestar: "bg-green-100 text-green-800",
  Otro: "bg-gray-100 text-gray-800",
};

function getDomainClasses(dominio: string) {
  return DOMAIN_COLOR_CLASSES[dominio] || DOMAIN_COLOR_CLASSES["Otro"];
}

export default function QuestionnaireDetailPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = use(params);

  const [sendOpen, setSendOpen] = useState(false);

  const {
    data,
    isLoading,
    error,
  } = useQuery<QuestionnaireDetail>({
    queryKey: [QUERY_KEYS.QUESTIONNAIRES, codigo],
    queryFn: async () => {
      const res = await fetch(`/api/questionnaires/${codigo}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al cargar cuestionario");
      }
      return res.json();
    },
    refetchOnMount: true,
  });

  if (isLoading) return <div className="p-6 text-gray-600">Cargando…</div>;
  if (error)
    return (
      <div className="p-6 text-red-500">Error: {(error as Error).message}</div>
    );
  if (!data) return <div className="p-6">No se encontró el cuestionario</div>;

  const { meta } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6">
      {/* Breadcrumb / Back */}
      <div>
        <Link href="/dashboard/questionnaires" className="text-blue-600 text-sm">
          ← Volver al listado
        </Link>
      </div>

      {/* Hero card */}
      <SectionCard shadow className="flex flex-col gap-4 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
                {meta?.nombre || data.titulo || codigo}
              </h1>
              {meta?.dominio && (
                <span
                  className={clsx(
                    "px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800",
                    "self-center"
                  )}
                >
                  {meta.dominio}
                </span>
              )}
            </div>
          </div>
          <div className="hidden sm:block self-start">
            <button
              onClick={() => setSendOpen(true)}
              className="px-4 py-2 bg-primary hover:bg-primary_hov text-white rounded-lg shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
            >
              Enviar cuestionario
            </button>
          </div>
        </div>
        {meta?.descripcion && (
          <p className="prose prose-lg dark:prose-invert leading-relaxed max-w-none mt-2">
            {meta.descripcion}
          </p>
        )}
      </SectionCard>

      {/* Main layout */}
      {meta === null ? (
        <div className="p-6 bg-yellow-50 text-yellow-800 rounded-lg">
          Información en preparación para este cuestionario.
        </div>
      ) : (
        <div className="space-y-8">
          <main className="space-y-8">
            {/* Ítems */}
            <SectionCard id="items" className="prose prose-lg dark:prose-invert">
              <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4">Ítems</h2>
              {meta.items?.length ? (
                <div className="space-y-4">
                  {meta.items.map((item, idx) => (
                    <div
                      key={item.orden}
                      className="md:flex md:items-start md:justify-between gap-4"
                    >
                      <p className="md:w-4/5 leading-7">
                        <span className="font-medium mr-1">{idx + 1}.</span>
                        {item.texto}
                      </p>
                      <div className="mt-2 md:mt-0 md:w-1/5 flex justify-end gap-1 text-xs text-gray-500">
                        {[0, 1, 2, 3, 4, 5].map((n) => (
                          <span key={n}>{n}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {/* Leyenda Likert */}
                  <div className="mt-6 text-sm text-gray-500 space-y-1 md:w-2/3">
                    <p>
                      <strong>0</strong> Nunca — <strong>1</strong> Rara vez —{" "}
                      <strong>2</strong> Menos de la mitad de las veces —{" "}
                      <strong>3</strong> Más de la mitad de las veces —{" "}
                      <strong>4</strong> Frecuentemente — <strong>5</strong> Todo el tiempo
                    </p>
                  </div>
                </div>
              ) : (
                <p>Lista de ítems no disponible.</p>
              )}
            </SectionCard>

            {/* Puntuación */}
            <SectionCard id="puntuacion" className="prose prose-lg dark:prose-invert">
              <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4">Puntuación</h2>
              {meta.scoring ? (
                <div className="space-y-2 mt-4">
                  {meta.scoring.rango && (
                    <p>
                      <strong>Rango:</strong> {meta.scoring.rango[0]} - {meta.scoring.rango[1]}
                    </p>
                  )}
                  {meta.scoring.sentido && (
                    <p>
                      <strong>Sentido:</strong> {meta.scoring.sentido}
                    </p>
                  )}
                  {meta.scoring.puntosDeCorte?.length && (
                    <div>
                      <strong>Puntos de corte:</strong>
                      <ul className="list-disc ml-6 space-y-1">
                        {meta.scoring.puntosDeCorte.map((p, i) => (
                          <li key={i}>
                            {p.label}: {p.umbral}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {meta.scoring.formulaFrontEnd && (
                    <p>
                      <strong>Fórmula:</strong> {meta.scoring.formulaFrontEnd}
                    </p>
                  )}
                </div>
              ) : (
                <p>Información de puntuación no disponible.</p>
              )}
            </SectionCard>

            {/* Recursos */}
            <SectionCard id="recursos" className="prose prose-lg dark:prose-invert">
              <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4">Recursos</h2>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://www.who.int/es/publications/m/item/WHO-UCN-MSD-MHE-2024.01"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Sitio oficial de la OMS – Documento WHO-5 (2024)
                  </a>
                </li>
                <li>
                  <a
                    href="https://karger.com/pps/article/84/3/167/282903/The-WHO-5-Well-Being-Index-A-Systematic-Review-of"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    The WHO-5 Well-Being Index: A Systematic Review of the Literature (Topp et al., 2015)
                  </a>
                </li>
              </ul>
            </SectionCard>
          </main>
        </div>
      )}

      {/* FAB mobile */}
      <button
        onClick={() => setSendOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-400"
        aria-label="Enviar cuestionario"
      >
        <Send className="h-5 w-5" />
      </button>

      <QuickSendDialog
        isOpen={sendOpen}
        onClose={() => setSendOpen(false)}
        cuestionarioId={data.id}
      />
    </div>
  );
}
