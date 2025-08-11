# Sistema de Créditos y Pagos - Guía de Instalación

Este documento describe cómo configurar e implementar el sistema completo de créditos y pagos para la plataforma de supervisión clínica.

## 📋 Resumen del Sistema

El sistema de créditos permite:
- **Gestión de billeteras**: Cada usuario tiene una billetera con balance de créditos
- **Consumo automático**: Los créditos se debitan automáticamente al usar IA (informes, transcripciones, chat)
- **Compra de créditos**: Integración con Mercado Pago para comprar paquetes de créditos
- **Historial completo**: Registro detallado de todas las transacciones
- **Actualizaciones en tiempo real**: Balance actualizado inmediatamente

## 🗄️ 1. Configuración de Base de Datos

### Paso 1: Ejecutar Scripts SQL

Ejecuta los siguientes scripts en el SQL Editor de Supabase **en este orden**:

```sql
-- 1. Crear tablas y estructura básica
-- Ejecutar: sql/create_credits_system.sql
```

```sql
-- 2. Crear funciones para débito/crédito atómico
-- Ejecutar: sql/create_debit_function.sql
```

### Paso 2: Verificar Tablas Creadas

Confirma que se crearon las siguientes tablas:
- `wallets` - Billeteras de usuarios
- `wallet_transactions` - Historial de transacciones
- `payment_preferences` - Preferencias de pago de Mercado Pago

## 🔧 2. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```bash
# Mercado Pago Configuration
MERCADOPAGO_ACCESS_TOKEN=APP_USR-your-access-token
MERCADOPAGO_PUBLIC_KEY=APP_USR-your-public-key
MERCADOPAGO_WEBHOOK_SECRET=your-webhook-secret

# App URL (importante para webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # En desarrollo
# NEXT_PUBLIC_APP_URL=https://yourdomain.com  # En producción
```

### Obtener Credenciales de Mercado Pago

1. Ve a [Mercado Pago Developers](https://www.mercadopago.com.uy/developers)
2. Crea una aplicación
3. Obtén las credenciales de **Sandbox** para desarrollo
4. Para producción, usa las credenciales **Productivas**

## 📦 3. Dependencias

Las dependencias ya están incluidas en el `package.json`. Si necesitas instalarlas:

```bash
npm install @tanstack/react-query lucide-react
```

## 🚀 4. Estructura de Archivos Creados

### APIs Backend
```
app/api/
├── credits/
│   ├── balance/route.ts      # Obtener balance de créditos
│   ├── history/route.ts      # Historial de transacciones
│   └── debit/route.ts        # Debitar créditos
└── payments/
    ├── create-preference/route.ts  # Crear preferencia MP
    └── mp-webhook/route.ts         # Webhook de Mercado Pago
```

### Componentes Frontend
```
components/credits/
├── CreditBalance.tsx         # Mostrar balance y equivalencias
├── CreditPlans.tsx          # Planes de compra
└── CreditHistory.tsx        # Historial de transacciones

app/dashboard/credits/
└── page.tsx                 # Página principal de créditos
```

### Hooks y Utilidades
```
hooks/
├── useCredits.ts            # Hook para gestión de créditos
└── usePayments.ts           # Hook para pagos

types/
├── credits.ts               # Tipos para créditos
└── payments.ts              # Tipos para pagos

lib/
└── credits.ts               # Funciones utilitarias
```

## 💳 5. Configuración de Mercado Pago

### Webhook Configuration

1. En tu panel de Mercado Pago, configura el webhook:
   - URL: `https://yourdomain.com/api/payments/mp-webhook`
   - Eventos: `payment.created`, `payment.updated`

2. El webhook debe estar **públicamente accesible**

### Testing en Desarrollo

Para probar en desarrollo con ngrok:

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto 3000
ngrok http 3000

# Usar la URL de ngrok en NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

## 📊 6. Costos y Equivalencias

### Costos por Operación
- **Informe clínico**: 8 créditos
- **Transcripción audio**: 1 crédito por minuto
- **Chat IA**: 1 crédito por 1,000 tokens

