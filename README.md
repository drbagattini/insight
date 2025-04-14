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

## Desarrollo

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)
