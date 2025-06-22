'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // El SessionProvider necesita envolver el contenido donde se usa useSession
  return <SessionProvider>{children}</SessionProvider>;
}
