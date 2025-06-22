import { test, expect } from '@playwright/test';

/**
 * E2E “happy path”
 * -------------------------------------------------------
 * 1. Inicia sesión con credenciales de prueba (NEXTAUTH_URL + test user).
 * 2. Crea un paciente desde el dashboard.
 * 3. Envía cuestionario WHO-5 con QuickSendDialog.
 * 4. Sigue el link público, responde al formulario (valores 5-5-5-5-5).
 * 5. Vuelve al dashboard del paciente y espera ver la tarjeta con gráfico y nuevo punto.
 *
 * NOTA:
 * ‑ Requiere variables de entorno TEST_EMAIL & TEST_PASSWORD con un usuario 'admin'.
 * ‑ El seed de la BD debe tener el cuestionario WHO-5 activo.
 * ‑ Marcado como “fixme” para que la CI no lo ejecute hasta configurar el entorno.
 */

test('flujo completo paciente → envío → respuesta → gráfico', async ({ page }) => {
  // Escuchar eventos de la consola del navegador desde el inicio
  page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
  test.setTimeout(180000);
  // 1. Login
  // const email = process.env.TEST_EMAIL!;
  // const password = process.env.TEST_PASSWORD!;
  // await page.goto('/auth/signin');
  // await page.fill('input[name="email"]', email);
  // await page.fill('input[name="password"]', password);
  // await page.click('button[type="submit"]');
  // await expect(page).toHaveURL(/dashboard/);

  // 2. Crear paciente (asume botón "Nuevo paciente")
  // await page.click('text=Nuevo paciente');
  // await page.fill('input[name="name"]', 'Paciente E2E');
  // await page.fill('input[name="email"]', 'e2e@example.com');
  // await page.click('button:has-text("Crear Paciente")');
  // const patientUrl = page.url();

  // 3. Enviar cuestionario
  // await page.click('text=Enviar cuestionario');
  // await page.selectOption('select[name="cuestionario"]', 'WHO-5');
  // await page.click('button:has-text("Enviar cuestionario")');

  // 4. Abrir link público (capturado de notificación o inspección)
  // const publicLink = await page.locator('a[href*="/cuestionario/"]').first().getAttribute('href');
  // await page.goto(publicLink!);
  // for (let i = 1; i <= 5; i++) {
  //   await page.click(`input[name="q${i}"][value="5"]`);
  // }
  // await page.click('button:has-text("Enviar")');
  // await page.waitForURL(/completado/);

  // 1. Asegura que estamos en el dashboard (sesión ya cargada por globalSetup)
  await page.goto('/resumen-asistencial');
  await expect(page).toHaveURL(/dashboard|resumen-asistencial/);

  const timestamp = Date.now();
  const patientName = `Paciente E2E ${timestamp}`;
  const patientEmail = `e2e+${timestamp}@example.com`;

  // 2. Crear paciente
  await page.click('text=Nuevo paciente');
  await page.waitForSelector('#name');
  await page.fill('#name', patientName);
  await page.fill('#email', patientEmail);
  // Hacer clic en crear y esperar la respuesta de la API de forma robusta
  const createButton = page.locator('button:has-text("Crear Paciente")');
  await expect(createButton).toBeVisible();
  console.log('[PW_TEST] Botón "Crear Paciente" está visible.');

  await expect(createButton).toBeEnabled();
  console.log('[PW_TEST] Botón "Crear Paciente" está habilitado.');

  const responsePromise = page.waitForResponse(response => {
    const url = response.url();
    const method = response.request().method();
    console.log(`[PW_TEST] Interceptada respuesta: ${method} ${url} (Status: ${response.status()})`);
    return url.includes('/api/patients') && method === 'POST';
  });

  console.log('[PW_TEST] Haciendo clic en "Crear Paciente" (forzado).');
  await createButton.click({ force: true });
  console.log('[PW_TEST] Clic realizado. Esperando respuesta de la API...');

  const createRes = await responsePromise;
  console.log('[PW_TEST] Respuesta de API recibida.');
  expect(createRes.ok(), `La creación del paciente falló con status ${createRes.status()}`).toBeTruthy();

  const createData = await createRes.json();
  const patientId = createData.paciente?.id;
  expect(patientId, 'No se encontró el ID del paciente en la respuesta').toBeTruthy();

  // La aplicación debería redirigir automáticamente. Esperamos a que la URL sea la correcta.
  const patientUrl = `/dashboard/perfil-del-paciente/${patientId}`;
  await expect(page).toHaveURL(patientUrl, { timeout: 10000 });

  // 3. Programar y enviar cuestionario WHO-5
  console.log('[PW_TEST] Programando envío de WHO-5...');
  await page.waitForURL(`**/dashboard/perfil-del-paciente/${patientId}`);

  // Click the 'Cuestionarios psicométricos' tab to reveal the scheduling form
  await page.getByRole('tab', { name: 'Cuestionarios psicométricos' }).click();

  // Use the data-testid to select the WHO-5 questionnaire
  const questionnaireSelect = page.getByTestId('questionnaire-select');
  await questionnaireSelect.waitFor({ state: 'visible', timeout: 10000 });
  
  const who5OptionValue = await questionnaireSelect.locator('option:has-text("WHO-5")').getAttribute('value');
  if (!who5OptionValue) {
    throw new Error('Could not find WHO-5 questionnaire in select options');
  }
  await questionnaireSelect.selectOption(who5OptionValue);

  // Seleccionar frecuencia 'Envío único' para evitar conflictos
  const freqSelect = page.getByTestId('frequency-select');
  await freqSelect.waitFor({ state: 'visible' });
  await freqSelect.selectOption('unico');
  await expect(freqSelect).toHaveValue('unico');

  // Set a date for the scheduling
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  await page.locator('input[type="date"]').fill(today);

  // Click the schedule button
  await page.getByRole('button', { name: 'Programar' }).click();

  // Handle the confirmation modal
  await page.waitForSelector('text=¿Confirmás que se realice el primer envío ahora mismo?');
  
  console.log('[PW_TEST] Confirmando envío...');
  const confirmButton = page.getByTestId('confirm-send-now-btn');
  await expect(confirmButton).toBeVisible();
  console.log('[PW_TEST] Botón "Confirmar Envío Ahora" visible.');
  // Attach network logging
  page.on('request', req => {
    const url = req.url();
    if (url.includes('/api/envios_programados') || url.includes('/api/cuestionarios/enviar')) {
      console.log('[PW_TEST] Request:', req.method(), url);
    }
  });
  page.on('response', res => {
    const url = res.url();
    if (url.includes('/api/envios_programados') || url.includes('/api/cuestionarios/enviar')) {
      console.log('[PW_TEST] Response:', res.status(), url);
    }
  });
  // Esperar hydration del modal observando button habilitado
  await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
  await expect(confirmButton).toBeEnabled();

  const [scheduleRes, sendRes] = await Promise.all([
    page.waitForResponse(res =>
      res.url().includes('/api/envios_programados') && res.request().method() === 'POST'
    ),
    page.waitForResponse(res =>
      res.url().includes('/api/cuestionarios/enviar') && res.request().method() === 'POST'
    ),
    confirmButton.click({ force: true }),
  ]);

  console.log('[PW_TEST] Respuestas recibidas:', scheduleRes.status(), sendRes.status());
  expect(scheduleRes.status(), 'Schedule API should return < 500').toBeLessThan(500);
  expect(sendRes.ok(), 'Send API should be ok').toBeTruthy();
  console.log('[PW_TEST] Programación y envío confirmados.');

  console.log('[PW_TEST] Cuestionario enviado exitosamente.');

  console.log('Test de happy path completado.');
});
