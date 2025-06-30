"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider, useWatch, Controller, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { intakeDataSchema, type IntakeFormValues } from '@/lib/validation/intakeDataSchema';
import { z } from "zod";

import { Input } from "@/components/ui/input";
import Icd11Autocomplete from "./Icd11Autocomplete";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { useIntake } from "@/app/hooks/useIntake";
import { useQueryClient } from "@tanstack/react-query";
import { WizardLayout, type Step } from "@/components/ui/wizard-layout";
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
function computeUrgente(data: Partial<IntakeFormValues>) {
  return (
    (data.gravedadTerapeuta === "Grave" || data.gravedadTerapeuta === "Extrema") &&
    (data.apoyoSocial ?? 3) <= 2
  );
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export default function IntakeWizardEditor({ patientId, onSaveSuccess }: IntakeWizardEditorProps) {
  const { showToast } = useToast();
  const {
    intakeData,
    isLoading,
    isUpdating,
    error,
    updateIntake,
    createIntake,
  } = useIntake(patientId);

  const [isPublishing, setIsPublishing] = useState(false);
  const published = intakeData?.status === 'final';

  const defaultIntakeValues: IntakeFormValues = {
    nombrePaciente: '',
    edad: 0,
    sexo: 'Masculino',
    estadoCivil: '',
    ocupacion: '',
    motivoConsulta: '',
    descripcionProblematica: '',
    objetivosTerapia: '',
    historiaClinica: '',
    tratamientosPrevios: '',
    historiaFamiliar: '',
    malestarPaciente: 1,
    gravedadTerapeuta: 'Ausencia',
    gaf: 1,
    apoyoSocial: 1,
    diagnosticoPresuntivo: '',
    conceptualizacionCaso: '',
    tipoAyuda: [],
    frecuenciaSesiones: 'Semanal',
    modalidadTerapia: 'Individual',
    posicionTerap: null,
    observaciones: '',
    // Inicializar fechaEntrevista con la fecha actual como Date
    fechaEntrevista: new Date(),
    grupoFamiliar: '',
    conviveCon: '',
    derivante: '',
    presentacion: '',
    diagnosticoTexto: '',
    diagnosticoCodigo: '',
    nivelPersonalidad: '',
    etiologia: '',
    atribucionPaciente: '',
    ayudaEsperada: [],
    ayudaOtros: '',
    duracionTratPrevio: '',
    medicacionPrev: '',
    antecedentesSM: '',
    biologicos: '',
    estrategia: '',
    urgente: false,
  };

  const methods = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeDataSchema),
    mode: 'onChange',
    defaultValues: defaultIntakeValues,
  });

  // Función para normalizar los valores de enums y selects
  const normalizeEnumValues = (data: any): IntakeFormValues => {
    const normalized = { ...data };

    // Normalizar valores de enums - convertir strings vacíos a undefined o valor por defecto
    // Sexo
    if (normalized.sexo === '') {
      normalized.sexo = defaultIntakeValues.sexo;
    } else if (normalized.sexo && !['Masculino', 'Femenino', 'Otro'].includes(normalized.sexo)) {
      normalized.sexo = defaultIntakeValues.sexo;
    }

    // Estado civil
    if (normalized.estadoCivil === '') {
      normalized.estadoCivil = undefined;
    } else if (normalized.estadoCivil && !['Soltero/a', 'Casado/a', 'Concubinato estable'].includes(normalized.estadoCivil)) {
      normalized.estadoCivil = undefined;
    }

    // Ocupación
    if (normalized.ocupacion === '') {
      normalized.ocupacion = undefined;
    } else if (normalized.ocupacion && !['Estudiante', 'Trabajo dependiente', 'Trabajo independiente', 'Desempleado', 'Otra'].includes(normalized.ocupacion)) {
      normalized.ocupacion = undefined;
    }
    
    // Gravedad terapeuta
    if (normalized.gravedadTerapeuta === '') {
      normalized.gravedadTerapeuta = defaultIntakeValues.gravedadTerapeuta;
    } else if (normalized.gravedadTerapeuta && !['Ausencia', 'Leve', 'Moderada', 'Grave', 'Extrema'].includes(normalized.gravedadTerapeuta)) {
      normalized.gravedadTerapeuta = defaultIntakeValues.gravedadTerapeuta;
    }

    // Nivel personalidad
    if (normalized.nivelPersonalidad === '') {
      normalized.nivelPersonalidad = undefined;
    } else if (normalized.nivelPersonalidad && !['Saludable', 'Neurótico', 'Borderline', 'Psicótico'].includes(normalized.nivelPersonalidad)) {
      normalized.nivelPersonalidad = undefined;
    }

    // Frecuencia sesiones
    if (normalized.frecuenciaSesiones === '') {
      normalized.frecuenciaSesiones = defaultIntakeValues.frecuenciaSesiones;
    } else if (normalized.frecuenciaSesiones && !['Semanal', 'Quincenal', 'Mensual'].includes(normalized.frecuenciaSesiones)) {
      normalized.frecuenciaSesiones = defaultIntakeValues.frecuenciaSesiones;
    }

    // Modalidad terapia
    if (normalized.modalidadTerapia === '') {
      normalized.modalidadTerapia = defaultIntakeValues.modalidadTerapia;
    } else if (normalized.modalidadTerapia && !['Individual', 'Pareja', 'Familiar'].includes(normalized.modalidadTerapia)) {
      normalized.modalidadTerapia = defaultIntakeValues.modalidadTerapia;
    }

    // Derivación
    if (normalized.derivacion === '') {
      normalized.derivacion = undefined;
    } else if (normalized.derivacion && !['Sin derivaciones', 'Psiquiatra', 'Asistente social', 'Psicopedagogo', 'Pediatra', 'Neuropediatra'].includes(normalized.derivacion)) {
      normalized.derivacion = undefined;
    }

    // Asegurar que los valores numéricos sean realmente números
    if (typeof normalized.edad === 'string') {
      normalized.edad = parseInt(normalized.edad, 10) || defaultIntakeValues.edad;
    }

    if (typeof normalized.malestarPaciente === 'string') {
      normalized.malestarPaciente = parseInt(normalized.malestarPaciente, 10) || defaultIntakeValues.malestarPaciente;
    }

    if (typeof normalized.gaf === 'string') {
      normalized.gaf = parseInt(normalized.gaf, 10) || defaultIntakeValues.gaf;
    }

    if (typeof normalized.apoyoSocial === 'string') {
      normalized.apoyoSocial = parseInt(normalized.apoyoSocial, 10) || defaultIntakeValues.apoyoSocial;
    }

    if (typeof normalized.posicionTerap === 'string' && normalized.posicionTerap.trim() === '') {
      normalized.posicionTerap = null;
    } else if (typeof normalized.posicionTerap === 'string') {
      const parsed = parseInt(normalized.posicionTerap, 10);
      normalized.posicionTerap = !isNaN(parsed) ? parsed : null;
    }

    // Asegurar que los arrays sean realmente arrays
    if (!Array.isArray(normalized.tipoAyuda)) {
      normalized.tipoAyuda = normalized.tipoAyuda ? [String(normalized.tipoAyuda)] : [];
    }

    if (!Array.isArray(normalized.ayudaEsperada)) {
      normalized.ayudaEsperada = normalized.ayudaEsperada ? [String(normalized.ayudaEsperada)] : [];
    }

    return normalized as IntakeFormValues;
  };

  // Sync form with fetched data con normalización de valores
  useEffect(() => {
    // Si intakeData existe y methods está listo, actualizar el formulario
    if (intakeData && methods) {
      const mergedData = { ...defaultIntakeValues, ...intakeData.data };
      
      // Si fechaEntrevista existe y es un string, convertirlo a Date
      if (mergedData.fechaEntrevista && typeof mergedData.fechaEntrevista === 'string') {
        try {
          const parsedDate = new Date(mergedData.fechaEntrevista);
          if (!isNaN(parsedDate.getTime())) {
            mergedData.fechaEntrevista = parsedDate;
          } else {
            // Si la fecha no es válida, usar la fecha actual
            mergedData.fechaEntrevista = new Date();
          }
        } catch (e) {
          // Si hay error al parsear, usar la fecha actual
          mergedData.fechaEntrevista = new Date();
        }
      } else if (!mergedData.fechaEntrevista) {
        // Si no hay fecha, usar la fecha actual
        mergedData.fechaEntrevista = new Date();
      }

      // Normalizar los valores de enums y selects
      const normalized = normalizeEnumValues(mergedData);
      methods.reset(normalized);
    }
  }, [intakeData, methods]);

  // Preparar los datos antes de enviarlos a la API - versión minimalista
  const prepareDataForApi = (data: Partial<IntakeFormValues>): Partial<IntakeFormValues> => {
    // Crear un objeto nuevo completamente limpio
    const apiData: Partial<IntakeFormValues> = {};
    
    // Extraer solo los campos que sabemos que no dan problemas
    // Datos personales
    apiData.nombrePaciente = data.nombrePaciente || '';
    apiData.edad = data.edad || 0;
    apiData.sexo = data.sexo || 'Masculino';
    apiData.estadoCivil = data.estadoCivil || '';
    apiData.ocupacion = data.ocupacion || '';
    
    // Motivo de consulta
    apiData.motivoConsulta = data.motivoConsulta || '';
    apiData.descripcionProblematica = data.descripcionProblematica || '';
    apiData.objetivosTerapia = data.objetivosTerapia || '';
    
    // Historia clínica
    apiData.historiaClinica = data.historiaClinica || '';
    apiData.tratamientosPrevios = data.tratamientosPrevios || '';
    apiData.historiaFamiliar = data.historiaFamiliar || '';
    
    // Evaluación
    apiData.malestarPaciente = data.malestarPaciente || 1;
    apiData.gravedadTerapeuta = data.gravedadTerapeuta || 'Ausencia';
    apiData.gaf = data.gaf || 1;
    apiData.apoyoSocial = data.apoyoSocial || 1;
    apiData.diagnosticoPresuntivo = data.diagnosticoPresuntivo || '';
    apiData.conceptualizacionCaso = data.conceptualizacionCaso || '';
    
    // Plan
    apiData.tipoAyuda = data.tipoAyuda || [];
    apiData.frecuenciaSesiones = data.frecuenciaSesiones || 'Semanal';
    apiData.modalidadTerapia = data.modalidadTerapia || 'Individual';
    apiData.posicionTerap = data.posicionTerap === null ? null : (data.posicionTerap || 1);
    apiData.observaciones = data.observaciones || '';
    
    // Siempre usar una fecha actual nueva
    apiData.fechaEntrevista = new Date();
    
    // Campos adicionales
    apiData.grupoFamiliar = data.grupoFamiliar || '';
    apiData.conviveCon = data.conviveCon || '';
    apiData.derivante = data.derivante || '';
    apiData.presentacion = data.presentacion || '';
    apiData.diagnosticoTexto = data.diagnosticoTexto || '';
    apiData.diagnosticoCodigo = data.diagnosticoCodigo || '';
    apiData.nivelPersonalidad = data.nivelPersonalidad || '';
    apiData.etiologia = data.etiologia || '';
    apiData.atribucionPaciente = data.atribucionPaciente || '';
    apiData.ayudaEsperada = data.ayudaEsperada || [];
    apiData.ayudaOtros = data.ayudaOtros || '';
    apiData.duracionTratPrevio = data.duracionTratPrevio || '';
    apiData.medicacionPrev = data.medicacionPrev || '';
    apiData.antecedentesSM = data.antecedentesSM || '';
    apiData.biologicos = data.biologicos || '';
    apiData.estrategia = data.estrategia || '';
    apiData.urgente = !!data.urgente;
    
    console.log('Datos preparados para API:', apiData);
    return apiData;
  };
  
  // Función auxiliar para verificar si un valor es una fecha válida
  const isValidDate = (value: any): boolean => {
    return value instanceof Date && !isNaN(value.getTime());
  };

  const handleSave = async (data: Partial<IntakeFormValues>, publish = false) => {
    try {
      // Preparar los datos antes de enviar a la API
      const preparedData = prepareDataForApi(data);
      
      // Para debugging detallado
      console.log('Datos antes de preparar:', JSON.stringify(data));
      console.log('Datos a enviar a la API:', JSON.stringify(preparedData));
      console.log('Tipo de fechaEntrevista:', preparedData.fechaEntrevista instanceof Date ? 'Date' : typeof preparedData.fechaEntrevista);
      
      // IMPORTANTE: La API espera la estructura { data: updateData, publish }
      // Esto es manejado internamente por updateIntake, solo pasamos los datos preparados
      await updateIntake({ updateData: preparedData, publish });
      showToast(publish ? 'Entrevista publicada' : 'Cambios guardados', 'success');
      if (publish && onSaveSuccess) onSaveSuccess();
    } catch (e: any) {
      console.error('Error al guardar:', e);
      console.error('Datos que causaron el error:', JSON.stringify(data));
      // Mostrar detalles específicos del error de validación si existen
      if (e.response?.data?.details) {
        console.error('Detalles de validación:', e.response.data.details);
      }
      showToast(e?.response?.data?.error || e.message || 'Error al guardar', 'error');
    }
  };

  const handlePublish = async () => {
    const isValid = await methods.trigger();
    if (!isValid) {
      showToast('Por favor, revisa los campos con errores.', 'error');
      return;
    }
    setIsPublishing(true);
    await handleSave(methods.getValues(), true);
    setIsPublishing(false);
  };

  // Autosave logic
  const watchedValues = useWatch({ control: methods.control });
  useEffect(() => {
    const { isDirty, isValid } = methods.formState;
    if (isDirty && isValid && !isUpdating) {
      const timer = setTimeout(() => {
        handleSave(watchedValues);
      }, 3000); // 3-second debounce
      return () => clearTimeout(timer);
    }
  }, [watchedValues, methods.formState.isDirty, methods.formState.isValid, isUpdating]);

  // Stepper state con persistencia mejorada
  const [step, setStep] = useState("datosPersonales");
  const stepOrder = [
    "datosPersonales",
    "motivoDiagnostico",
    "evaluacionActual",
    "antecedentes",
    "planTerapeutico",
  ];
  const currentStepIndex = stepOrder.indexOf(step);

  // Mapeo de campos por pestaña para validación
  const fieldsByStep: Record<string, Array<keyof IntakeFormValues>> = {
    datosPersonales: ['nombrePaciente', 'edad', 'sexo', 'estadoCivil', 'ocupacion', 'grupoFamiliar', 'conviveCon'],
    motivoDiagnostico: ['motivoConsulta', 'derivante', 'presentacion', 'diagnosticoTexto', 'diagnosticoCodigo', 'nivelPersonalidad', 'etiologia'],
    evaluacionActual: ['malestarPaciente', 'gravedadTerapeuta', 'gaf', 'apoyoSocial', 'atribucionPaciente'],
    antecedentes: ['medicacionPrev', 'antecedentesSM', 'biologicos'],
    planTerapeutico: ['tipoAyuda', 'frecuenciaSesiones', 'modalidadTerapia', 'posicionTerap', 'estrategia', 'observaciones'],
  };

  // Gestor de cambio de paso con persistencia
  const handleStepChange = async (newStep: string) => {
    if (newStep === step) return; // No hacer nada si es la misma pestaña
    
    // Obtener y guardar los datos actuales antes de cambiar de pestaña
    const currentData = methods.getValues();
    
    // Validar solo los campos de la pestaña actual para permitir navegación
    // incluso si hay errores en otras pestañas
    const fieldsToValidate = fieldsByStep[step] || [];
    
    const isStepValid = await methods.trigger(fieldsToValidate as any);
    
    if (!isStepValid) {
      showToast('Por favor, corrija los errores en esta pestaña antes de continuar', 'error');
      return;
    }

    // Guardar progreso actual al cambiar de pestaña
    if (methods.formState.isDirty) {
      await handleSave(currentData);
    }
    
    // Cambiar de pestaña
    setStep(newStep);
  };

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
  const isEmpty = !intakeData;
  
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
              try {
                await createIntake();
                showToast("Entrevista creada. Ya puede cargar los datos.", "success");
              } catch (e: any) {
                showToast(e.message || "Error al crear la entrevista", "error");
              }
            }}
            className="bg-primary hover:bg-primary/90"
            disabled={isUpdating}
          >
            {isUpdating ? <Loader2 className="animate-spin mr-2" /> : null}
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
        {/* Stepper indicator con manejo de cambio mejorado para persistencia */}
        <WizardLayout steps={wizardSteps} value={step} onValueChange={handleStepChange} showList={true} />
        {/* Step content */}
        {/* Urgencia banner */}
        <UrgenciaBanner />

        {step === "datosPersonales" && (
          <section className="grid sm:grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 py-2">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1" htmlFor="fechaEntrevista">Fecha de la entrevista</label>
              {/* Campo de fecha con Controller para manejo adecuado */}
              {/* Campo de fecha con Controller para mantener correctamente el valor como Date */}
              <Controller
                name="fechaEntrevista"
                control={methods.control}
                render={({ field }) => {
                  // Asegurar que field.value sea una fecha válida
                  let currentDate: Date;
                  
                  if (field.value instanceof Date && !isNaN(field.value.getTime())) {
                    currentDate = field.value;
                  } else {
                    currentDate = new Date();
                    // Actualizar el valor en el formulario
                    field.onChange(currentDate);
                  }
                  
                  // Formatear para mostrar en UI
                  const formattedDate = currentDate.toISOString().split('T')[0];
                  
                  return (
                    <Input
                      id="fechaEntrevista"
                      type="text"
                      value={formattedDate}
                      onChange={() => {}} // No permitir cambios directos
                      readOnly
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-700"
                    />
                  );
                }}
              />
            </div>
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
            {(methods.watch('ayudaEsperada') ?? []).includes("Otras") && (
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
            <Button onClick={handlePublish} disabled={isPublishing} type="button">
              {isPublishing ? <Loader2 className="animate-spin mr-2" /> : null}
              PUBLICAR
            </Button>
          )}
          {isUpdating && !isPublishing && <span className="text-sm text-muted-foreground">Guardando…</span>}
        </div>
      </fieldset>
      </form>
    </FormProvider>
  );
}

interface FormFieldProps {
  name: keyof IntakeFormValues;
  label: string;
  type?: string;
  asTextArea?: boolean;
  asSelect?: boolean;
  required?: boolean;
  readOnly?: boolean;
  options?: Array<string | number | { value: string | number; label: string }>;
  value?: string | number;
  valueAsNumber?: boolean;
}

function FormField({ name, label, type = "text", asTextArea, asSelect, required, readOnly, options, value, valueAsNumber }: FormFieldProps) {
  const { register, formState, control } = useFormContext<IntakeFormValues>();
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
  const values = useWatch<IntakeFormValues>();
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
  const values = useWatch<IntakeFormValues>();
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
