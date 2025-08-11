# 🚀 Guía de Deployment a Producción

## 📋 Pre-requisitos

### 1. **Credenciales de Mercado Pago PRODUCCIÓN**
- Obtener credenciales reales de producción desde [Mercado Pago Developers](https://www.mercadopago.com.uy/developers)
- **IMPORTANTE**: Las credenciales actuales son de SANDBOX (pruebas)

### 2. **Dominio y SSL**
- Dominio configurado con certificado SSL (HTTPS)
- Mercado Pago requiere HTTPS para webhooks en producción

## 🔧 Configuración de Variables de Entorno

### **En tu servidor de producción, crear `.env.local` con:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu-supabase-url-produccion
SUPABASE_SERVICE_ROLE_KEY=tu-supabase-service-key-produccion

# NextAuth
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu-secret-super-seguro-para-produccion

# Mercado Pago - PRODUCCIÓN (CAMBIAR POR CREDENCIALES REALES)
MP_ACCESS_TOKEN=APP_USR-tu-access-token-PRODUCCION
MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-access-token-PRODUCCION
MP_PUBLIC_KEY=APP_USR-tu-public-key-PRODUCCION
MP_CLIENT_ID=tu-client-id-PRODUCCION
MP_CLIENT_SECRET=tu-client-secret-PRODUCCION
MP_WEBHOOK_SECRET=tu-webhook-secret-super-seguro-PRODUCCION
APP_URL=https://tu-dominio.com

# Google OAuth
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
```

## 🔄 Pasos de Deployment

### **1. Build y Deploy**
```bash
npm run build
npm start
```

### **2. Configurar Webhook en Mercado Pago**
- URL: `https://tu-dominio.com/api/webhooks/mp`
- Eventos: `payment`, `merchant_order`

### **3. Verificar Funcionalidad**
- ✅ Compra de planes redirige a Mercado Pago
- ✅ Compra directa redirige a Mercado Pago
- ✅ Webhooks procesan pagos correctamente
- ✅ Créditos se agregan automáticamente

## ⚠️ Consideraciones de Seguridad

### **Variables Críticas:**
- `MP_WEBHOOK_SECRET`: Debe ser único y seguro
- `NEXTAUTH_SECRET`: Debe ser único para cada entorno
- Nunca exponer credenciales en el código

### **URLs de Retorno:**
- Success: `https://tu-dominio.com/pago/success`
- Failure: `https://tu-dominio.com/pago/failure`
- Pending: `https://tu-dominio.com/pago/pending`

## 🧪 Testing en Producción

### **Flujo de Compra de Plan:**
1. Ir a `/credits`
2. Seleccionar plan
3. Verificar redirección a Mercado Pago
4. Completar pago de prueba
5. Verificar que se agreguen créditos

### **Flujo de Compra Directa:**
1. Ir a `/credits`
2. Clic en "Comprar Créditos"
3. Seleccionar monto
4. Verificar redirección a Mercado Pago
5. Completar pago de prueba
6. Verificar que se agreguen créditos

## 📊 Monitoreo

### **Logs a Revisar:**
- Creación de preferencias de pago
- Procesamiento de webhooks
- Errores de autenticación
- Actualizaciones de créditos

### **Métricas Importantes:**
- Tasa de conversión de pagos
- Errores en webhooks
- Tiempo de respuesta de APIs
