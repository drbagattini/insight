"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider, useWatch, Controller, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IntakeData, intakeDataSchema } from "@/lib/validation/intakeDataSchema";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import Icd11Autocomplete from "./Icd11Autocomplete";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IntakeWizard as WizardLayout, type Step } from "@/components/patients/intake/IntakeWizard";
import { useToast } from "@/components/providers/ToastProvider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Scale labels for numeric fields
const SCALE_LABELS = {
  malestar: { 1: "Muy bajo", 2: "Bajo", 3: "Medio", 4: "Alto", 5: "Muy alto" },
  gaf: { 
    1: "Extremadamente deteriorado (1)",
    2: "Muy deteriorado (2)", 
    3: "Deteriorado severo (3)",
    4: "Deteriorado moderado (4)",
    5: "Deteriorado leve (5)",
    6: "Funcionamiento limitado (6)",
    7: "Funcionamiento regular (7)", 
    8: "Funcionamiento bueno (8)",
    9: "Funcionamiento muy bueno (9)",
    10: "Funcionamiento óptimo (10)"
  },
  apoyo: { 1: "Inexistente", 2: "Bajo", 3: "Medio", 4: "Alto", 5: "Óptimo" }
};

const HELP_OPTIONS = ["Apoyo práctico", "Psicoterapia", "Medicación", "Apoyo social", "Otras"];

interface IntakeWizardEditorProps {
  patientId: string;
  onSaveSuccess?: () => void;
}

