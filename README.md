# Insight

## Comandos Básicos

```bash
npm run dev    # Inicia servidor de desarrollo
npm run build  # Compila para producción
npm run start  # Inicia servidor de producción
```

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

## Desarrollo

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)
