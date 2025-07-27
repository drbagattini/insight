# ESTRATEGIA DE ANÁLISIS HÍBRIDO: LLM + ESTRUCTURADO

## 🎯 OBJETIVO
Permitir análisis tanto con LLM (sobre texto libre) como análisis estructurado (sobre datos extraídos) del módulo de Evolución Clínica.

## 📊 ARQUITECTURA RECOMENDADA

### OPCIÓN A: EXTRACCIÓN AUTOMÁTICA (Recomendada)
```typescript
// Mantener el campo content como texto libre para LLM
content: string  // ✅ Para análisis con LLM

// Enriquecer metadata con extracción automática
metadata: {
  // Datos extraídos automáticamente del content
  extracted_data?: {
    symptoms: Array<{
      name: string;
      severity: 1-10;
      frequency: string;
      category: string;
    }>;
    
    mood_indicators: {
      mood_scale?: 1-10;
      anxiety_level?: 1-10;
      energy_level?: 1-10;
    };
    
    therapeutic_elements: {
      interventions_mentioned: string[];
      progress_indicators: string[];
      goals_discussed: string[];
    };
    
    session_context: {
      duration_mentioned?: number;
      session_type?: string;
      key_topics: string[];
    };
  };
  
  // Metadata manual (como está ahora)
  attachments?: Array<...>;
  audioTranscriptions?: Array<...>;
}
```

### OPCIÓN B: CAMPOS HÍBRIDOS
```sql
-- Agregar campos opcionales para datos estructurados
ALTER TABLE evolucion_clinica 
ADD COLUMN extracted_symptoms JSONB,
ADD COLUMN session_metrics JSONB,
ADD COLUMN mood_data JSONB;

-- Mantener content para LLM analysis
-- Usar campos nuevos para structured analysis
```

## 🔄 FLUJO DE TRABAJO PROPUESTO

### 1. ENTRADA DE DATOS
```
Psicólogo escribe evolución → content (texto libre)
                          ↓
Sistema extrae automáticamente → metadata.extracted_data
```

### 2. ANÁLISIS DUAL
```
LLM Analysis:
- Análisis semántico del content completo
- Detección de patrones narrativos
- Análisis contextual profundo

Structured Analysis:
- Métricas cuantificables de metadata.extracted_data
- Tendencias temporales de síntomas
- Comparaciones estadísticas
```

### 3. EXTRACCIÓN AUTOMÁTICA CON LLM
```typescript
// Función para extraer datos estructurados del texto libre
async function extractStructuredData(content: string): Promise<ExtractedData> {
  const prompt = `
  Analiza el siguiente texto de evolución clínica y extrae:
  
  1. SÍNTOMAS mencionados (nombre, severidad 1-10, frecuencia)
  2. ESCALAS DE HUMOR (si se mencionan números o descripciones)
  3. INTERVENCIONES terapéuticas aplicadas
  4. PROGRESO observado
  5. DURACIÓN de sesión (si se menciona)
  
  Texto: ${content}
  
  Responde en JSON estructurado.
  `;
  
  return await callLLM(prompt);
}
```

## 🎯 VENTAJAS DE ESTA ESTRATEGIA

### ✅ PARA LLM ANALYSIS:
- Texto completo preservado
- Contexto narrativo intacto
- Análisis semántico profundo
- Detección de patrones sutiles

### ✅ PARA STRUCTURED ANALYSIS:
- Datos cuantificables extraídos
- Métricas comparables
- Tendencias temporales
- Análisis estadístico

### ✅ IMPLEMENTACIÓN:
- No rompe funcionalidad actual
- Extracción automática en background
- Datos estructurados opcionales
- Migración gradual

## 🚀 PLAN DE IMPLEMENTACIÓN

### FASE 1: Setup Básico
1. Agregar tipos TypeScript para extracted_data
2. Crear función de extracción con LLM
3. Ejecutar extracción en background al guardar

### FASE 2: Análisis Estructurado
1. Dashboard con métricas extraídas
2. Gráficos de tendencias de síntomas
3. Comparaciones temporales

### FASE 3: Análisis Híbrido
1. Combinar insights de LLM + structured data
2. Reportes automáticos híbridos
3. Alertas basadas en patrones

## 💡 EJEMPLO PRÁCTICO

### Entrada (content):
```
"Paciente refiere ansiedad nivel 7/10 durante la semana. 
Aplicamos técnicas de respiración y reestructuración cognitiva. 
Muestra progreso en manejo de pensamientos intrusivos. 
Sesión de 50 minutos, buen engagement."
```

### Extracción automática (metadata.extracted_data):
```json
{
  "symptoms": [
    {
      "name": "ansiedad",
      "severity": 7,
      "frequency": "semanal",
      "category": "ansiedad"
    }
  ],
  "mood_indicators": {
    "anxiety_level": 7
  },
  "therapeutic_elements": {
    "interventions_mentioned": [
      "técnicas de respiración",
      "reestructuración cognitiva"
    ],
    "progress_indicators": [
      "progreso en manejo de pensamientos intrusivos"
    ]
  },
  "session_context": {
    "duration_mentioned": 50,
    "key_topics": ["ansiedad", "pensamientos intrusivos"],
    "engagement_level": "bueno"
  }
}
```

### Análisis Dual:
- **LLM:** "El paciente muestra una narrativa de progreso gradual..."
- **Structured:** "Ansiedad promedio: 7/10, Tendencia: ↘️ -0.5 vs sesión anterior"
