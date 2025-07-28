# Limitaciones de Cuota de Gemini API

## 🚨 Problema Actual

Estás experimentando errores **429 Too Many Requests** porque has excedido las cuotas del **tier gratuito** de Gemini API.

## 📊 Límites del Tier Gratuito

### Gemini 1.5 Flash (Gratuito)
- **Requests por minuto**: 15
- **Requests por día**: 1,500
- **Tokens por minuto**: 1 millón

### Gemini 1.5 Pro (Gratuito)
- **Requests por minuto**: 2
- **Requests por día**: 50
- **Tokens por minuto**: 32,000

### Gemini 2.5 Pro (Gratuito)
- **Requests por minuto**: 2
- **Requests por día**: 50
- **Tokens por minuto**: 32,000

## 🔧 Soluciones

### Opción 1: Esperar (Recomendado para desarrollo)
- **Espera 1 hora** para que se restablezcan los límites por minuto
- **Espera hasta mañana** para que se restablezcan los límites diarios

### Opción 2: Upgrade a Plan Pago
1. Ve a [Google AI Studio](https://aistudio.google.com/)
2. Configura billing en tu proyecto
3. Los límites aumentan significativamente:
   - **Gemini 1.5 Flash**: 1,000 RPM, 50,000 RPD
   - **Gemini 1.5 Pro**: 360 RPM, 10,000 RPD

### Opción 3: Optimizar Uso (Temporal)
- Reduce la frecuencia de pruebas
- Usa mensajes más cortos
- Evita múltiples conversaciones simultáneas

## 🛠️ Cambios Implementados

He actualizado el código para:
- ✅ Usar la misma implementación de Gemini que ya funciona en informes
- ✅ Cambiar de `GoogleGenerativeAI` SDK a API REST directa
- ✅ Usar `gemini-2.5-pro` (mismo que informes)
- ✅ Manejo específico de errores 429
- ✅ Mensajes informativos para el usuario

## 📝 Mensaje de Error Mejorado

Ahora cuando excedas la cuota verás:
> "Has excedido la cuota de la API de Gemini. Espera unos minutos antes de intentar nuevamente."

## 🔍 Verificar Estado de Cuota

Puedes verificar tu uso actual en:
- [Google Cloud Console](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas)
- [Google AI Studio](https://aistudio.google.com/)

## ⏰ Recomendación Inmediata

**Espera 1 hora** antes de probar nuevamente el chat de supervisión. Los límites se restablecen cada hora y cada día.

Si necesitas usar la funcionalidad inmediatamente, considera configurar billing en tu proyecto de Google Cloud.
