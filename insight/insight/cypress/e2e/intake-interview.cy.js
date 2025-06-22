describe('Intake Interview Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.login()
  })

  it('should create first interview and open editor', () => {
    // Create a test patient first
    cy.createTestPatient({ name: 'Test Patient for Intake' })
    
    // Navigate to intake tab
    cy.get('[data-testid="intake-tab"]').click()
    
    // Should show empty state initially
    cy.contains('No hay entrevista inicial registrada').should('be.visible')
    cy.get('[data-testid="register-first-interview-btn"]').should('be.visible')
    
    // Click to create first interview
    cy.get('[data-testid="register-first-interview-btn"]').click()
    
    // Should show loading state
    cy.contains('Creando primera entrevista...').should('be.visible')
    
    // Should open editor after creation
    cy.get('[data-testid="intake-wizard-editor"]', { timeout: 10000 }).should('be.visible')
    
    // Should show step 1 of the wizard
    cy.contains('Paso 1').should('be.visible')
    cy.contains('Información General').should('be.visible')
  })

  it('should keep interview skeleton visible after refresh', () => {
    // Create a test patient and interview
    cy.createTestPatient({ name: 'Test Patient for Refresh' })
    cy.get('[data-testid="intake-tab"]').click()
    cy.get('[data-testid="register-first-interview-btn"]').click()
    
    // Wait for editor to load
    cy.get('[data-testid="intake-wizard-editor"]', { timeout: 10000 }).should('be.visible')
    
    // Fill some basic data to make it "meaningful"
    cy.get('textarea[name="motivoConsulta"]').type('Test consultation reason')
    cy.get('textarea[name="presentacion"]').type('Test presentation')
    
    // Save the interview
    cy.get('[data-testid="save-interview-btn"]').click()
    cy.contains('Entrevista guardada').should('be.visible')
    
    // Navigate away from editor
    cy.get('[data-testid="cancel-and-view-btn"]').click()
    
    // Should show skeleton view
    cy.get('[data-testid="intake-wizard-skeleton"]').should('be.visible')
    
    // Refresh the page
    cy.reload()
    
    // Should still show skeleton view (not empty state)
    cy.get('[data-testid="intake-wizard-skeleton"]').should('be.visible')
    cy.contains('No hay entrevista inicial registrada').should('not.exist')
  })

  it('should handle incomplete interview state correctly', () => {
    // Create a test patient and interview
    cy.createTestPatient({ name: 'Test Patient for Incomplete' })
    cy.get('[data-testid="intake-tab"]').click()
    cy.get('[data-testid="register-first-interview-btn"]').click()
    
    // Wait for editor to load
    cy.get('[data-testid="intake-wizard-editor"]', { timeout: 10000 }).should('be.visible')
    
    // Don't fill any meaningful data, just cancel
    cy.get('[data-testid="cancel-and-view-btn"]').click()
    
    // Should show incomplete state
    cy.contains('Entrevista creada pero incompleta').should('be.visible')
    cy.get('[data-testid="complete-interview-btn"]').should('be.visible')
    
    // Click complete interview button
    cy.get('[data-testid="complete-interview-btn"]').click()
    
    // Should open editor again
    cy.get('[data-testid="intake-wizard-editor"]').should('be.visible')
  })

  it('should not show duplicate buttons', () => {
    // Create a test patient
    cy.createTestPatient({ name: 'Test Patient for Buttons' })
    cy.get('[data-testid="intake-tab"]').click()
    
    // In empty state, should only show one "register first interview" button
    cy.get('button').contains('Registrar primera entrevista').should('have.length', 1)
    cy.get('button').contains('Registrar Nueva Entrevista').should('not.exist')
    
    // Create interview
    cy.get('[data-testid="register-first-interview-btn"]').click()
    cy.get('[data-testid="intake-wizard-editor"]', { timeout: 10000 }).should('be.visible')
    
    // Fill some data and save
    cy.get('textarea[name="motivoConsulta"]').type('Test reason')
    cy.get('[data-testid="save-interview-btn"]').click()
    cy.get('[data-testid="cancel-and-view-btn"]').click()
    
    // Should show edit button and optionally "register new" button
    cy.get('[data-testid="edit-interview-btn"]').should('be.visible')
    
    // Should not show the "register first interview" button anymore
    cy.get('button').contains('Registrar primera entrevista').should('not.exist')
  })
})
