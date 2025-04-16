export const UserRole = {
  ADMIN: 'admin',
  PSICOLOGO: 'psicologo',
  PACIENTE: 'paciente',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];
