export type UserRole = 'paciente' | 'psicologo' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface UserCreateInput {
  email: string;
  password_hash: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  is_active?: boolean;
}

export interface UserUpdateInput {
  email?: string;
  password_hash?: string;
  role?: UserRole;
  first_name?: string;
  last_name?: string;
  last_login?: string;
  is_active?: boolean;
}
