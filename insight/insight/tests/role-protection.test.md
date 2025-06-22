# Pruebas de Protección de Rutas por Rol

## Configuración de Prueba
- URL de prueba: http://localhost:3000/test-roles
- Página de prueba: `/app/test-roles/page.tsx`

## Casos de Prueba

### 1. Usuario PSYCHOLOGIST
- **Credenciales**: psicologo@test.com
- **Rutas Permitidas**:
  - ✅ /dashboard
  - ✅ /patients
  - ❌ /admin (redirige a /auth/error)

### 2. Usuario ADMIN
- **Credenciales**: admin@test.com
- **Rutas Permitidas**:
  - ✅ /dashboard
  - ✅ /patients
  - ✅ /admin

### 3. Usuario sin rol o USER
- **Credenciales**: user@test.com
- **Rutas Restringidas**:
  - ❌ /dashboard (redirige a /auth/error)
  - ❌ /patients (redirige a /auth/error)
  - ❌ /admin (redirige a /auth/error)

## Resultados de Prueba

### Middleware
- Verifica correctamente el token de autenticación
- Redirige a /auth/login cuando no hay sesión
- Redirige a /auth/error cuando el rol es incorrecto
- Registra intentos de acceso denegados en la consola

### Hooks
- useRoleCheck funciona correctamente
- Muestra/oculta elementos UI según el rol
- Actualiza el estado al cambiar de sesión

## Notas
- La página de prueba (/test-roles) muestra el estado actual de la sesión
- Los enlaces cambian de color según si el usuario tiene acceso (verde) o no (rojo)
- El sistema maneja correctamente el cierre de sesión
