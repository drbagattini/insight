# Insight

## Autenticación y Seguridad

- **Autenticación**: NextAuth.js con credenciales (email/contraseña) y Google OAuth.
- **Gestión de usuarios**: Tabla `users` en Supabase, campo `role` (`psicologo`, `admin`, `paciente`).
- **Políticas RLS**: Toda la base de datos protegida por Row Level Security (RLS). El frontend usa solo la clave anónima.
- **Middleware de roles**: La verificación estricta de roles en `/dashboard` está **desactivada temporalmente** para evitar bloqueos de acceso. Para restaurarla, descomenta el bloque correspondiente en `middleware.ts`.
- **Recomendación**: Cuando todos los usuarios tengan el rol correcto, reactiva la verificación de roles para máxima seguridad.

## Troubleshooting (Login y Roles)

- Si el login con credenciales no funciona pero Google sí, revisa que el usuario en Supabase tenga el campo `role` correcto y que el callback JWT de NextAuth lo pase al token.
- Si puedes loguearte pero no accedes a `/dashboard`, probablemente el middleware está bloqueando por rol. Puedes desactivar temporalmente la verificación de roles según los comentarios en `middleware.ts`.
- Si necesitas forzar el rol en el token, revisa el callback `jwt` en `app/api/auth/[...nextauth]/route.ts`.


## Comandos Básicos

```bash
npm run dev    # Inicia servidor de desarrollo
npm run build  # Compila para producción
npm run start  # Inicia servidor de producción
```

## Dependencias principales

- next: 15.3.0
- next-auth: ^4.24.11
- @supabase/supabase-js: ^2.49.4
- react: ^19.0.0
- tailwindcss: ^4
- zod, chart.js, bcryptjs, react-chartjs-2, @headlessui/react, @heroicons/react, @tanstack/react-query

## Variables de Entorno

1. Crea un archivo `.env.local` basado en `.env.local.example`:
```bash
cp .env.local.example .env.local
```

2. Configura las siguientes variables:
- `NEXTAUTH_URL`: URL base de la aplicación (default: http://localhost:3000)
- `NEXTAUTH_SECRET`: Clave secreta para autenticación (generada automáticamente con openssl)
- `NEXT_PUBLIC_APP_NAME`: Nombre de la aplicación (default: insight)
- `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clave anónima de Supabase (para operaciones de cliente)
- `SUPABASE_SERVICE_KEY`: Clave de servicio de Supabase (solo para scripts de servidor)

## Supabase y Seguridad con RLS

### Configuración del Cliente Supabase

Para trabajar correctamente con políticas Row Level Security (RLS):

```typescript
// Usar la función centralizada para crear clientes
import { createSupabaseClient } from '@/utils/supabase';

// Crear cliente que respeta RLS
const client = createSupabaseClient();
```

### Mejores Prácticas de Seguridad

- Usa siempre la clave anónima (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) en operaciones del lado del cliente
- Reserva la clave de servicio (`SUPABASE_SERVICE_KEY`) exclusivamente para scripts administrativos y tareas de servidor
- Siguiendo nuestra filosofía de seguridad, la aplicación aplica políticas RLS para proteger los datos
- Las pruebas de políticas RLS están disponibles en `/test-policy-v2`

## Estructura de carpetas

- `app/` — Rutas, layouts, componentes principales, lógica de frontend y API
- `app/api/auth/[...nextauth]/route.ts` — Configuración de NextAuth y callbacks personalizados
- `middleware.ts` — Protección de rutas y control de acceso por roles
- `types/` — Tipos TypeScript globales y enums de roles
- `sql/` — Esquema y políticas de la base de datos Supabase
- `components/` y `app/components/` — Revisión pendiente para consolidar duplicados
- `lib/` (root) — **NO USAR**: contiene lógica obsoleta e insegura, pendiente de eliminar

## Añadir nuevos cuestionarios

Sigue estos pasos para incorporar un cuestionario nuevo sin romper compatibilidad:

1. **Metadatos**  
   Agrega una entrada en `data/questionnaires-meta.ts` cuyo `code` (e.g. "GAD-7") sea la *key* del objeto. Define al menos:
   ```ts
   {
     code: "GAD-7",
     title: "Escala de Ansiedad Generalizada-7",
     chartType: "line",          // o "bar", etc.
     thresholds: { bajo: 5, alto: 10 }, // opcional
   }
   ```

2. **Algoritmo de puntuación (opcional)**  
   Si el cuestionario requiere cómputo automático, crea `scoring/gad7.ts` con su función:
   ```ts
   import { ScoreFn } from '@/types/questionnaire';
   export const scoreGad7: ScoreFn = (answers) => answers.reduce((s, v) => s + v, 0);
   ```
   Luego registra la función en `scoring/index.ts`:
   ```ts
   import { scoreGad7 } from './gad7';
   export const scores = {
     'WHO-5': scoreWho5,
     'GAD-7': scoreGad7,
   };
   ```
   Si omites el módulo, la app seguirá funcionando y mostrará un `console.warn`.

3. **Formulario público**  
   Asegúrate de que la vista pública use tus preguntas. La ruta `/api/questionnaires/[codigo]` devuelve `meta` para componer el formulario dinámicamente.

4. **Pruebas**  
   • Añade unit test en `tests/scoring.spec.ts` para validar la función.  
   • Si procede, amplía los e2e Playwright.

5. **Checklist PR**  
   - [ ] Meta agregada  
   - [ ] `scoring/` implementado y exportado  
   - [ ] Pruebas unitarias  
   - [ ] UI revisada

---

## Desarrollo

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)
