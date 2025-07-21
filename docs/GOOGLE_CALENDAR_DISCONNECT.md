# Funcionalidad de Desconexión de Google Calendar

## 📋 Resumen

La funcionalidad de desconexión de Google Calendar permite a los usuarios revocar completamente el acceso de la aplicación a su cuenta de Google Calendar, eliminando todos los tokens de acceso y permisos asociados.

## 🎯 Características

### ✅ Funcionalidades Implementadas

- **Desconexión Completa**: Revoca tokens tanto localmente como en Google OAuth
- **Interfaz Intuitiva**: Botón dinámico que cambia según el estado de conexión
- **Disponibilidad Múltiple**: Accesible desde Perfil y Agenda
- **Estados Visuales**: Feedback claro durante operaciones
- **Manejo de Errores**: Recuperación graceful ante fallos
- **Reconexión Inmediata**: Posibilidad de reconectar después de desconectar

## 📍 Ubicaciones del Botón

### 1. Página de Perfil
- **Ruta**: `/dashboard/profile`
- **Ubicación**: Sección de configuración de cuenta
- **Contexto**: Gestión general de conexiones de cuenta

### 2. Página de Agenda
- **Ruta**: `/dashboard/calendar`
- **Ubicación**: Header superior de la agenda
- **Contexto**: Gestión específica de sincronización de calendario
- **Funcionalidad adicional**: Refresca eventos automáticamente tras conexión/desconexión

## 🔄 Flujo de Usuario

### Estado Desconectado
```
[Google Calendar] ← Botón muestra texto de conexión
```

### Estado Conectado
```
[Desvincular Google] ← Botón muestra opción de desconexión
```

### Durante Desconexión
```
[Desconectando...] ← Botón deshabilitado con estado de carga
```

## 🛠️ Proceso Técnico

### 1. **Inicio de Desconexión**
- Usuario hace click en "Desvincular Google"
- Botón se deshabilita y muestra "Desconectando..."

### 2. **Revocación en Google**
- Llamada a Google OAuth API para revocar token
- Endpoint: `https://oauth2.googleapis.com/revoke`
- Manejo graceful de errores de red

### 3. **Limpieza Local**
- Actualización de sesión NextAuth
- Eliminación de tokens del calendario:
  - `googleCalendarAccessToken`
  - `googleCalendarRefreshToken` 
  - `googleCalendarExpiresAt`
- Reset de `googleCalendarScopeGranted` a `false`

### 4. **Actualización de UI**
- Botón vuelve a estado "Google Calendar"
- Eventos del calendario se refrescan (en página de agenda)
- Usuario puede reconectar inmediatamente

## 🔐 Seguridad

### Tokens Revocados
- **Google OAuth**: Token invalidado en servidores de Google
- **Local**: Tokens eliminados de la sesión NextAuth
- **Persistencia**: No quedan rastros de tokens en el cliente

### Validaciones
- **Autenticación**: Endpoint requiere usuario autenticado
- **Autorización**: Solo el propietario puede desconectar su calendario
- **Limpieza**: Eliminación completa de credenciales sensibles

## 🧪 Testing

### Pruebas Automatizadas
```bash
# Ejecutar pruebas de funcionalidad
node scripts/test-calendar-disconnect.js

# Ejecutar pruebas de integración
node scripts/test-calendar-integration.js
```

### Pruebas Manuales
1. **Conexión Inicial**
   - Ir a `/dashboard/calendar` o `/dashboard/profile`
   - Click en "Google Calendar"
   - Autorizar permisos en Google
   - Verificar cambio a "Desvincular Google"

2. **Desconexión**
   - Click en "Desvincular Google"
   - Observar estado "Desconectando..."
   - Verificar cambio a "Google Calendar"

3. **Reconexión**
   - Click en "Google Calendar" nuevamente
   - Verificar que funciona correctamente

## 🚨 Manejo de Errores

### Errores de Red
- **Síntoma**: Fallo en comunicación con Google
- **Comportamiento**: Desconexión local continúa
- **Mensaje**: Alert informativo al usuario

### Errores de Autenticación
- **Síntoma**: Usuario no autenticado
- **Respuesta**: HTTP 401
- **Comportamiento**: Redirección a login

### Errores de Estado
- **Síntoma**: No hay conexión para desconectar
- **Respuesta**: HTTP 400
- **Mensaje**: "No hay conexión con Google Calendar"

## 📊 Monitoreo

### Logs del Servidor
```javascript
// Logs de desconexión exitosa
console.log('Token de Google Calendar revocado exitosamente');

// Logs de limpieza de tokens
console.log('[JWT] Disconnecting Google Calendar - clearing tokens');
```

### Logs del Cliente
```javascript
// Logs de proceso de desconexión
console.log('[ConnectCalendarButton] handleDisconnect: Disconnect successful');
```

## 🔧 Configuración

### Variables de Entorno Requeridas
```env
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu_secret_key
```

### Configuración de Google Cloud Console
- **Redirect URIs**: Debe incluir `${NEXTAUTH_URL}/api/auth/callback/google`
- **Scopes**: `openid email profile https://www.googleapis.com/auth/calendar.events`

## 🎉 Beneficios para el Usuario

1. **Control Total**: Gestión completa de permisos de calendario
2. **Privacidad**: Revocación completa de acceso cuando sea necesario
3. **Flexibilidad**: Conexión/desconexión sin pérdida de datos
4. **Transparencia**: Estados claros durante todas las operaciones
5. **Seguridad**: Eliminación completa de credenciales sensibles

## 📞 Soporte

### Problemas Comunes

**P: El botón no cambia de estado después de desconectar**
R: Verificar que la sesión se esté actualizando correctamente. Revisar logs del navegador.

**P: Error "No hay conexión para desconectar"**
R: El usuario no tenía Google Calendar conectado previamente.

**P: Error de red durante desconexión**
R: La desconexión local se completa aunque falle la revocación en Google.

### Contacto Técnico
Para problemas técnicos, revisar:
1. Logs del servidor
2. Logs del navegador (Console)
3. Estado de la sesión NextAuth
4. Configuración de variables de entorno
