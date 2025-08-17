// lib/sse-utils.ts
// Utility functions for SSE functionality

// Store para conexiones SSE activas
const connections = new Map<string, ReadableStreamDefaultController>();

// Función para enviar actualización de balance a un usuario específico
export function sendBalanceUpdate(userId: string, balance: number, transaction?: any) {
  const controller = connections.get(userId);
  if (controller) {
    try {
      const data = `data: ${JSON.stringify({
        type: 'balance_update',
        balance,
        transaction,
        timestamp: Date.now()
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));
    } catch (error) {
      console.error('Error sending balance update:', error);
      connections.delete(userId);
    }
  }
}

// Función para enviar actualización a todos los usuarios conectados
export function broadcastUpdate(data: any) {
  connections.forEach((controller, userId) => {
    try {
      const message = `data: ${JSON.stringify({
        ...data,
        timestamp: Date.now()
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      console.error('Error broadcasting update:', error);
      connections.delete(userId);
    }
  });
}

// Función para registrar una conexión
export function registerConnection(userId: string, controller: ReadableStreamDefaultController) {
  connections.set(userId, controller);
}

// Función para eliminar una conexión
export function removeConnection(userId: string) {
  connections.delete(userId);
}
