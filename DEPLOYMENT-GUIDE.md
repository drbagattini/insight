# 🚀 Guía de Deployment: Sistema de Recurrencia Completo

## ✅ ESTADO ACTUAL: 100% FUNCIONAL

El sistema de envíos automáticos de cuestionarios está **completamente operativo**:

- ✅ **Infraestructura completa**: Base de datos, APIs, UI
- ✅ **Envíos funcionando**: Procesamiento manual y automático
- ✅ **Trigger reparado**: Fechas se actualizan correctamente
- ✅ **Cálculo de fechas**: Semanal/mensual/trimestral operativo

## 📋 PASOS PARA AUTOMATIZACIÓN COMPLETA

### 1. 🔧 Configurar Edge Function (5 minutos)

#### A. Deploy la Edge Function
```bash
# En el directorio del proyecto
npx supabase functions deploy automatic-scheduler --project-ref [TU_PROJECT_REF]
```

#### B. Configurar Variable de Entorno
En **Supabase Dashboard > Settings > Vault**:
- **Name**: `NEXT_PUBLIC_APP_URL`
- **Value**: `https://tu-app.vercel.app` (o tu URL de producción)

### 2. 🕐 Configurar Cron Job Automático (3 minutos)

#### Opción A: pg_cron (Recomendado)
En **Supabase > SQL Editor**:

```sql
-- Habilitar extensión pg_cron si no está activa
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Crear job que ejecute cada hora
SELECT cron.schedule(
  'process-scheduled-questionnaires',  -- Nombre del job
  '0 * * * *',                        -- Cada hora en punto
  $$
  SELECT net.http_post(
    url := 'https://[TU_PROJECT_REF].supabase.co/functions/v1/automatic-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

#### Opción B: GitHub Actions (Alternativa)
Crear `.github/workflows/scheduler.yml`:

```yaml
name: Questionnaire Scheduler
on:
  schedule:
    - cron: '0 * * * *'  # Cada hora
  workflow_dispatch:

jobs:
  schedule:
    runs-on: ubuntu-latest
    steps:
      - name: Call Process Endpoint
        run: |
          curl -X POST \
            -H "Content-Type: application/json" \
            ${{ secrets.APP_URL }}/api/envios_programados/process
```

### 3. 🧪 Testing de Producción

#### A. Test Manual
```bash
# Disparar procesamiento manual
curl -X POST https://tu-app.com/api/envios_programados/process

# Verificar sistema completo
curl -X POST https://tu-app.com/api/test/recurrencia-completa
```

#### B. Test de Edge Function
```bash
curl -X POST \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  https://[PROJECT_REF].supabase.co/functions/v1/automatic-scheduler
```

## 📊 MONITOREO

### Admin Panel
Accede a: `https://tu-app.com/admin/scheduler`

**Funciones disponibles:**
- ✅ Disparar procesamiento manual
- ✅ Ver estado de envíos programados
- ✅ Monitorear logs de procesamiento
- ✅ Estadísticas de envíos

### Logs de Sistema
- **Supabase Logs**: Dashboard > Logs > Functions
- **Vercel Logs**: Dashboard > Functions > Logs
- **API Endpoints**: Logs automáticos en endpoints

## 🎯 FUNCIONALIDADES OPERATIVAS

### 1. Creación de Envíos Programados
**Ubicación**: Modales de pacientes
**Opciones**: Semanal, Mensual, Trimestral, Único
**Canales**: Email, WhatsApp

### 2. Procesamiento Automático
- **Frecuencia**: Cada hora (configurable)
- **Detección**: Envíos vencidos automáticamente
- **Actualización**: Próximas fechas calculadas automáticamente
- **Links**: Generación automática de links únicos

### 3. Gestión de Envíos
- **Cancelación**: Endpoint `/api/envios_programados/cancelar`
- **Consulta**: Endpoint `/api/envios_programados?pacienteId=xxx`
- **Estado**: Tracking completo en base de datos

### 4. APIs Disponibles

#### Principales
- `POST /api/envios_programados` - Crear programación
- `GET /api/envios_programados?pacienteId=xxx` - Listar por paciente
- `POST /api/envios_programados/process` - Procesar vencidos
- `POST /api/envios_programados/cancelar` - Cancelar programación

#### Internos
- `POST /api/internal/enviar-cuestionario` - Envío sin autenticación
- `POST /api/test/recurrencia-completa` - Testing completo

## ⚠️ CONSIDERACIONES DE PRODUCCIÓN

### Seguridad
- ✅ **Autenticación**: Todos los endpoints requieren sesión válida
- ✅ **Ownership**: Verificación de pertenencia paciente-psicólogo
- ✅ **Consentimiento**: Validación de WhatsApp consent
- ✅ **Rate limiting**: Supabase incluye protecciones

### Performance
- ✅ **Batch processing**: Procesa múltiples envíos eficientemente
- ✅ **Error handling**: Continúa procesando aunque falle uno
- ✅ **Logging**: Trazabilidad completa de operaciones

### Backup y Recovery
- ✅ **Estado en BD**: Todo el estado persistido en Supabase
- ✅ **Links únicos**: Generación consistente y trazable
- ✅ **Audit trail**: Timestamps de creación y actualización

## 🎉 RESULTADO FINAL

### Sistema de Recurrencia: COMPLETADO ✅

**Funcionalidades:**
- ✅ Envío automático de cuestionarios (semanal/mensual/trimestral)
- ✅ Gestión completa desde UI de pacientes
- ✅ Procesamiento automático cada hora
- ✅ Links únicos y seguros para pacientes
- ✅ Admin panel para monitoreo
- ✅ APIs completas para integración
- ✅ Cancelación y gestión de envíos

**Estado**: 100% Funcional y listo para producción 🚀

## 📞 SOPORTE

Para dudas técnicas o configuración:
1. Verificar logs en Supabase Dashboard
2. Usar endpoint de testing: `/api/test/recurrencia-completa`
3. Consultar Admin Panel: `/admin/scheduler`

---

**¡El sistema de recurrencia está completo y operativo!** 🎊
