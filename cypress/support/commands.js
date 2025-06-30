// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for login using cy.session for efficiency and robustness
Cypress.Commands.add('login', (
  email = Cypress.env('TEST_EMAIL'),
  password = Cypress.env('TEST_PASSWORD')
) => {
  cy.session([email, password], () => {
    cy.visit('/auth/login');

    // Programmatic login is faster and more reliable than UI interaction.
    // We get the CSRF token from the hidden input field NextAuth provides.
    cy.get('input[name="csrfToken"]').invoke('val').then((csrfToken) => {
      // Now we can make a direct API call to log in.
      cy.request({
        method: 'POST',
        url: '/api/auth/callback/credentials',
        failOnStatusCode: false, // We want to handle the 401 response manually
        form: true, // mimics a form submission
        body: {
          email,
          password,
          csrfToken,
          redirect: false, // We'll handle navigation ourselves
        },
      }).then((resp) => {
        // If login fails, we'll get a 401. This assertion will fail the test
        // and show a clear error message.
        expect(resp.status, 'authentication failed').to.eq(200);
        // A successful response body contains the URL to redirect to.
        expect(resp.body.url).to.include('/resumen-asistencial');
      });
    });
    
    // After the request, we should have the session cookies set.
    // Visit the dashboard to confirm we are logged in.
    cy.visit('/resumen-asistencial');
    cy.url().should('include', '/resumen-asistencial');

  }, {
    cacheAcrossSpecs: true,
  });

  // This part runs on every `cy.login()` call, after the session is 
  // either created or restored from cache.
  cy.visit('/resumen-asistencial');
  cy.url().should('include', '/resumen-asistencial');
});

// Custom command to create a test patient
Cypress.Commands.add('createTestPatient', (patientData = {}) => {
  const defaultData = {
    name: 'Test Patient',
    email: 'patient@test.com',
    phone: '+1234567890',
    ...patientData
  }
  
  cy.visit('/dashboard/patients')
  cy.get('[data-testid="add-patient-button"]').click()
  cy.get('input[name="name"]').type(defaultData.name)
  cy.get('input[name="email"]').type(defaultData.email)
  cy.get('input[name="phone"]').type(defaultData.phone)
  cy.get('button[type="submit"]').click()
  cy.url().should('match', /\/dashboard\/patients\/[a-f0-9-]+/)
})
