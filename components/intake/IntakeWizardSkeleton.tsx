"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";
import { intakeFieldsDefinition } from '@/lib/intake-form-schema';

interface IntakeWizardSkeletonProps {
  patientId: string;
}

/**
 * Skeleton read-only view for the intake evolution. It groups the 26 fields in the 4 logical sections
 * required by the spec. Editing / autosave will be added in a later feature branch.
 */
export default function IntakeWizardSkeleton({ patientId }: IntakeWizardSkeletonProps) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchIntake() {
      try {
        const res = await fetch(`/api/patients/${patientId}/evolutions/intake`);
        if (res.status === 404) {
          setData(null);
          setLoading(false);
          return;
        }
        const responseText = await res.text();
        try {
          const json = JSON.parse(responseText);
          if (!res.ok) throw new Error(json.error || 'Error');
          setData(json.data ?? json);
        } catch (parseErr) {
          console.warn('Non-JSON response when fetching intake – treating as missing.');
          setData(null);
        }
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    fetchIntake();
  }, [patientId]);

  if (loading) {
    return <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="animate-spin mr-2" /> Cargando entrevista…</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  if (!data) {
    const handleCreate = async () => {
      setError(null);
      setCreating(true);
      const defaultDraft = {
        malestarPaciente: "1",
        ayudaBuscada: [],
        ayudaBuscadaOtro: "",
        gravedadTerapeuta: "Ausencia",
        funcionamientoGlobal: "11",
        apoyoSocial: "1",
      };
      try {
        const res = await fetch(`/api/patients/${patientId}/evolutions/intake`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: defaultDraft }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Error al crear entrevista");
        location.reload();
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setCreating(false);
      }
    };

    return (
      <div className="p-4 text-center text-muted-foreground flex flex-col items-center space-y-4">
        <p>No hay entrevista inicial cargada.</p>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" /> Registrando…
            </>
          ) : (
            "Registrar nueva entrevista"
          )}
        </Button>
      </div>
    );
  }

  const formatDisplayValue = (key: string, value: unknown) => {
    if (value === null || typeof value === 'undefined') return '';

    const fieldDef = intakeFieldsDefinition.find(f => f.key === key);
    if (!fieldDef || !fieldDef.options || !Array.isArray(fieldDef.options)) {
      return String(value ?? '');
    }

    const options = fieldDef.options as { value: string; label: string }[];

    if (key === 'ayudaBuscada') {
      const values = (value as string[]) || [];
      const labels = values.map(v => {
        if (v === '7') {
          const otroText = (data as any)?.ayudaBuscadaOtro;
          return otroText ? `Otro: ${otroText}` : 'Otro';
        }
        const opt = options.find(o => o.value === v);
        return opt ? opt.label : v;
      });
      return labels.join(', ');
    }

    const opt = options.find(o => o.value === String(value));
    return opt ? `${opt.value} - ${opt.label}` : String(value);
  };

  // Helper to render key/value rows
  const Row = ({ label, value }: { label: string; value: unknown }) => (
    <div className="grid grid-cols-2 gap-2 py-1 text-sm">
      <div className="font-medium text-gray-700 dark:text-gray-300">{label}</div>
      <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{String(value ?? '')}</div>
    </div>
  );

  return (
    <Accordion type="multiple" defaultValue={["datos", "motivo", "formulacion", "evaluacion"]} className="w-full mt-4">
      {/* Paso 1: Datos */}
      <AccordionItem value="datos">
        <AccordionTrigger>Datos Sociodemográficos</AccordionTrigger>
        <AccordionContent>
          <Row label="Fecha entrevista" value={data.fechaEntrevista} />
          <Row label="Paciente" value={data.nombrePaciente} />
          <Row label="Edad" value={data.edad} />
          <Row label="Sexo" value={data.sexo} />
          <Row label="Estado civil" value={data.estadoCivil} />
          <Row label="Ocupación" value={data.ocupacion} />
          <Row label="Grupo familiar" value={data.grupoFamiliar} />
          <Row label="Convive con" value={data.conviveCon} />
        </AccordionContent>
      </AccordionItem>

      {/* Paso 2: Motivo */}
      <AccordionItem value="motivo">
        <AccordionTrigger>Motivo & Canal</AccordionTrigger>
        <AccordionContent>
          <Row label="Motivo consulta" value={data.motivoConsulta} />
          <Row label="Derivante" value={data.derivante} />
        </AccordionContent>
      </AccordionItem>

      {/* Paso 3: Formulación */}
      <AccordionItem value="formulacion">
        <AccordionTrigger>Formulación inicial</AccordionTrigger>
        <AccordionContent>
          <Row label="Presentación / relación" value={data.presentacion} />
          <Row label="Diagnóstico (texto)" value={data.diagnosticoTexto} />
          <Row label="Nivel personalidad" value={data.nivelPersonalidad} />
          <Row label="Etiología" value={data.etiologia} />
        </AccordionContent>
      </AccordionItem>

      {/* Paso 3: Estado Actual - Mapeado a la sección de Evaluación */}
      <AccordionItem value="evaluacion">
        <AccordionTrigger>Estado Actual</AccordionTrigger>
        <AccordionContent>
          <Row label="Nivel de malestar (paciente)" value={formatDisplayValue('malestarPaciente', (data as any).malestarPaciente)} />
          <Row label="Tipo de ayuda buscada" value={formatDisplayValue('ayudaBuscada', (data as any).ayudaBuscada)} />
          <Row label="Gravedad (terapeuta)" value={(data as any).gravedadTerapeuta} />
          <Row label="Funcionamiento global" value={formatDisplayValue('funcionamientoGlobal', (data as any).funcionamientoGlobal)} />
          <Row label="Apoyo social externo" value={formatDisplayValue('apoyoSocial', (data as any).apoyoSocial)} />
        </AccordionContent>
      </AccordionItem>

      {/* Paso 4: Antecedentes */}
      <AccordionItem value="antecedentes">
        <AccordionTrigger>Antecedentes Relevantes</AccordionTrigger>
        <AccordionContent>
          <Row label="Medicación previa" value={(data as any).medicacionPrev} />
          <Row label="Antecedentes personales/familiares SM" value={(data as any).antecedentesSM} />
          <Row label="Aspectos biológicos significativos" value={(data as any).biologicos} />
        </AccordionContent>
      </AccordionItem>

      {/* Paso 5: Tratamiento */}
      <AccordionItem value="tratamiento">
        <AccordionTrigger>Plan de Tratamiento</AccordionTrigger>
        <AccordionContent>
          <Row label="Estrategia terapéutica" value={(data as any).estrategia} />
          <Row label="Posición terapéutica" value={(data as any).posicionTerap} />
          <Row label="Derivación" value={(data as any).derivacion} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
