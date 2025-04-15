export const UserRole = {
  ADMIN: 'ADMIN',
  PSYCHOLOGIST: 'PSYCHOLOGIST',
  USER: 'USER',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];
