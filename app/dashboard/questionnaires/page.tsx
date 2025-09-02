"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";
import { FiFileText } from "react-icons/fi";
import { QUERY_KEYS } from "@/lib/constants";
import questionnairesMeta from "@/src/data/questionnairesMeta";
import { sortQuestionnaires } from "@/lib/questionnaire-order";

interface QuestionnaireListItem {
  codigo: string;
  nombre: string;
  dominio: string;
}

// Simple color mapping for questionnaire domains (extend as needed)
const DOMAIN_COLOR_CLASSES: Record<string, string> = {
  Ansiedad: "bg-yellow-100 text-yellow-800",
  Depresión: "bg-red-100 text-red-800",
  "Estado de ánimo": "bg-blue-100 text-blue-800",
  Otro: "bg-gray-100 text-gray-800",
};

function getDomainClasses(dominio: string) {
  return DOMAIN_COLOR_CLASSES[dominio] || DOMAIN_COLOR_CLASSES["Otro"];
}

export default function QuestionnairesPage() {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("Todos");

  const { data: questionnaires = [], isLoading, error } = useQuery({
    queryKey: ['questionnaires'],
    queryFn: async (): Promise<QuestionnaireListItem[]> => {
      const response = await fetch('/api/cuestionarios');
      if (!response.ok) {
        throw new Error('Error al cargar cuestionarios');
      }
      const data = await response.json();
      return sortQuestionnaires(data) as unknown as QuestionnaireListItem[];
    },
  });

  // Available domains for the filter dropdown (including "Todos")
  const availableDomains = useMemo(() => {
    const set = new Set<string>(questionnaires.map((q) => q.dominio).filter(Boolean));
    return ["Todos", ...Array.from(set)];
  }, [questionnaires]);

  // Filtered questionnaire list based on search text and domain
  const filteredQuestionnaires = useMemo(() => {
    return questionnaires
      .map((q: any) => ({
        ...q,
        dominio: q.dominio || "Otro",
      }))
      .filter((q: any) => {
        const matchesSearch = q.nombre
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesDomain =
          domainFilter === "Todos" || q.dominio === domainFilter;
        return matchesSearch && matchesDomain;
      });
  }, [questionnaires, search, domainFilter]);

  if (isLoading) {
    return <div className="p-6 text-gray-600">Cargando cuestionarios...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Error: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Título principal y controles */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Biblioteca de cuestionarios</h1>
          <p className="text-lg text-gray-600">Instrumentos de evaluación disponibles</p>
        </div>
        
        {/* Controles de búsqueda y filtro */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cuestionarios..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-auto min-w-[200px]">
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
            >
              {availableDomains.map((d) => (
                <option key={d} value={d}>
                  {d === "Todos" ? "Filtro: Todos" : d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Questionnaire Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredQuestionnaires.length === 0 && (
          <div className="p-8 text-center col-span-full text-gray-500">
            No se encontraron cuestionarios
          </div>
        )}
        {filteredQuestionnaires.map((q) => (
          <Link
            key={q.codigo}
            href={`/dashboard/questionnaires/${q.codigo}`}
            className={`bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition flex flex-col space-y-4 ${
              q.dominio === "Otro" ? "opacity-60" : ""
            }`}
          >
            {/* Icon + domain pill */}
            <div className="flex items-start justify-between">
              <FiFileText className="text-blue-500 text-2xl" />
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded ${getDomainClasses(
                  q.dominio
                )}`}
              >
                {q.dominio}
              </span>
            </div>

            {/* Name */}
            <h3 className="text-lg font-semibold text-gray-800 flex-1">
              {q.nombre}
            </h3>

            {/* Meta info */}
            <div className="text-xs text-gray-600 space-x-2">
              {(() => {
                const meta =
                  questionnairesMeta[
                    q.codigo as keyof typeof questionnairesMeta
                  ] || null;
                if (!meta) return null;
                return (
                  <>
                    {'items' in meta && meta.items && (
                      <span>{meta.items.length} ítems</span>
                    )}
                    {'tiempoMin' in meta && meta.tiempoMin && (
                      <span>{meta.tiempoMin} min</span>
                    )}
                  </>
                );
              })()}
            </div>

            {q.dominio === "Otro" && (
              <span className="inline-block text-amber-600 text-xs font-medium">
                Meta pendiente
              </span>
            )}

            <div className="text-right mt-auto text-blue-600 text-sm font-medium">
              Ver detalles →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
