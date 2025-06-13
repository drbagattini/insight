"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";
import { FiFileText } from "react-icons/fi";
import { QUERY_KEYS } from "@/lib/constants";
import questionnairesMeta from "@/data/questionnaires-meta";

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

  const {
    data: questionnaires = [],
    isLoading,
    error,
  } = useQuery<QuestionnaireListItem[]>({
    queryKey: QUERY_KEYS.QUESTIONNAIRES,
    queryFn: async () => {
      const res = await fetch("/api/questionnaires", { cache: "no-store" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al cargar cuestionarios");
      }
      return res.json();
    },
    refetchOnMount: true,
  });

  // Available domains for the filter dropdown (including "Todos")
  const availableDomains = useMemo(() => {
    const set = new Set<string>(questionnaires.map((q) => q.dominio));
    return ["Todos", ...Array.from(set)];
  }, [questionnaires]);

  // Filtered questionnaire list based on search text and domain
  const filteredQuestionnaires = useMemo(() => {
    return questionnaires.filter((q) => {
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Cuestionarios</h1>

      {/* Search + Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cuestionarios..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
          >
            {availableDomains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
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
                    {meta.items && (
                      <span>{meta.items.length} ítems</span>
                    )}
                    {meta.tiempoMin && (
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
