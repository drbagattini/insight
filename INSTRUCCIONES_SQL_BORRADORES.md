# 🔧 INSTRUCCIONES: Agregar Soporte para Borradores

## ⚠️ **ACCIÓN REQUERIDA**

Para completar la funcionalidad de borradores en el módulo de Evolución Clínica, necesitas ejecutar el siguiente SQL en **Supabase SQL Editor**:

## 📋 **Pasos a Seguir:**

### 1. **Abrir Supabase Dashboard**
- Ve a [supabase.com](https://supabase.com)
- Entra a tu proyecto
- Ve a **SQL Editor** en el menú lateral

### 2. **Ejecutar el SQL**
Copia y pega este código en el SQL Editor:

```sql
-- Agregar soporte para borradores en la tabla evolucion_clinica
-- Ejecutar este script en Supabase SQL Editor

-- Agregar columna is_draft
ALTER TABLE public.evolucion_clinica 
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;

-- Agregar comentario a la columna
COMMENT ON COLUMN public.evolucion_clinica.is_draft IS 'Indica si la entrada es un borrador (true) o está finalizada (false)';

-- Crear índice para consultas de borradores
CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_is_draft 
ON public.evolucion_clinica(is_draft);

-- Crear índice compuesto para consultas por paciente y estado de borrador
CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_patient_draft 
ON public.evolucion_clinica(paciente_id, is_draft, created_at DESC);

-- Actualizar el trigger de updated_at para incluir cambios en is_draft
-- (El trigger ya existe, solo verificamos que funcione correctamente)

-- Verificar que todas las entradas existentes estén marcadas como finalizadas
UPDATE public.evolucion_clinica 
SET is_draft = FALSE 
WHERE is_draft IS NULL;
```

### 3. **Hacer Click en "RUN"**
- Ejecuta el script
- Deberías ver mensajes de éxito

### 4. **Verificar la Ejecución**
Ejecuta esta consulta para verificar que la columna se agregó:

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'evolucion_clinica' 
AND column_name = 'is_draft';
```

Deberías ver:
```
column_name | data_type | is_nullable | column_default
is_draft    | boolean   | YES         | false
```

## 🔄 **Después de Ejecutar el SQL:**

### **Descomenta el Código**
Una vez ejecutado el SQL, necesitas descomentar estas líneas en el código:

#### **En `/app/api/patients/[patientId]/evolution/route.ts`:**
```typescript
// Cambiar esto:
// const is_draft = body.isDraft || false; // Temporalmente comentado hasta ejecutar SQL

// Por esto:
const is_draft = body.isDraft || false;

// Y cambiar esto:
        tags
        // is_draft // Temporalmente comentado hasta ejecutar SQL

// Por esto:
        tags,
        is_draft
```

#### **En `/types/evolucion-clinica.ts`:**
```typescript
// Cambiar esto:
is_draft?: boolean; // Opcional hasta ejecutar SQL

// Por esto:
is_draft: boolean;
```

## ✅ **Resultado Esperado:**

Después de ejecutar el SQL y descomentar el código:

1. ✅ **Botón "Guardar Borrador"** funcionará completamente
2. ✅ **Indicador "📝 Borrador"** aparecerá en entradas guardadas como borrador
3. ✅ **Filtros por estado** (borrador vs finalizado) funcionarán
4. ✅ **No más errores** al crear entradas

## 🚨 **Estado Actual:**

- ❌ **SQL no ejecutado** - La columna `is_draft` no existe
- ⚠️ **Código comentado temporalmente** - Para evitar errores
- ✅ **App funcionando** - Pero sin funcionalidad de borradores

**Una vez ejecutes el SQL, avísame para descomentar el código y activar completamente la funcionalidad de borradores.**
