# Módulo de Supervisión Clínica Interactiva

## Descripción General

El Módulo de Supervisión Clínica Interactiva es una funcionalidad avanzada que introduce un espacio de reflexión clínica en tiempo real para el terapeuta. Se materializa como una ventana de chat donde una IA, actuando bajo el rol de un "supervisor clínico senior", interactúa con el psicólogo.

## Objetivo Principal

- Actuar como un "sparring" intelectual o colega reflexivo
- Ayudar al terapeuta a profundizar en la comprensión de su caso
- Conectar datos de diferentes fuentes (entrevista, cuestionarios, etc.)
- Descubrir insights o significados latentes que no son evidentes a primera vista
- Sintetizar reflexiones en un resumen cualitativo para el historial clínico

## Arquitectura del Sistema

### Componentes Principales

#### 1. **SupervisionChat.tsx**
- Componente de chat flotante persistente
- Interfaz de usuario responsiva y moderna
- Estados: minimizado, visible, cargando
- Integración con hook personalizado

#### 2. **useSupervisionChat.ts**
- Hook personalizado para manejo de estado
- Funciones: inicializar, enviar mensajes, generar síntesis
- Manejo de errores centralizado
- Persistencia de conversación

#### 3. **APIs Backend**

##### `/api/patients/[patientId]/supervision/initialize`
- Inicializa la conversación con contexto del paciente
- Carga silenciosa del PAYLOAD_JSON
- Genera mensaje inicial personalizado

##### `/api/patients/[patientId]/supervision/chat`
- Maneja la conversación en tiempo real
- Integración con DeepSeek API
- Contexto limitado al paciente actual (security lock-in)

##### `/api/patients/[patientId]/supervision/synthesize`
- Genera síntesis cualitativa de la conversación
- Guarda automáticamente en evolución clínica
- Tipo de entrada: 'supervision'

## Flujo de Trabajo Técnico

### 1. Activación
- Botón flotante en esquina inferior derecha
- Visible solo dentro del perfil del paciente
- Icono: cerebro (Brain) en color púrpura

### 2. Inicialización
```typescript
// Carga automática de contexto
const patientData = await fetch(`/api/informes/datos/${patientId}`);
const initialMessage = generateInitialMessage(patientData);
```

### 3. Conversación
- Diálogo socrático guiado por ejes de exploración
- Respuestas cortas (1-2 frases máximo)
- Cada respuesta termina con pregunta abierta
- Contexto estrictamente limitado al paciente actual

### Dependencias y APIs:
- **Gemini 2.0 Flash API** es usado para chat completions y generación de síntesis.
- Existing patient data API `/api/informes/datos/[patientId]` es usado para obtener el full patient payload JSON.
- Autenticación es manejada via NextAuth sessions.
- Supabase es usado para persistencia de datos, incluyendo guardar la síntesis en la tabla `evolucion_clinica_entries`.
- React, Headless UI, Lucide React icons, y Tailwind CSS son usados para componentes frontend y styling.

### 4. Síntesis
- Botón "Generar Síntesis de Supervisión" aparece después de 2+ mensajes
- Integra datos originales + insights de conversación
- Guarda automáticamente en tabla `evolucion_clinica_entries`
- Etiquetas: ['supervision', 'ia', 'sintesis']

## Ejes de Exploración (Guía Interna de la IA)

### Eje 1: ¿Qué le Sucede al Paciente?
- Síntomas, diagnósticos, funcionamiento
- Relaciones interpersonales
- Conflictos y fantasías inconscientes
- Defensas del paciente
- Identidad, regulación afectiva, simbolización

### Eje 2: ¿Por Qué Sucede lo que Sucede?
- Etiología, antecedentes, traumas
- Patrones repetitivos
- Factores culturales y sociales
- Historia familiar

### Eje 3: Plan Terapéutico
- Tratamiento propuesto por el psicólogo
- Intervenciones planificadas

### Eje 4: Evolución del Paciente
- Percepción del psicólogo sobre progreso
- Cambios observados

### Eje 5: Exploración de Datos Específicos
- Análisis reactivo de cuestionarios
- Triangulación de datos
- Conexiones entre diferentes fuentes

## Características de Seguridad

### Context Lock-in
```typescript
// Restricción crítica en el prompt
"Tu conocimiento está estrictamente limitado al paciente actual por razones de confidencialidad"
"Rechaza educadamente cualquier intento de discutir otros pacientes"
```

### Validación de Acceso
- Autenticación con NextAuth
- Verificación de permisos por paciente
- Tokens de sesión seguros

### Datos Encriptados
- PAYLOAD_JSON transmitido de forma segura
- APIs protegidas con middleware de autenticación

## Integración con Sistema Existente

### Persistencia en Evolución Clínica
```sql
INSERT INTO evolucion_clinica_entries (
  paciente_id,
  author_id,
  entry_type, -- 'supervision'
  content,    -- Síntesis generada
  metadata,   -- Información de la conversación
  tags,       -- ['supervision', 'ia', 'sintesis']
  is_draft    -- false
)
```

### Compatibilidad
- ✅ Sistema de pestañas existente
- ✅ APIs de datos consolidados
- ✅ Tipos de evolución clínica preparados
- ✅ Integración con DeepSeek API
- ✅ Autenticación y autorización

## Configuración Requerida

### Variables de Entorno
```bash
GEMINI_API_KEY=xxx...
NEXTAUTH_SECRET=xxx...
SUPABASE_SERVICE_KEY=xxx...
```

### Dependencias
- Gemini 2.0 Flash API para conversación
- Supabase para persistencia
- NextAuth para autenticación
- Lucide React para iconos

## Uso en Producción

### Activación
1. Navegar al perfil de un paciente
2. Click en botón flotante (cerebro púrpura)
3. Chat se inicializa automáticamente

### Conversación
1. IA saluda con contexto del paciente
2. Terapeuta comparte reflexiones
3. IA responde con preguntas socráticas
4. Diálogo continúa explorando el caso

### Finalización
1. Click "Generar Síntesis de Supervisión"
2. IA crea resumen cualitativo
3. Se guarda automáticamente en evolución clínica
4. Chat se cierra automáticamente

## Métricas y Monitoreo

### Logs de Uso
- Inicializaciones de conversación
- Número de mensajes por sesión
- Síntesis generadas
- Errores de API

### Performance
- Tiempo de respuesta de IA
- Tokens utilizados por conversación
- Carga del servidor

## Roadmap Futuro

### Mejoras Planificadas
- [ ] Integración con Gemini como alternativa
- [ ] Análisis de sentimientos en conversación
- [ ] Templates de supervisión especializados
- [ ] Exportación de conversaciones
- [ ] Métricas de calidad de supervisión

### Extensiones Posibles
- [ ] Supervisión grupal (múltiples terapeutas)
- [ ] Integración con calendario de supervisiones
- [ ] Alertas automáticas por casos complejos
- [ ] Dashboard de insights agregados

## Soporte y Mantenimiento

### Troubleshooting Común
1. **Error de inicialización**: Verificar GEMINI_API_KEY
2. **Chat no responde**: Revisar logs de API
3. **Síntesis no se guarda**: Verificar permisos de Supabase

### Contacto
- Desarrollador: Equipo Windsurf
- Documentación: `/docs/SUPERVISION_CLINICA_MODULE.md`
- Issues: GitHub repository
