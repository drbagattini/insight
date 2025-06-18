"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Suggestion {
  code: string;
  title: string;
  id: string;
}

interface Props {
  label: string;
  value: string;
  onChange: (text: string, code: string | undefined) => void;
}

/**
 * Autocomplete combobox for ICD-11 diagnosis search. Calls backend proxy API
 * `/api/icd11/search?q=...` and presents up to 20 suggestions. When the user
 * selects a suggestion (by click or keyboard), the code is passed along with
 * the selected text to the parent form.
 */
export default function Icd11Autocomplete({ label, value, onChange }: Props) {
  const [query, setQuery] = useState(value);

  // Sync internal state with external value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isFetching, error } = useQuery<Suggestion[]>({
    queryKey: ["icd11", query],
    enabled: query.trim().length > 2,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const res = await fetch(`/api/icd11/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Error en búsqueda ICD-11");
      return res.json();
    },
  });

  // Close dropdown on clicks outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Reset highlight when options change
  useEffect(() => {
    setHighlighted(0);
  }, [suggestions]);

  function handleSelect(item: Suggestion) {
    onChange(`${item.code} · ${item.title}`, item.code);
    setQuery(`${item.code} · ${item.title}`);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min((suggestions?.length || 0) - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = suggestions?.[highlighted];
      if (item) handleSelect(item);
    }
  }

  return (
    <div className="flex flex-col" ref={containerRef}>
      <label className="text-sm font-medium mb-1" htmlFor="icd11-input">
        {label}
      </label>
      <Input
        id="icd11-input"
        value={query}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value, undefined); // reset code until selected
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Buscar diagnóstico…"
      />
      {open && (isFetching || suggestions?.length) ? (
        <div className="relative">
          <ul className="absolute z-10 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-white shadow-lg text-sm">
            {isFetching && (
              <li className="p-2 flex items-center justify-center text-muted-foreground">
                <Loader2 className="animate-spin w-4 h-4 mr-2" /> Buscando…
              </li>
            )}
            {suggestions?.map((item, idx) => (
              <li
                key={item.id}
                className={`px-2 py-1 cursor-pointer hover:bg-blue-50 ${
                  idx === highlighted ? "bg-blue-100" : ""
                }`}
                onMouseEnter={() => setHighlighted(idx)}
                onMouseDown={(e) => {
                  // prevent input blur
                  e.preventDefault();
                  handleSelect(item);
                }}
              >
                <span className="font-mono mr-2 text-blue-700">{item.code}</span>
                {item.title}
              </li>
            ))}
            {!isFetching && !suggestions?.length && query.trim().length > 2 && !error && (
              <li className="px-2 py-1 text-muted-foreground">Sin resultados</li>
            )}
            {error && (
              <li className="p-2 text-red-600">Error: {(error as Error).message}</li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