### Planes de Créditos
- **Básico**: 700 créditos - $280 UYU ($7 USD)
- **Intermedio**: 1,400 créditos - $560 UYU ($14 USD)
- **Premium**: 2,800 créditos - $1,120 UYU ($28 USD)

## 🔄 7. Flujo de Funcionamiento

### Compra de Créditos
1. Usuario selecciona plan en `/dashboard/credits`
2. Se crea preferencia de pago en Mercado Pago
3. Usuario es redirigido a checkout de MP
4. Webhook confirma pago y acredita créditos
5. Balance se actualiza automáticamente

### Consumo de Créditos
1. Usuario usa funcionalidad (informe, transcripción, chat)
2. Sistema debita créditos automáticamente
3. Si no hay créditos suficientes, se bloquea la operación
4. Transacción se registra en historial

## 🛠️ 8. Testing

### Verificar Instalación

1. **Base de datos**: Confirma que las tablas existen
2. **Variables de entorno**: Verifica que están configuradas
3. **Navegación**: Ve a `/dashboard/credits`
4. **Balance**: Debe mostrar 0 créditos inicialmente
5. **Planes**: Deben aparecer los 3 planes de compra

### Test de Compra (Sandbox)

1. Usa credenciales de Sandbox de Mercado Pago
2. Selecciona un plan
3. Usa tarjetas de prueba de MP
4. Verifica que se acrediten los créditos

### Test de Consumo

1. Genera un informe clínico
2. Verifica que se debiten 8 créditos
3. Revisa el historial de transacciones

## 🚨 9. Troubleshooting

### Problemas Comunes

**Error: "Créditos insuficientes"**
- Verifica que el usuario tenga créditos en su billetera
- Revisa que la función de débito esté funcionando

**Webhook no funciona**
- Confirma que la URL sea públicamente accesible
- Verifica la configuración en Mercado Pago
- Revisa los logs del webhook

**Balance no se actualiza**
- Verifica que React Query esté invalidando el cache
- Confirma que las transacciones se registren en la BD

### Logs Importantes

```bash
# Ver logs de débito de créditos
console.log('[CREDITS] Debiting credits for user:', userId)

# Ver logs de webhook
console.log('[WEBHOOK] Processing payment:', paymentId)

# Ver logs de balance
console.log('[BALANCE] Current balance:', balance)
```

## 📈 10. Métricas y Monitoreo

### Queries Útiles

```sql
-- Balance total de todos los usuarios
SELECT SUM(balance) as total_credits FROM wallets;

-- Transacciones del último mes
SELECT * FROM wallet_transactions 
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Usuarios con créditos bajos
SELECT u.email, w.balance 
FROM users u 
JOIN wallets w ON u.id = w.user_id 
WHERE w.balance < 50;
```

## 🔐 11. Seguridad

### Consideraciones Importantes

1. **RLS Policies**: Todas las tablas tienen Row Level Security habilitado
2. **Webhook Signature**: Se verifica la firma de Mercado Pago
3. **Transacciones Atómicas**: Los débitos/créditos son atómicos
4. **Validación**: Todos los inputs se validan con Zod

### Permisos

- Solo el usuario puede ver su billetera y transacciones
- Solo admins pueden ver todas las billeteras
- Los webhooks usan claves de servicio para escribir

## ✅ 12. Checklist de Implementación

- [ ] Scripts SQL ejecutados en Supabase
- [ ] Variables de entorno configuradas
- [ ] Credenciales de Mercado Pago obtenidas
- [ ] Webhook configurado en MP
- [ ] Navegación actualizada (sidebar)
- [ ] Tests de compra realizados
- [ ] Tests de consumo realizados
- [ ] Monitoreo configurado

## 📞 13. Soporte

Si encuentras problemas:

1. Revisa los logs del navegador y servidor
2. Verifica la configuración de variables de entorno
3. Confirma que las tablas de BD estén creadas correctamente
4. Revisa la documentación de Mercado Pago para Uruguay

---

**¡El sistema de créditos está listo para usar!** 🎉

Los usuarios ahora pueden comprar créditos y usar todas las funcionalidades de IA de la plataforma de manera controlada y monetizada.
