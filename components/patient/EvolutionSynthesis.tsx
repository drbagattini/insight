'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Brain, Calendar, Loader2, Save, AlertCircle, RotateCcw } from 'lucide-react';
import { EvolucionClinicaEntry } from '@/types/evolucion-clinica';

interface EvolutionSynthesisProps {
  patientId: string;
  patientName?: string;
  evolutions?: EvolucionClinicaEntry[];
  onSynthesisCreated?: (synthesis: EvolucionClinicaEntry) => void;
}

interface SynthesisRequest {
  startDate: string;
  endDate: string;
  selectedEvolutions: string[];
}

interface SynthesisResponse {
  synthesis: string;
  tokensUsed: number;
  cost: number;
  analyzedEntries: number;
}

export function EvolutionSynthesis({ 
  patientId, 
  patientName, 
  evolutions, 
  onSynthesisCreated 
}: EvolutionSynthesisProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [synthesis, setSynthesis] = useState<SynthesisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtrar evoluciones por rango de fechas
  const getFilteredEvolutions = () => {
    if (!startDate || !endDate || !evolutions || evolutions.length === 0) return [];
    
    return evolutions.filter(evolution => {
      const evolutionDate = new Date(evolution.created_at).toISOString().split('T')[0];
      return evolutionDate >= startDate && evolutionDate <= endDate;
    }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const filteredEvolutions = getFilteredEvolutions();

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
    setSynthesis(null);
    setError(null);
  };

  const generateSynthesis = async () => {
    if (filteredEvolutions.length === 0) {
      setError('No hay evoluciones en el rango de fechas seleccionado');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/evolution/synthesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evolutions: filteredEvolutions.map(ev => ({
            timestamp: ev.created_at,
            content: ev.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Error al generar síntesis');
      }

      const result: SynthesisResponse = await response.json();
      setSynthesis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveSynthesis = async () => {
    if (!synthesis) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patientId}/evolution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entry_type: 'sintesis_ia',
          content: synthesis.synthesis,
          metadata: {
            synthesis: true,
            period: {
              start: startDate,
              end: endDate
            },
            analyzedEntries: synthesis.analyzedEntries,
            tokensUsed: synthesis.tokensUsed,
            cost: synthesis.cost,
            generatedAt: new Date().toISOString()
          },
          tags: ['sintesis-ia']
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar síntesis');
      }

      const savedEntry = await response.json();
      onSynthesisCreated?.(savedEntry);
      
      // Limpiar estado
      setSynthesis(null);
      setStartDate('');
      setEndDate('');
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="default"
        size="sm"
        className="flex items-center gap-1.5 h-9 px-3 text-xs bg-blue-500 hover:bg-blue-600 text-white border-blue-500 shadow-sm"
      >
        <Brain className="h-3.5 w-3.5" />
        Síntesis Evolutiva IA
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Síntesis Evolutiva IA"
        size="lg"
      >
        <div className="space-y-4">
          {patientName && (
            <p className="text-sm text-gray-600">
              Paciente: <span className="font-medium">{patientName}</span>
            </p>
          )}

          {/* Validación temprana para evoluciones */}
          {!evolutions || evolutions.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
              <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-yellow-800 font-medium mb-1">
                No hay evoluciones disponibles
              </p>
              <p className="text-xs text-yellow-700">
                Necesitas tener al menos una evolución clínica registrada para generar una síntesis.
              </p>
            </div>
          ) : (
            <>
          {/* Selector de fechas original */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Botón limpiar filtros */}
          {(startDate || endDate) && (
            <div className="flex justify-end">
              <Button
                onClick={clearDates}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpiar fechas
              </Button>
            </div>
          )}

      {/* Evoluciones filtradas */}
      {startDate && endDate && (
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Evoluciones en el período seleccionado:
          </p>
          {filteredEvolutions.length > 0 ? (
            <div className="space-y-1">
              {filteredEvolutions.map((evolution) => (
                <div key={evolution.id} className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-600">
                    {new Date(evolution.created_at).toLocaleDateString()}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {evolution.entry_type}
                  </Badge>
                  <span className="text-gray-500 truncate">
                    {evolution.content.substring(0, 50)}...
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No hay evoluciones en este período
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Botón generar */}
      <Button
        onClick={generateSynthesis}
        disabled={filteredEvolutions.length === 0 || isGenerating}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generando síntesis...
          </>
        ) : (
          <>
            <Brain className="h-4 w-4 mr-2" />
            Generar Síntesis ({filteredEvolutions.length} evoluciones)
          </>
        )}
      </Button>

      {/* Resultado de síntesis */}
      {synthesis && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-blue-900">Síntesis Generada</h3>
          </div>
          
          <div className="bg-white p-3 rounded border text-sm leading-relaxed">
            {synthesis.synthesis}
          </div>

          <Button
            onClick={saveSynthesis}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Síntesis
              </>
            )}
          </Button>
        </div>
      )}
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
