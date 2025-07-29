'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface HeaderContextType {
  onNewPatient?: () => void;
  onScheduleAppointment?: () => void;
  onSearch?: (term: string) => void;
  setHeaderActions: (actions: {
    onNewPatient?: () => void;
    onScheduleAppointment?: () => void;
    onSearch?: (term: string) => void;
  }) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [headerActions, setHeaderActions] = useState<{
    onNewPatient?: () => void;
    onScheduleAppointment?: () => void;
    onSearch?: (term: string) => void;
  }>({});

  const contextValue: HeaderContextType = {
    ...headerActions,
    setHeaderActions,
  };

  return (
    <HeaderContext.Provider value={contextValue}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}
