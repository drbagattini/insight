# Windsurf Project TODO

## ✅ Completado

### 1. Configuración inicial del proyecto
- [x] Next.js 14 con TypeScript y Tailwind CSS
- [x] Estructura de carpetas y configuración base
- [x] Variables de entorno (.env.local y .env.local.example)

### 2. Integración con Supabase
- [x] Configuración de claves y conexión
- [x] Implementación de API para registro de usuarios
- [x] Manejo de errores básico
- [x] Middleware para rutas públicas/protegidas

### 3. APIs de diagnóstico y prueba
- [x] Endpoints de verificación de ambiente
- [x] Rutas de prueba para Supabase
- [x] Verificación de tablas y usuarios

## 📝 Pendiente

### 1. Autenticación y Autorización
- [ ] Implementar login de usuarios
- [ ] Manejo de sesiones con NextAuth
- [ ] Protección de rutas basada en roles
- [ ] Implementar logout
- [ ] Recuperación de contraseña
- [ ] **[Incidente] Restaurar verificación estricta de roles en middleware tras troubleshooting de login**
    - Durante el troubleshooting de problemas de login de pacientes, se desactivó temporalmente la verificación estricta de roles en el middleware para permitir el acceso a `/dashboard` y aislar el problema.
    - **Hipótesis:** El fallo estaba relacionado con la asignación incorrecta del campo `role` en el JWT generado por NextAuth, especialmente en el flujo de login por credenciales. Si el token no contiene el rol correcto, el middleware bloquea el acceso.
    - El flujo de Google OAuth y credenciales tienen diferencias en cómo se construye el objeto usuario y el token resultante. Los pacientes recibían el rol `paciente` y eran bloqueados para `/dashboard`, reservado a `psicologo` y `admin`.
    - **Tareas:**
        - Restaurar la verificación estricta de roles en el middleware.
        - Confirmar que el JWT siempre contiene el campo `role` correcto tras login (Google y credenciales).
        - Documentar el flujo de autenticación y manejo de roles.
        - Agregar tests automáticos para validar login y autorización de roles.
    - Mantener logs de debugging hasta confirmar robustez del flujo.
    - Revisar redundancias en asignación de roles entre callbacks de NextAuth y la base de datos.

### 2. Gestión de Usuarios
- [ ] Panel de administración de usuarios
- [ ] CRUD completo para usuarios
- [ ] Validación de emails
- [ ] Perfiles de usuario
- [ ] Gestión de roles y permisos

### 3. Seguridad
- [ ] Implementar rate limiting
- [ ] Validación de inputs con Zod/Yup
- [ ] Headers de seguridad
- [ ] Auditoría de accesos
- [ ] Implementar CSRF protection

### 4. Base de Datos
- [ ] Migraciones completas para todas las tablas
- [x] Políticas RLS en Supabase
- [ ] Índices y optimizaciones
- [ ] Backup strategy

### 5. Frontend
- [ ] Formularios de registro/login
- [ ] Manejo de estados con React Query/SWR
- [ ] Componentes reutilizables
- [ ] Diseño responsive
- [ ] Feedback visual para acciones del usuario

### 6. Testing
- [ ] Tests unitarios para APIs
- [ ] Tests de integración
- [ ] Tests E2E con Cypress/Playwright
- [ ] Tests de seguridad

### 7. Documentación
- [ ] API docs con Swagger/OpenAPI
- [ ] Guía de desarrollo
- [ ] Documentación de arquitectura
- [ ] Guía de despliegue

### 8. DevOps
- [ ] CI/CD pipeline
- [ ] Monitoreo y logs
- [ ] Métricas de rendimiento
- [ ] Ambiente de staging

### 9. Optimizaciones
- [ ] Caching strategy
- [ ] Lazy loading
- [ ] Optimización de imágenes
- [ ] Performance monitoring

### 10. Compliance y UX
- [ ] GDPR compliance
- [ ] Accesibilidad (WCAG)
- [ ] Analytics
- [ ] Sistema de feedback
