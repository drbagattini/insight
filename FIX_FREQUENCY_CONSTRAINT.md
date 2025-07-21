# 🔧 FIX PARA FRECUENCIA "10_MINUTOS"

## El Problema
La UI ya tiene la opción "🕰️ 10 Minutos (Testing)" pero la base de datos no permite esta frecuencia debido a una restricción CHECK.

## La Solución 
Ejecutar este SQL en **Supabase Dashboard → SQL Editor**:

```sql
-- Drop existing constraint
ALTER TABLE envios_programados 
DROP CONSTRAINT IF EXISTS envios_programados_frecuencia_check;

-- Add new constraint with 10_minutos
ALTER TABLE envios_programados 
ADD CONSTRAINT envios_programados_frecuencia_check 
CHECK (frecuencia IN ('10_minutos', 'semanal', 'mensual', 'trimestral', 'unico'));

-- Test the constraint
SELECT 'Constraint updated successfully!' as message;
```

## Pasos:
1. 🌐 Ve a **Supabase Dashboard**
2. 📝 Abre **SQL Editor** 
3. 📋 Pega y ejecuta el SQL de arriba
4. ✅ Verifica que se ejecute sin errores

## Después del Fix:
- ✅ La opción "🕰️ 10 Minutos (Testing)" funcionará en la UI
- ✅ Podrás crear pacientes con recurrencia de 10 minutos
- ✅ El sistema enviará cuestionarios cada 10 minutos
- ✅ Perfecto para testing rápido del flujo completo

## Verificación:
Una vez ejecutado, prueba crear un paciente con frecuencia "10 minutos" desde la UI. Ya no debería dar error.
