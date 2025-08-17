/**
 * Función para ordenar cuestionarios según el orden específico solicitado
 */

// Orden específico de cuestionarios según requerimientos del usuario
export const QUESTIONNAIRE_ORDER = [
  'WHO-5',           // 1. Índice de Bienestar
  'PHQ-9',           // 2. Cuestionario de Salud del Paciente
  'GAD-7',           // 3. Ansiedad Generalizada
  'OYS-PADRES-40',   // 4. Ohio Youth Scales - Padres/Tutores (Consolidado)
  'OYS-JOVENES-40',  // 5. Ohio Youth Scales - Jóvenes (Consolidado)
  'OPD-CA2-SQ',      // 6. Estructura Psíquica Adolescente
  'BR-WAI'           // 7. Alianza Terapéutica
];

interface Questionnaire {
  id: string;
  codigo?: string;
  nombre?: string;
  titulo?: string;
  [key: string]: any;
}

/**
 * Ordena un array de cuestionarios según el orden específico definido
 */
export function sortQuestionnaires<T extends Questionnaire>(questionnaires: T[]): T[] {
  return questionnaires.sort((a, b) => {
    const getOrderIndex = (q: Questionnaire) => {
      const codigo = q.codigo?.toUpperCase() || '';
      const index = QUESTIONNAIRE_ORDER.findIndex(orderCode => 
        codigo === orderCode || codigo.includes(orderCode)
      );
      return index === -1 ? 999 : index; // Los no encontrados van al final
    };

    const indexA = getOrderIndex(a);
    const indexB = getOrderIndex(b);

    // Si ambos tienen el mismo índice, ordenar alfabéticamente por nombre
    if (indexA === indexB) {
      const nameA = a.nombre || a.titulo || a.codigo || '';
      const nameB = b.nombre || b.titulo || b.codigo || '';
      return nameA.localeCompare(nameB);
    }

    return indexA - indexB;
  });
}

/**
 * Aplica el ordenamiento a los datos de respuesta de la API
 */
export function applySortingToApiResponse(data: any[]): any[] {
  if (!Array.isArray(data)) return data;
  return sortQuestionnaires(data);
}
