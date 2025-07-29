# 🔍 ANÁLISIS DETALLADO DE PROBLEMAS POST-MIGRACIÓN
## Plan Metódico de Diagnóstico y Solución

---

## 📊 **PROBLEMAS IDENTIFICADOS**

### **1. 👤 Problema de Identificación del Psicólogo**
**Síntoma:** "Hola Psicólogo Temporal" en lugar del nombre real
**Análisis:** El token de NextAuth no está pasando correctamente el nombre
**Prioridad:** 🔴 ALTA

### **2. ⏱️ Problema de Performance/UX**
**Síntoma:** "Pensando" mucho tiempo sin mostrar texto progresivo
**Análisis:** Falta streaming de respuesta en tiempo real
**Prioridad:** 🟡 MEDIA

### **3. 💬 Problema de Interfaz de Chat**
**Síntoma:** Pregunta descolorida en cuadro de texto, no en chat
**Análisis:** UI no actualiza correctamente el estado del chat
**Prioridad:** 🟡 MEDIA

### **4. 📋 Problema de Acceso a Preguntas OPD-CA2-SQ**
**Síntoma:** Sabe respuestas numéricas pero no preguntas cualitativas (81 ítems)
**Análisis:** Falta metadata de preguntas en el JSON enviado a GPT-4o
**Prioridad:** 🔴 ALTA

### **5. 📄 Problema de Acceso a Informes**
**Síntoma:** No tiene acceso a informes generados
**Análisis:** Informes no incluidos en el contexto inicial
**Prioridad:** 🟠 MEDIA-ALTA

### **6. 📝 Problema de Acceso a Evolución Clínica**
**Síntoma:** No accede a entradas de evolución clínica
**Análisis:** Datos de evolución no incluidos en JSON inicial
**Prioridad:** 🟠 MEDIA-ALTA

### **7. 📊 Problema de Estructura de Entrevista Inicial**
**Síntoma:** No respeta modales/secciones de la entrevista
**Análisis:** Datos enviados sin estructura organizacional
**Prioridad:** 🟡 MEDIA

---

## 🎯 **PLAN DE ACCIÓN PASO A PASO**

### **FASE 1: DIAGNÓSTICO DETALLADO (30 min)**
1. **Analizar token de NextAuth** - ¿Qué datos contiene?
2. **Revisar JSON enviado a GPT-4o** - ¿Qué falta?
3. **Verificar estructura de datos** - ¿Están completos?
4. **Analizar componente UI** - ¿Cómo maneja el chat?

### **FASE 2: SOLUCIONES CRÍTICAS (60 min)**
1. **Arreglar identificación del psicólogo**
2. **Incluir preguntas OPD-CA2-SQ completas**
3. **Agregar informes generados al contexto**
4. **Incluir evolución clínica**

### **FASE 3: MEJORAS DE UX (45 min)**
1. **Implementar streaming de respuestas**
2. **Arreglar interfaz de chat**
3. **Estructurar entrevista inicial**

### **FASE 4: TESTING Y VALIDACIÓN (30 min)**
1. **Probar cada funcionalidad**
2. **Verificar calidad de respuestas**
3. **Confirmar acceso a todos los datos**

---

## 🔧 **HIPÓTESIS DE CAUSAS**

### **Problema 1: Token NextAuth**
- El token no contiene el nombre completo del usuario
- La consulta a la base de datos del psicólogo falla
- Los datos del token están mal estructurados

### **Problema 4: OPD-CA2-SQ**
- Las preguntas no están en `questionnairesMeta.ts`
- La base de datos no tiene las preguntas completas
- El JSON no incluye las preguntas, solo las respuestas

### **Problemas 5-6: Contexto Incompleto**
- Los informes no se consultan en el endpoint de datos
- La evolución clínica no se incluye en la consulta
- El JSON inicial es incompleto

### **Problema 7: Estructura de Datos**
- Los datos de entrevista se envían como array plano
- Falta organización por secciones/modales
- GPT-4o no recibe la estructura organizacional

---

## 📝 **ORDEN DE EJECUCIÓN**

1. **🔍 DIAGNÓSTICO:** Analizar qué datos llegan realmente a GPT-4o
2. **👤 PSICÓLOGO:** Arreglar identificación del usuario
3. **📋 OPD-CA2-SQ:** Incluir preguntas completas
4. **📄 CONTEXTO:** Agregar informes y evolución clínica
5. **💬 UX:** Mejorar interfaz y streaming
6. **🧪 TESTING:** Validar todas las funcionalidades

---

## 🎯 **RESULTADO ESPERADO**

Al completar este plan:
- ✅ GPT-4o saludará con el nombre real del psicólogo
- ✅ Tendrá acceso completo a preguntas OPD-CA2-SQ
- ✅ Podrá consultar informes generados
- ✅ Accederá a evolución clínica
- ✅ Respuestas más rápidas con streaming
- ✅ Interfaz de chat funcionando correctamente
- ✅ Entrevista inicial bien estructurada

**TIEMPO ESTIMADO TOTAL: 2.5 horas**
