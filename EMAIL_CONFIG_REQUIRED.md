# Configuración de Email para Cuestionarios OYS

## Variables de Entorno Requeridas

Para que funcione el envío de emails con links de cuestionarios, debes agregar estas variables a tu archivo `.env.local`:

```env
# Brevo SMTP Configuration (REQUERIDO para envío de emails)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=tu-email-brevo@ejemplo.com
BREVO_SMTP_PASS=tu-clave-smtp-brevo
EMAIL_SENDER=noreply@centrouno.com.uy

# WhatsApp Configuration (OPCIONAL)
WHATSAPP_PHONE_NUMBER_ID=tu-phone-number-id
WHATSAPP_ACCESS_TOKEN=tu-access-token
WHATSAPP_TEMPLATE_NAME=insight
```

## Pasos para Configurar Brevo

1. **Crear cuenta en Brevo** (anteriormente Sendinblue): https://www.brevo.com/
2. **Obtener credenciales SMTP**:
   - Ve a Settings → SMTP & API
   - Crea una nueva clave SMTP
   - Usa las credenciales en las variables de entorno

## Verificación

Una vez configuradas las variables, reinicia el servidor:
```bash
npm run dev:noturbo
```

El sistema verificará automáticamente la configuración al intentar enviar emails.

## Estado Actual

❌ **PROBLEMA IDENTIFICADO**: Faltan variables de entorno de Brevo SMTP
✅ **API de cuestionarios**: Funcionando correctamente
✅ **Cuestionarios OYS consolidados**: Disponibles en el sistema
