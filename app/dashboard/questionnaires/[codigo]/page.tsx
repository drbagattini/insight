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
  autores?: string;
  autoresOriginales?: string;
  añoPublicacion?: number;
  dimensiones?: {
    nombre: string;
    descripcion: string;
    subdimensiones?: string[];
  }[];
  scoring?: {
    rango?: [number, number];
    sentido?: string;
    tipo?: string;
    puntosDeCorte?: { umbral: number; label: string }[];
    formulaFrontEnd?: string;
    interpretacion?: {
      direccion?: string;
      escalas?: string;
      puntuacionTotal?: string;
    };
  };
  validez?: {
    fiabilidad?: string;
    muestra?: string;
    validezClinica?: string;
    estudiosClave?: { cita: string; doi?: string }[];
  };
  fundamentoTeorico?: {
    modelo?: string;
    enfoque?: string;
    objetivo?: string;
    baseConceptual?: string;
  };
  aplicacionClinica?: {
    usoRecomendado?: string;
    requiere?: string;
    complementar?: string;
    advertencia?: string;
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
            {/* Información general */}
            <SectionCard id="informacion" className="prose prose-lg dark:prose-invert">
              <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4">Información General</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">Población objetivo:</span>
                    <p className="text-gray-600 mt-1">{meta.poblacion}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Tiempo estimado:</span>
                    <p className="text-gray-600 mt-1">{meta.tiempoMin} minutos</p>
                  </div>
                  {(meta as any).autores && (
                    <div>
                      <span className="font-semibold text-gray-700">Autores:</span>
                      <p className="text-gray-600 mt-1">{(meta as any).autores}</p>
                      {(meta as any).autoresOriginales && (
                        <p className="text-gray-500 text-sm mt-1">Versión original: {(meta as any).autoresOriginales}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">Tipo de respuesta:</span>
                    <p className="text-gray-600 mt-1">{meta.respuestaTipo}</p>
                  </div>
                  {(meta as any).añoPublicacion && (
                    <div>
                      <span className="font-semibold text-gray-700">Año de publicación:</span>
                      <p className="text-gray-600 mt-1">{(meta as any).añoPublicacion}</p>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Dimensiones (para OPD-CA2-SQ) */}
            {codigo === 'OPD-CA2-SQ' && meta.dimensiones && (
              <SectionCard id="dimensiones" className="prose prose-lg dark:prose-invert">
                <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4">Dimensiones Evaluadas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                  {meta.dimensiones.map((dimension: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg text-gray-800 mb-2">{dimension.nombre}</h3>
                      <p className="text-gray-600 mb-3">{dimension.descripcion}</p>
                      {dimension.subdimensiones && (
                        <div>
                          <span className="font-medium text-gray-700 text-sm">Subdimensiones:</span>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-1">
                            {dimension.subdimensiones.map((sub: string, subIdx: number) => (
                              <li key={subIdx}>{sub}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Fundamento Teórico (para OPD-CA2-SQ) */}
            {codigo === 'OPD-CA2-SQ' && (meta as any).fundamentoTeorico && (
              <SectionCard id="fundamento" className="prose prose-lg dark:prose-invert">
                <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4">Fundamento Teórico</h2>
                <div className="space-y-4 not-prose">
                  <div>
                    <span className="font-semibold text-gray-700">Modelo base:</span>
                    <p className="text-gray-600 mt-1">{(meta as any).fundamentoTeorico.modelo}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Enfoque:</span>
                    <p className="text-gray-600 mt-1">{(meta as any).fundamentoTeorico.enfoque}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Objetivo principal:</span>
                    <p className="text-gray-600 mt-1">{(meta as any).fundamentoTeorico.objetivo}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Base conceptual:</span>
                    <p className="text-gray-600 mt-1">{(meta as any).fundamentoTeorico.baseConceptual}</p>
                  </div>
                </div>
              </SectionCard>
            )}

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
                        {codigo === 'OPD-CA2-SQ' ? 
                          [0, 1, 2, 3, 4].map((n) => <span key={n}>{n}</span>) :
                          [0, 1, 2, 3, 4, 5].map((n) => <span key={n}>{n}</span>)
                        }
                      </div>
                    </div>
                  ))}
                  {/* Leyenda Likert */}
                  <div className="mt-6 text-sm text-gray-500 space-y-1 md:w-2/3">
                    {codigo === 'OPD-CA2-SQ' ? (
                      <p>
                        <strong>0</strong> No — <strong>1</strong> Más no —{" "}
                        <strong>2</strong> Parte/parte — <strong>3</strong> Más sí —{" "}
                        <strong>4</strong> Sí
                      </p>
                    ) : (
                      <p>
                        <strong>0</strong> Nunca — <strong>1</strong> Rara vez —{" "}
                        <strong>2</strong> Menos de la mitad de las veces —{" "}
                        <strong>3</strong> Más de la mitad de las veces —{" "}
                        <strong>4</strong> Frecuentemente — <strong>5</strong> Todo el tiempo
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="not-prose">
                  <p className="text-gray-600">El cuestionario contiene <strong>81 ítems</strong> distribuidos en las cuatro dimensiones principales.</p>
                  <p className="text-gray-500 text-sm mt-2">La lista completa de ítems está disponible durante la administración del cuestionario.</p>
                </div>
              )}
            </SectionCard>

            {/* Puntuación */}
            <SectionCard id="puntuacion" className="prose prose-lg dark:prose-invert">
              <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4">Puntuación e Interpretación</h2>
              {meta.scoring ? (
                <div className="space-y-4 not-prose">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      {meta.scoring.rango && (
                        <div>
                          <span className="font-semibold text-gray-700">Rango de puntuaciones:</span>
                          <p className="text-gray-600 mt-1">{meta.scoring.rango[0]} - {meta.scoring.rango[1]} {codigo === 'OPD-CA2-SQ' ? '(por ítem)' : ''}</p>
                        </div>
                      )}
                      {meta.scoring.sentido && (
                        <div>
                          <span className="font-semibold text-gray-700">Interpretación:</span>
                          <p className="text-gray-600 mt-1">{meta.scoring.sentido}</p>
                        </div>
                      )}
                      {(meta.scoring as any).tipo && (
                        <div>
                          <span className="font-semibold text-gray-700">Tipo de puntuación:</span>
                          <p className="text-gray-600 mt-1">{(meta.scoring as any).tipo}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {meta.scoring.formulaFrontEnd && (
                        <div>
                          <span className="font-semibold text-gray-700">Cálculo:</span>
                          <p className="text-gray-600 mt-1">{meta.scoring.formulaFrontEnd}</p>
                        </div>
                      )}
                      {(meta.scoring as any).interpretacion && (
                        <div>
                          <span className="font-semibold text-gray-700">Escalas:</span>
                          <p className="text-gray-600 mt-1">{(meta.scoring as any).interpretacion.escalas}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {meta.scoring.puntosDeCorte?.length && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <span className="font-semibold text-amber-800">Puntos de corte clínicos:</span>
                      <ul className="list-disc ml-6 space-y-1 mt-2">
                        {meta.scoring.puntosDeCorte.map((p, i) => (
                          <li key={i} className="text-amber-700">
                            <strong>T-score {p.umbral}:</strong> {p.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {codigo === 'OPD-CA2-SQ' && (meta.scoring as any).interpretacion && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <span className="font-semibold text-blue-800">Información adicional:</span>
                      <ul className="list-disc ml-6 space-y-1 mt-2 text-blue-700">
                        <li>{(meta.scoring as any).interpretacion.direccion}</li>
                        <li>{(meta.scoring as any).interpretacion.puntuacionTotal}</li>
                        <li>Evaluación dimensional desde estructura saludable hasta alterada</li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p>Información de puntuación no disponible.</p>
              )}
            </SectionCard>

            {/* Validez y Fiabilidad (para OPD-CA2-SQ) */}
            {codigo === 'OPD-CA2-SQ' && meta.validez && (
              <SectionCard id="validez" className="prose prose-lg dark:prose-invert">
                <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4">Validez y Fiabilidad</h2>
                <div className="space-y-4 not-prose">
                  {meta.validez.fiabilidad && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <span className="font-semibold text-green-800">Fiabilidad:</span>
                      <p className="text-green-700 mt-1">{meta.validez.fiabilidad}</p>
                    </div>
                  )}
                  
                  {meta.validez.muestra && (
                    <div>
                      <span className="font-semibold text-gray-700">Muestra de validación:</span>
                      <p className="text-gray-600 mt-1">{meta.validez.muestra}</p>
                    </div>
                  )}
                  
                  {meta.validez.validezClinica && (
                    <div>
                      <span className="font-semibold text-gray-700">Validez clínica:</span>
                      <p className="text-gray-600 mt-1">{meta.validez.validezClinica}</p>
                    </div>
                  )}
                  
                  {meta.validez.estudiosClave && meta.validez.estudiosClave.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-700">Referencias clave:</span>
                      <ul className="list-disc ml-6 space-y-1 mt-2">
                        {meta.validez.estudiosClave.map((estudio, idx) => (
                          <li key={idx} className="text-gray-600">
                            {estudio.cita}
                            {estudio.doi && estudio.doi !== 'academic-tests.com' && (
                              <span className="text-blue-600 ml-2">DOI: {estudio.doi}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Aplicación Clínica (para OPD-CA2-SQ) */}
            {codigo === 'OPD-CA2-SQ' && meta.aplicacionClinica && (
              <SectionCard id="aplicacion" className="prose prose-lg dark:prose-invert">
                <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4">Aplicación Clínica</h2>
                <div className="space-y-4 not-prose">
                  {meta.aplicacionClinica.usoRecomendado && (
                    <div>
                      <span className="font-semibold text-gray-700">Uso recomendado:</span>
                      <p className="text-gray-600 mt-1">{meta.aplicacionClinica.usoRecomendado}</p>
                    </div>
                  )}
                  
                  {meta.aplicacionClinica.requiere && (
                    <div>
                      <span className="font-semibold text-gray-700">Requiere:</span>
                      <p className="text-gray-600 mt-1">{meta.aplicacionClinica.requiere}</p>
                    </div>
                  )}
                  
                  {meta.aplicacionClinica.complementar && (
                    <div>
                      <span className="font-semibold text-gray-700">Complementar con:</span>
                      <p className="text-gray-600 mt-1">{meta.aplicacionClinica.complementar}</p>
                    </div>
                  )}
                  
                  {meta.aplicacionClinica.advertencia && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <span className="font-semibold text-red-800">⚠️ Advertencia importante:</span>
                      <p className="text-red-700 mt-1">{meta.aplicacionClinica.advertencia}</p>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Recursos */}
            <SectionCard id="recursos" className="prose prose-lg dark:prose-invert">
              <h2 className="text-xl font-semibold border-b border-border pb-2 mb-4">Recursos</h2>
              {codigo === 'OPD-CA2-SQ' ? (
                <ul className="space-y-2">
                  <li>
                    <a
                      href="https://academic-tests.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Academic Tests - Plataforma de cuestionarios psicológicos
                    </a>
                  </li>
                  <li>
                    <span className="text-gray-600">
                      Kassin M, Hackradt J (2020). Adaptación cultural de la versión al Español del cuestionario OPD-CA2-SQ
                    </span>
                  </li>
                  <li>
                    <span className="text-gray-600">
                      Goth K & Schmeck K. OPD-KJ2-SF (versión alemana original)
                    </span>
                  </li>
                </ul>
              ) : codigo === 'GAD-7' ? (
                <ul className="space-y-2">
                  <li>
                    <a
                      href="https://doi.org/10.1186/1477-7525-8-8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Adaptación cultural española del GAD-7 (García-Campayo et al., 2010)
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://doi.org/10.1001/archinte.166.10.1092"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Estudio original del GAD-7 (Spitzer et al., 2006)
                    </a>
                  </li>
                </ul>
              ) : codigo === 'WHO-5' ? (
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
              ) : codigo === 'PHQ-9' ? (
                <ul className="space-y-2">
                  <li>
                    <a
                      href="https://doi.org/10.1001/jamanetworkopen.2023.36529"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Validez del PHQ-9 en español: Revisión sistemática y meta-análisis (Martinez et al., 2023)
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://doi.org/10.1046/j.1525-1497.2001.016009606.x"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Estudio original del PHQ-9 (Kroenke et al., 2001)
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://doi.org/10.1016/j.jad.2020.09.131"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Cribado de depresión en atención primaria con PHQ-9: Revisión sistemática (Costantini et al., 2021)
                    </a>
                  </li>
                </ul>
              ) : codigo === 'BR-WAI' ? (
                <ul className="space-y-2">
                  <li>
                    <a
                      href="https://doi.org/10.1080/10503307.2015.1061718"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Análisis IRT del Working Alliance Inventory y Brief Alliance Inventory (Mallinckrodt & Tekie, 2015)
                    </a>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-2">
                  <li>
                    <span className="text-gray-600">
                      Recursos específicos disponibles en los metadatos del cuestionario
                    </span>
                  </li>
                </ul>
              )}
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
