# Configuración de Gemini API para Síntesis IA

## Variables de Entorno Requeridas

Para que funcione la síntesis IA con Gemini, necesitas agregar la siguiente variable a tu archivo `.env.local`:

```bash
# Gemini API Key para síntesis de evoluciones clínicas
GEMINI_API_KEY=tu_api_key_aqui
```

## Cómo obtener tu API Key de Gemini:

1. Ve a [Google AI Studio](https://aistudio.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Ve a "Get API Key" 
4. Crea una nueva API key
5. Copia la key y agrégala a tu `.env.local`

## Modelo Utilizado:

- **Modelo**: `gemini-2.0-flash-exp`
- **Costo aproximado**: ~$0.075 por 1M tokens de entrada, ~$0.30 por 1M tokens de salida
- **Uso**: Solo bajo demanda cuando el usuario solicita síntesis

## Funcionalidad:

La síntesis IA permite:
- Seleccionar un rango de fechas de evoluciones clínicas
- Generar un resumen coherente y clínicamente relevante
- Guardar la síntesis como una nueva entrada de tipo "supervision"
- Control total de costos (solo se ejecuta cuando se solicita)

## Seguridad:

- La API key debe mantenerse privada
- Solo usuarios autenticados pueden usar la síntesis
- Los datos se procesan de forma segura sin almacenamiento permanente en Google
