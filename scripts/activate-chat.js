// Script para activar el chat de supervisión clínica
const button = document.querySelector('button[class*="fixed bottom-6 right-6"]');
if (button) {
  button.click();
  console.log('Chat de supervisión activado');
} else {
  console.log('Botón no encontrado');
}
