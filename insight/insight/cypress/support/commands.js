// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for login
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.visit('/auth/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('include', '/dashboard')
})

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