// Helper to compute urgente client-side (same logic as backend)
function computeUrgente(data: Partial<IntakeData>) {
  return (
    (data.gravedadTerapeuta === "Grave" || data.gravedadTerapeuta === "Extrema") &&
    (data.apoyoSocial ?? 3) <= 2
  );
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export default function IntakeWizardEditor({ patientId, onSaveSuccess }: IntakeWizardEditorProps) {
  const [published, setPublished] = useState(false);
  const [isCreatingInterview, setIsCreatingInterview] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // 1. Fetch existing draft/final
  const { data: fetched, isLoading, error } = useQuery<{ data?: IntakeData } | IntakeData>({
    queryKey: ["intake", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/evolutions/intake`, { cache: "no-store" });
      if (res.status === 404) return null;
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Fetch error - Initial Data:', errorText);
        throw new Error(`API Error: ${res.status} - ${errorText.substring(0,100)}`);
      }
      // Try to parse as JSON, but catch if it's not
      const responseText = await res.text();
      try {
        const json = JSON.parse(responseText);
        return json.data ?? json;
      } catch (e) {
        console.error('Failed to parse JSON response - Initial Data:', responseText);
        throw new Error('Invalid JSON response from server.');
      }
    },
  });

  // 2. Setup React Hook Form
  const methods = useForm<IntakeData>({
    resolver: zodResolver(intakeDataSchema as z.ZodType<any, any, any>),
    mode: "onChange",
    defaultValues: {
      fechaEntrevista: new Date().toISOString().split('T')[0],
      // Initialize other fields with their schema defaults or leave undefined
      // to be explicitly set by fetched data or user input.
      // Example: nombrePaciente: '', // if it should default to empty string
    } as Partial<IntakeData>,
  });

  // When fetched data or loading state changes, reset form accordingly
  useEffect(() => {
    if (isLoading) return; // Wait for loading to complete

    if (fetched && Object.keys(fetched).length > 0) {
      // Existing data, API might return { data: IntakeData } or just IntakeData
      const actualFetchedData = (fetched as any).data || fetched;
      methods.reset({
        ...actualFetchedData,
        fechaEntrevista: actualFetchedData.fechaEntrevista || new Date().toISOString().split('T')[0],
      });
    } else {
      // New intake or no data found, ensure fechaEntrevista is set to today
      // and other fields are reset to their initial default state from schema or defaultValues
      methods.reset({
        ...(methods.formState.defaultValues || {}), // Resets to initial defaultValues
        fechaEntrevista: new Date().toISOString().split('T')[0],
      });
    }
    if (fetched && (fetched as any).published) {
      setPublished(true);
    }
  }, [fetched, isLoading, methods]);

  // 3. Autosave mutation
  const saveMutation = useMutation({
    mutationFn: async (values: IntakeData) => {
      const method = fetched ? "PATCH" : "POST";
      const body: any = { data: values };
      const res = await fetch(`/api/patients/${patientId}/evolutions/intake`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Fetch error - Autosave:', errorText);
        throw new Error(`API Error during save: ${res.status} - ${errorText.substring(0,100)}`);
      }
      const responseText = await res.text();
      try {
        const json = JSON.parse(responseText);
        return json;
      } catch (e) {
        console.error('Failed to parse JSON response - Autosave:', responseText);
        throw new Error('Invalid JSON response from server during save.');
      }
    },
    onSuccess: () => {
      showToast("Cambios guardados", "success");
      queryClient.invalidateQueries({ queryKey: ["intake", patientId] });
      onSaveSuccess?.();
    },
    onError: (err: any) => {
      showToast(err?.message || "Error al guardar", "error");
    }
  });

  // Debounced autosave every 5s if form is dirty & valid
  const values = useWatch({ control: methods.control });
  const ayudaEsperadaWatch = useWatch({ control: methods.control, name: "ayudaEsperada" }) as string[] | undefined;
  const isValid = methods.formState.isValid;
  const isDirty = methods.formState.isDirty;
  useEffect(() => {
    if (!isDirty || !isValid) return;
    const timeout = setTimeout(() => {
      saveMutation.mutate({ ...(values as IntakeData), urgente: computeUrgente(values as IntakeData) });
    }, 5000);
    return () => clearTimeout(timeout);
  }, [values, isValid, isDirty]);

  // Publish mutation
  // Helper to validate and publish with scroll-to-error
  const handlePublish = async () => {
    console.log('🚀 handlePublish called');
    const isValidSubmission = await methods.trigger();
    console.log('✅ Validation result:', isValidSubmission);
    
    if (!isValidSubmission) {
      console.log('❌ Validation failed, errors:', methods.formState.errors);
      const firstErrorKey = Object.keys(methods.formState.errors)[0] as keyof IntakeData | undefined;
      if (firstErrorKey) {
        const el = document.querySelector<HTMLElement>(`[name="${firstErrorKey}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus({ preventScroll: true });
        }
      }
      return;
    }
    
    console.log('📡 Calling publishMutation.mutate()');
    publishMutation.mutate();
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      const currentValues = methods.getValues();
      const res = await fetch(`/api/patients/${patientId}/evolutions/intake`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: currentValues, publish: true }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Fetch error - Publish:', errorText);
        throw new Error(`API Error during publish: ${res.status} - ${errorText.substring(0,100)}`);
      }
      const responseText = await res.text();
      try {
        const json = JSON.parse(responseText);
        return json;
      } catch (e) {
        console.error('Failed to parse JSON response - Publish:', responseText);
        throw new Error('Invalid JSON response from server during publish.');
      }
    },
    onSuccess: () => {
      showToast("Entrevista publicada", "success");
      setPublished(true);
      queryClient.invalidateQueries({ queryKey: ["intake", patientId] });
      onSaveSuccess?.();
    },
    onError: (err: any) => {
      showToast(err?.message || "Error al publicar", "error");
    }
  });

  // Stepper state
  const [step, setStep] = useState("datosPersonales");
  const stepOrder = [
    "datosPersonales",
    "motivoDiagnostico",
    "evaluacionActual",
    "antecedentes",
    "planTerapeutico",
  ];
  const currentStepIndex = stepOrder.indexOf(step);

  const wizardSteps: Step[] = [
    { id: "datosPersonales", label: "Datos Personales", content: null }, 
    { id: "motivoDiagnostico", label: "Motivo de Consulta y Diagnóstico", content: null }, 
    { id: "evaluacionActual", label: "Evaluación del Estado Actual", content: null }, 
    { id: "antecedentes", label: "Antecedentes Personales y Familiares", content: null }, 
    { id: "planTerapeutico", label: "Plan Terapéutico", content: null }, 
  ];

  // Check if this is an empty/new intake - only show empty state if no data from server
  // An intake is considered empty ONLY if the fetch returned null (404).
  // If an object is returned, even if it's just a skeleton, it's not empty for the editor's purpose.
  const isEmpty = !fetched;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Cargando entrevista…
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 p-4">{(error as Error).message}</div>;
  }

  // Show empty state if no interview exists
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No hay entrevista inicial registrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Para comenzar el seguimiento clínico, es necesario registrar la primera entrevista inicial del paciente.
          </p>
          <Button 
            onClick={async () => {
              console.log('🆕 Registrar primera entrevista clicked');
              setIsCreatingInterview(true);
              try {
                // Initialize with current date and minimal required data
                const today = new Date().toISOString().split('T')[0];
                const initialData = {
                  fechaEntrevista: today,
                  nombrePaciente: '',
                  edad: 25,
                  sexo: 'Masculino' as const,
                  estadoCivil: 'Soltero/a',
                  ocupacion: 'Estudiante',
                  malestarPaciente: 1,
                  gravedadTerapeuta: 'Ausencia' as const,
                  gaf: 1,
                  apoyoSocial: 1,
                  posicionTerap: 1,
                };
                
                // Save the initial data to server
                console.log('📡 Saving initial data to server...');
                const res = await fetch(`/api/patients/${patientId}/evolutions/intake`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ data: initialData, publish: false }),
                });
                
                if (res.ok) {
                  console.log('✅ Initial data saved successfully');
                  // Invalidate and refetch the query
                  queryClient.invalidateQueries({ queryKey: ['intake', patientId] });
                  // Reset form with the new data
                  methods.reset(initialData);
                  setStep("datosPersonales");
                } else {
                  console.error('❌ Failed to save initial data:', await res.text());
                }
              } catch (error) {
                console.error('❌ Error creating interview:', error);
              } finally {
                setIsCreatingInterview(false);
              }
            }}
            className="bg-primary hover:bg-primary/90"
            disabled={isCreatingInterview}
          >
            {isCreatingInterview ? <Loader2 className="animate-spin mr-2" /> : null}
            Registrar primera entrevista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()}>
        <fieldset disabled={published} className="space-y-4">
        {/* Stepper indicator */}
        <WizardLayout steps={wizardSteps} value={step} onValueChange={setStep} showList={true} />
        {/* Step content */}
        {/* Urgencia banner */}
        <UrgenciaBanner />

        {step === "datosPersonales" && (
          <section className="grid sm:grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 py-2">
            <FormField name="fechaEntrevista" label="Fecha de la entrevista" type="date" readOnly />
            <FormField name="nombrePaciente" label="Nombre y apellido del paciente" />
            <FormField name="edad" label="Edad" asSelect required valueAsNumber={true} options={Array.from({ length: 121 }, (_, i) => ({ value: i, label: i.toString() }))} />
            <FormField name="sexo" label="Sexo" asSelect required options={['Masculino', 'Femenino', 'Otro']} />
            <FormField name="estadoCivil" label="Estado civil" asSelect options={['Soltero/a', 'Casado/a', 'Concubinato estable']} />
            <FormField name="ocupacion" label="Ocupación" asSelect options={['Estudiante', 'Trabajo dependiente', 'Trabajo independiente', 'Desempleado', 'Otra']} />
            <div className="md:col-span-2">
              <FormField name="grupoFamiliar" label="Conformación del grupo familiar" asTextArea />
            </div>
            <div className="md:col-span-2">
              <FormField name="conviveCon" label="Convive con" asTextArea />
            </div>
          </section>
        )}
        {step === "motivoDiagnostico" && (
          <>
            {/* Section 1: Fields 9 (Motivo de consulta) & 10 (¿Quién lo deriva?) */}
            <section className="grid sm:grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 py-2">
              <div className="md:col-span-2">
                <FormField name="motivoConsulta" label="Motivo de consulta" asTextArea />
              </div>
              <FormField name="derivante" label="¿Quién lo deriva?" asSelect options={['Psiquiatra', 'Pediatra', 'Familia', 'Asistente social', 'Consulta espontánea']} />
            </section>

            {/* Section 2: Fields 11 (Presentación), 12 (Diagnóstico), 13 (Nivel Personalidad), 14 (Etiología) */}
            <section className="grid sm:grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 py-2">
              <div className="md:col-span-2">
                <FormField name="presentacion" label="Presentación y forma de relacionarse" asTextArea />
              </div>
              <div className="md:col-span-2">
                <FormField name="diagnosticoTexto" label="¿Qué le sucede al paciente? (diagnóstico)" asTextArea />
              </div>
              <div className="md:col-span-2">
                <Controller
                  name="diagnosticoCodigo"
                  control={methods.control}
                  render={({ field }) => (
                    <Icd11Autocomplete
                      label="Diagnóstico ICD-11"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
              <FormField name="nivelPersonalidad" label="Nivel de funcionamiento de la personalidad" asSelect options={['Saludable', 'Neurótico', 'Borderline', 'Psicótico']} />
              <div className="md:col-span-2">
                <FormField name="etiologia" label="Causas del problema (etiología)" asTextArea />
              </div>
            </section>
          </>
        )}
        {step === "evaluacionActual" && (
          <section className="grid sm:grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 py-2">
            <FormField 
              name="malestarPaciente" 
              label="Nivel de malestar percibido por el paciente" 
              asSelect 
              valueAsNumber={true} 
              options={Object.entries(SCALE_LABELS.malestar).map(([value, label]) => ({
                value: parseInt(value), 
                label: `${value} - ${label}`
              }))} 
            />
            <FormField name="gravedadTerapeuta" label="Gravedad percibida por el terapeuta" asSelect options={["Ausencia", "Leve", "Moderada", "Grave", "Extrema"]} />
            <FormField 
              name="gaf" 
              label="Funcionamiento global del paciente" 
              asSelect 
              valueAsNumber={true} 
              options={Object.entries(SCALE_LABELS.gaf).map(([value, label]) => ({
                value: parseInt(value), 
                label: `${value} - ${label}`
              }))} 
            />
            <FormField 
              name="apoyoSocial" 
              label="Apoyo social / externo" 
              asSelect 
              valueAsNumber={true} 
              options={Object.entries(SCALE_LABELS.apoyo).map(([value, label]) => ({
                value: parseInt(value), 
                label: `${value} - ${label}`
              }))} 
            />

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1">Tipo de Ayuda Esperada</label>
              <Controller
                name="ayudaEsperada"
                control={methods.control}
                render={({ field }) => (
                  <ChipsMultiSelect
                    options={HELP_OPTIONS}
                    value={field.value ?? []}
                    onChange={(selectedOptions) => {
                      field.onChange(selectedOptions);
                      // Ensure 'ayudaOtros' is cleared if 'Otras' is not selected
                      if (!selectedOptions.includes('Otras')) {
                        methods.setValue('ayudaOtros', '', { shouldDirty: true });
                      }
                    }}
                  />
                )}
              />
            </div>
            {(ayudaEsperadaWatch ?? []).includes("Otras") && (
              <div className="md:col-span-2">
                <FormField name="ayudaOtros" label="Otros (especificar)" asTextArea />
              </div>
            )}
          </section>
        )}
        {step === "antecedentes" && (
          <section className="grid sm:grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 py-2">
            
            <div className="md:col-span-2">
              <FormField name="antecedentesSM" label="Antecedentes personales de salud mental" asTextArea />
            </div>
            <div className="md:col-span-2">
              <FormField name="biologicos" label="Antecedentes familiares de salud mental" asTextArea />
            </div>
            <div className="md:col-span-2">
              <FormField name="medicacionPrev" label="Medicación previa" asTextArea />
            </div>
            <div className="md:col-span-2">
              <FormField name="duracionTratPrevio" label="Antecedentes biológicos personales" asTextArea />
            </div>
          </section>
        )}
        {step === "planTerapeutico" && (
          <section className="grid sm:grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 py-2">
            <div className="md:col-span-2">
              <FormField name="estrategia" label="Estrategia terapéutica" asTextArea />
            </div>
            <FormField 
              name="posicionTerap" 
              label="Posición terapéutica predominante" 
              asSelect 
              valueAsNumber={true}
              options={[
                { value: 1, label: "Predominantemente interpretativa" },
                { value: 2, label: "Mixta" }, 
                { value: 3, label: "Predominantemente de apoyo" },
                { value: 4, label: "De apoyo" }
              ]} 
            />
            <div className="md:col-span-2">
              <UrgenciaBadge />
            </div>
          </section>
        )}
        <div className="flex items-center space-x-4 pt-4">
          {!published && currentStepIndex > 0 && (
            <Button
              variant="outline"
              type="button"
              onClick={() => setStep(stepOrder[currentStepIndex - 1])}
            >
              Anterior
            </Button>
          )}
          {!published && currentStepIndex < stepOrder.length - 1 && (
            <Button type="button" onClick={() => setStep(stepOrder[currentStepIndex + 1])}>
              Siguiente
            </Button>
          )}
          {!published && currentStepIndex === stepOrder.length - 1 && (
            <Button onClick={handlePublish} disabled={publishMutation.isPending} type="button">
              {publishMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
              PUBLICAR
            </Button>
          )}
          {saveMutation.isPending && <span className="text-sm text-muted-foreground">Guardando…</span>}
        </div>
      </fieldset>
      </form>
    </FormProvider>
  );
}

interface FormFieldProps {
  name: keyof IntakeData;
  label: string;
  type?: string;
  asTextArea?: boolean;
  asSelect?: boolean;
  required?: boolean;
  readOnly?: boolean;
  /**
   * Options for select fields. Can be provided as:
   *  - array of primitives (string | number) → value & label derived automatically
   *  - array of objects  { value, label }
   */
  options?: Array<string | number | { value: string | number; label: string }>;
  valueAsNumber?: boolean;
}

function FormField({ name, label, type = "text", asTextArea, asSelect, required, readOnly, options, valueAsNumber }: FormFieldProps) {
  const { register, formState, control } = useFormContext<IntakeData>();
  const error = formState.errors?.[name]?.message as string | undefined;
  const errorId = error ? `${String(name)}-error` : undefined;

  const scaleLabels = SCALE_LABELS[name as keyof typeof SCALE_LABELS];

  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium mb-1" htmlFor={String(name)}>
        {label}
      </label>
      {asTextArea ? (
        <textarea
          readOnly={readOnly}
          disabled={readOnly}
          id={String(name)}
          {...register(name)}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={`w-full border-2 border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 h-32 text-sm bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors ${error ? 'border-red-500' : ''} ${readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''}`}
        />
      ) : asSelect && options ? (
        <select
          disabled={readOnly}
          id={String(name)}
          {...register(name, { valueAsNumber: valueAsNumber ? true : undefined })}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={`w-full border-2 border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors ${error ? 'border-red-500' : ''} ${readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''}`}
        >
          {required ? null : <option value="">Seleccione…</option>}
          {options.map((opt) => {
            const isPrimitive = typeof opt === 'string' || typeof opt === 'number';
            const value = isPrimitive ? opt : (opt as { value: string | number }).value;
            const label = isPrimitive ? String(opt) : (opt as { label: string }).label;
            return (
              <option key={String(value)} value={value}>
                {label}
              </option>
            );
          })}
        </select>
      ) : type === "range" ? (
        <div className="flex flex-col">
          <input
            type="range"
            min={1}
            max={scaleLabels ? Object.keys(scaleLabels).length : 10}
            step={1}
            {...register(name, { valueAsNumber: true })}
            aria-invalid={!!error}
            aria-describedby={errorId}
            className="flex-grow"
          />
          <span className="text-sm font-medium tabular-nums w-10 text-center flex-shrink-0">
            {scaleLabels && control._formValues[name] 
              ? scaleLabels[control._formValues[name] as keyof typeof scaleLabels] || control._formValues[name]
              : control._formValues[name] || 1}
          </span>
        </div>
      ) : (
        <Input
          readOnly={readOnly}
          disabled={readOnly}
          id={String(name)}
          type={type}
          {...register(name)}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={`w-full border-2 border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors ${error ? 'border-red-500' : ''} ${readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''}`}
        />
      )}
      {error && <span id={errorId} className="text-xs text-red-600 mt-1">{error}</span>}
    </div>
  );
}

function UrgenciaBanner() {
  const values = useWatch<IntakeData>();
  const urgente = computeUrgente(values ?? {});
  if (!urgente) return null;
  return (
    <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded mb-4" role="status">
      <AlertTriangle className="w-4 h-4" />
      <span className="text-sm font-semibold">ESTA ENTREVISTA HA SIDO MARCADA COMO URGENTE</span>
    </div>
  );
}

function UrgenciaBadge() {
  const values = useWatch<IntakeData>();
  if (!values) return null;
  const urgente = computeUrgente(values);
  if (!urgente) return null; // Solo mostrar si es urgente
  return (
    <div className="col-span-2 mt-2">
      <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500 text-white">
        Urgente
      </span>
    </div>
  );
}

// Simple chips multi-select component
function ChipsMultiSelect({ options, value, onChange }: { options: string[]; value: string[]; onChange: (val: string[]) => void }) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt);
        return (
          <button
            type="button"
            key={opt}
            onClick={() => toggle(opt)}
            aria-pressed={selected}
            className={`px-3 py-1 rounded-full text-sm border ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-800'}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
