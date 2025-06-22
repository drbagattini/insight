# Flujo de Registro de Paciente y Envío de Cuestionario WHO-5

Este documento describe el flujo completo desde el registro público de un paciente hasta la programación y envío de su cuestionario (WHO-5), así como la preparación para la visualización de respuestas.

## 1. Migración de Base de Datos

- Archivo: `sql/14_create_questionarios_and_respuestas_tables.sql`
  - Crea las tablas:
    - `cuestionarios`: plantillas de cuestionarios (incluye WHO-5).
    - `envios_programados`: schedule de envíos por paciente.
    - `links_cuestionario`: tokens de acceso público.
    - `respuestas`: respuestas y puntuación calculada.
  - Inserta plantilla WHO-5 (5 ítems, escala 0-5).
  - Triggers para actualizar timestamps (`update_updated_at_column`).
  - Habilita RLS en nuevas tablas.

## 2. Cliente Supabase Admin (Service Role)

- Archivo: `app/lib/supabaseAdmin.ts`
  - Inicializa un `createClient` con `SUPABASE_SERVICE_ROLE_KEY`
  - Se usará para operaciones de escritura críticas (registro, schedules).

## 3. API de Registro de Paciente

- Ruta: `app/api/registro/route.ts`
- Método: `POST`
- Request body JSON:
  ```json
  {
    "nombre": "...",
    "apellido": "...",
    "email": "...",
    "whatsapp": "...",
    "edad": 30,
    "canal": "email|whatsapp|ambos",
    "frecuencia": "semanal|mensual|trimestral"
  }
  ```
- Lógica:
  1. Validar datos (Zod).
  2. Insertar en tabla `patients`.
  3. Calcular `proximo_envio` según frecuencia.
  4. Insertar en `envios_programados`.
  5. Responder 201 con `{ paciente, schedule }`.

## 4. Página Pública de Registro

- Ruta: `app/registro/page.tsx`
- Formulario en español:
  - Nombre, Apellido, Email, WhatsApp, Edad.
  - Preferencia de canal y frecuencia.
- Tras submit:
  - Llamada a `fetch('/api/registro', { method: 'POST', body })`.
  - Mostrar feedback de éxito o error.

## 5. Siguientes Pasos Inmediatos

1. Crear `app/api/registro/route.ts` usando `supabaseAdmin`.
2. Crear página `app/registro/page.tsx` con formulario y validaciones.
3. Agregar validaciones con Zod y manejar errores.
4. Verificar inserción y schedule en Supabase.
5. Integrar en README o menú de navegación.
