# Resumen del Proyecto: Insight

Este documento proporciona una visión general del estado actual del proyecto "Insight".

### Versiones Detectadas

*   **Node.js:** v22.14.0
*   **Next.js:** v15.3.0
*   **TypeScript:** v5.8.3
*   **Tailwind CSS:** v4 (Instalado, pero sin `tailwind.config.js` encontrado)

### Dependencias Principales (`package.json`)

*   `@supabase/supabase-js`: ^2.49.4
*   `@tanstack/react-query`: ^5.74.3
*   `bcryptjs`: ^3.0.2
*   `next`: 15.3.0
*   `next-auth`: ^4.24.11
*   `react`: ^19.0.0
*   `react-dom`: ^19.0.0
*   `tailwindcss`: ^4
*   `typescript`: ^5

### Estructura de Carpetas (Profundidad 2)

```
.
├── app/
│   ├── api/
│   ├── auth/
│   ├── components/
│   ├── dashboard/
│   ├── lib/
│   ├── providers/
│   ├── (protected)/  # Probablemente un Route Group
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/       # <-- ¡DUPLICADO! Existe también fuera de app/
│   └── ui/
├── lib/              # <-- ¡DUPLICADO! Existe también fuera de app/
├── public/
├── sql/
├── types/
├── .env.local.example
├── .gitignore
├── middleware.ts
├── next-env.d.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
├── TODO.md           # <-- Archivo de tareas pendientes
└── tsconfig.json
```

*   **Nota:** Se detectaron carpetas `components` y `lib` tanto dentro como fuera del directorio `app/`. Esto podría indicar una refactorización incompleta o archivos redundantes que deberían revisarse.

### Rutas y Páginas Creadas (`app/`)

*   **Páginas:**
    *   `/`: `app/page.tsx` (Página principal/landing)
    *   `/auth/login`: `app/auth/login/page.tsx`
    *   `/auth/register`: `app/auth/register/page.tsx`
    *   `/auth/error`: `app/auth/error/page.tsx`
    *   `/dashboard`: `app/dashboard/page.tsx` (Protegida por middleware)
*   **Layouts:**
    *   `app/layout.tsx` (Layout raíz)
    *   `app/dashboard/layout.tsx` (Layout específico para el dashboard)
*   **API Routes:**
    *   `/api/auth/[...nextauth]` (Manejador principal de NextAuth)
    *   `/api/auth/register`: Manejo de registro de usuarios.
    *   `/api/auth/register/check`: Verificación relacionada con el registro.
    *   `/api/patients`: Gestión de pacientes (CRUD básico inferido).
    *   Varias rutas de diagnóstico/test: `/api/check-policies`, `/api/check-supabase`, `/api/check-table`, `/api/check-user`, `/api/diagnostic`, `/api/env-check`, `/api/simple-test`, `/api/test`, `/api/test-route`.
    *   `/api/temp/set-role`: Ruta temporal para modificar roles (probablemente para depuración).
    *   `/api/v1/auth/register`: Posible versión alternativa o futura del registro.

### Configuración de NextAuth (`app/api/auth/[...nextauth]/route.ts`)

*   **Proveedores:**
    *   `GoogleProvider`: Configurado para OAuth con Google.
    *   `CredentialsProvider`: Configurado para login con Email/Contraseña.
*   **Callbacks Principales:**
    *   `authorize`: Valida credenciales contra `supabase.auth.signInWithPassword`. Devuelve `{id, email, role}`.
    *   `signIn`: Verifica si el email de Google está verificado; permite acceso a Credentials.
    *   `jwt`: Popula el token JWT. Para Google, busca/crea usuario en tabla `users` (usando `supabaseAdmin` y asignando rol 'psicologo' por defecto). Para Credentials, copia datos del `user` devuelto por `authorize`.
    *   `session`: Transfiere `id`, `role`, `name`, `email` del token a la sesión del cliente.
*   **Páginas Personalizadas:** `/auth/login` y `/auth/error`.
*   **Debug:** Habilitado (`debug: true`).

### Uso de Supabase

*   **Clientes:**
    *   Cliente público/anónimo (`app/lib/supabaseClient.ts`): Usado en el frontend, inicializado con variables `NEXT_PUBLIC_*`.
    *   Cliente Admin (`app/api/auth/[...nextauth]/route.ts`): Usado en el backend (API routes), inicializado con `SUPABASE_SERVICE_ROLE_KEY` para operaciones privilegiadas.
*   **Tablas (inferidas de `sql/` y API routes):**
    *   `users`: Tabla personalizada para almacenar información adicional del usuario (incluyendo `role`).
    *   `patients`: Tabla para la información de pacientes.
    *   `sessions`: Probablemente para gestión de sesiones (aunque NextAuth maneja las suyas).
*   **Seguridad (RLS):**
    *   Row Level Security está **habilitado** (`sql/03_enable_rls.sql`).
    *   Existen políticas definidas para las tablas `users`, `patients`, y `sessions` (`sql/04_policies_users.sql`, `sql/05_policies_patients.sql`, `sql/07_policies_sessions.sql`).
    *   Una función (`handle_new_user` o similar, inferida de `sql/08_create_insert_user_function.sql`) podría estar asociada a triggers de autenticación de Supabase.
    *   Política específica (`sql/10_allow_google_auth_insert.sql`) para permitir inserciones por el rol de servicio durante el flujo de autenticación de Google.

### TODOs y Observaciones (Basado en `TODO.md` y análisis)

*   **Archivos de Configuración Faltantes:** No se encontraron `next.config.js` ni `tailwind.config.js`.
*   **Carpetas Duplicadas:** Existen `components` y `lib` dentro y fuera de `app/`. Requiere limpieza/consolidación.
*   **Tareas Pendientes Principales (de `TODO.md`):**
    *   **Autenticación:** Implementar logout, recuperación de contraseña.
    *   **Gestión de Usuarios:** CRUD completo, panel de admin, perfiles, gestión de roles.
    *   **Seguridad:** Rate limiting, validación de inputs (Zod/Yup), CSRF protection, auditoría.
    *   **Base de Datos:** Migraciones completas, revisión/optimización de RLS, índices, backups.
    *   **Frontend:** Mejorar formularios, manejo de estado global (React Query/SWR ya instalado), componentes, diseño responsive, feedback visual.
    *   **Testing:** Implementar tests unitarios, de integración y E2E.
    *   **Documentación:** APIs (Swagger/OpenAPI), guías.
    *   **DevOps:** CI/CD, monitoreo, métricas.
    *   **Optimizaciones:** Caching, lazy loading, imágenes.
    *   **Compliance/UX:** GDPR, Accesibilidad (WCAG), Analytics.
