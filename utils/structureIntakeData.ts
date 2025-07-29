/**
 * Utilidad para estructurar los datos de la entrevista inicial
 * de forma organizada para GPT-4o
 */

interface IntakeData {
  [key: string]: any;
}

interface StructuredIntake {
  metadata: {
    id: string;
    estado: string;
    fecha_inicio: string;
    fecha_fin: string;
    created_at: string;
  };
  secciones: {
    datos_demograficos: {
      titulo: string;
      descripcion: string;
      campos: { [key: string]: any };
    };
    motivo_consulta: {
      titulo: string;
      descripcion: string;
      campos: { [key: string]: any };
    };
    historia_clinica: {
      titulo: string;
      descripcion: string;
      campos: { [key: string]: any };
    };
    evaluacion_inicial: {
      titulo: string;
      descripcion: string;
      campos: { [key: string]: any };
    };
    contexto_familiar: {
      titulo: string;
      descripcion: string;
      campos: { [key: string]: any };
    };
    plan_terapeutico: {
      titulo: string;
      descripcion: string;
      campos: { [key: string]: any };
    };
    otros_datos: {
      titulo: string;
      descripcion: string;
      campos: { [key: string]: any };
    };
  };
}

export function structureIntakeData(intakeData: any): StructuredIntake | null {
  if (!intakeData || !intakeData.datos) {
    return null;
  }

  const datos = intakeData.datos;
  
  // Mapeo de campos a secciones
  const fieldMapping = {
    datos_demograficos: [
      'nombrePaciente', 'edad', 'sexo', 'estadoCivil', 'ocupacion', 'fechaEntrevista'
    ],
    motivo_consulta: [
      'motivoConsulta', 'malestarPaciente', 'ayudaBuscada', 'derivacion'
    ],
    historia_clinica: [
      'antecedentesSM', 'biologicos', 'medicacionPrev', 'diagnosticoTexto', 'etiologia'
    ],
    evaluacion_inicial: [
      'gravedadTerapeuta', 'nivelPersonalidad', 'funcionamientoGlobal', 
      'posicionTerap', 'atribucionPaciente'
    ],
    contexto_familiar: [
      'grupoFamiliar', 'apoyoSocial'
    ],
    plan_terapeutico: [
      'estrategia'
    ]
  };

  const structured: StructuredIntake = {
    metadata: {
      id: intakeData.id,
      estado: intakeData.estado,
      fecha_inicio: intakeData.fecha_inicio,
      fecha_fin: intakeData.fecha_fin,
      created_at: intakeData.created_at
    },
    secciones: {
      datos_demograficos: {
        titulo: "Datos Demográficos",
        descripcion: "Información básica del paciente",
        campos: {}
      },
      motivo_consulta: {
        titulo: "Motivo de Consulta",
        descripcion: "Razón de la consulta y malestar actual",
        campos: {}
      },
      historia_clinica: {
        titulo: "Historia Clínica",
        descripcion: "Antecedentes médicos y psiquiátricos",
        campos: {}
      },
      evaluacion_inicial: {
        titulo: "Evaluación Inicial",
        descripcion: "Impresión diagnóstica y evaluación clínica",
        campos: {}
      },
      contexto_familiar: {
        titulo: "Contexto Familiar y Social",
        descripcion: "Información sobre el entorno del paciente",
        campos: {}
      },
      plan_terapeutico: {
        titulo: "Plan Terapéutico",
        descripcion: "Estrategia de tratamiento propuesta",
        campos: {}
      },
      otros_datos: {
        titulo: "Otros Datos",
        descripcion: "Información adicional relevante",
        campos: {}
      }
    }
  };

  // Asignar campos a sus secciones correspondientes
  Object.entries(fieldMapping).forEach(([section, fields]) => {
    fields.forEach(field => {
      if (datos[field] !== undefined) {
        structured.secciones[section as keyof typeof structured.secciones].campos[field] = datos[field];
      }
    });
  });

  // Asignar campos no mapeados a "otros_datos"
  const allMappedFields = Object.values(fieldMapping).flat();
  Object.entries(datos).forEach(([key, value]) => {
    if (!allMappedFields.includes(key)) {
      structured.secciones.otros_datos.campos[key] = value;
    }
  });

  return structured;
}

// Función para crear un resumen textual desde datos raw
export function createIntakeSummaryFromRaw(rawData: any): string {
  if (!rawData) return '';

  let summary = '# ENTREVISTA INICIAL\n\n';
  
  // Datos básicos
  if (rawData.nombrePaciente) summary += `**Paciente:** ${rawData.nombrePaciente}\n`;
  if (rawData.edad) summary += `**Edad:** ${rawData.edad}\n`;
  if (rawData.sexo) summary += `**Sexo:** ${rawData.sexo}\n\n`;
  
  // Motivo de consulta
  if (rawData.motivoConsulta) {
    summary += `## Motivo de Consulta\n${rawData.motivoConsulta}\n\n`;
  }
  
  // Diagnóstico
  if (rawData.diagnosticoTexto) {
    summary += `## Diagnóstico\n${rawData.diagnosticoTexto}\n\n`;
  }
  
  // Antecedentes
  if (rawData.antecedentesSM) {
    summary += `## Antecedentes de Salud Mental\n${rawData.antecedentesSM}\n\n`;
  }
  
  // Grupo familiar
  if (rawData.grupoFamiliar) {
    summary += `## Grupo Familiar\n${rawData.grupoFamiliar}\n\n`;
  }
  
  return summary;
}

// Función para crear un resumen textual estructurado para GPT-4o
export function createIntakeSummary(structuredIntake: StructuredIntake): string {
  if (!structuredIntake) return '';

  let summary = '# ENTREVISTA INICIAL ESTRUCTURADA\n\n';
  
  summary += `**Estado:** ${structuredIntake.metadata.estado}\n`;
  summary += `**Fecha:** ${structuredIntake.metadata.fecha_inicio} - ${structuredIntake.metadata.fecha_fin}\n\n`;

  Object.entries(structuredIntake.secciones).forEach(([key, section]) => {
    const hasFields = Object.keys(section.campos).length > 0;
    if (!hasFields) return;

    summary += `## ${section.titulo}\n`;
    summary += `*${section.descripcion}*\n\n`;

    Object.entries(section.campos).forEach(([field, value]) => {
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      summary += `- **${field}:** ${displayValue}\n`;
    });

    summary += '\n';
  });

  return summary;
}
