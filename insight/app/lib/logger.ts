import debug from 'debug';

// Namespaced loggers for different layers
export const logIntake = debug('app:intake');
export const logApiIntake = debug('api:intake');

// You can add more namespaces as needed (e.g. wizard, scheduler)
