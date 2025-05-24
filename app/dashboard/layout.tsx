'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isCalendarPage = pathname?.includes('/calendar');
  
  return (
    <div className={`flex bg-gray-50 ${isCalendarPage ? 'h-screen calendar-layout' : 'min-h-screen'}`}>
      <Sidebar />
      <div className={`flex-1 flex flex-col ${isCalendarPage ? 'overflow-hidden' : ''}`}>
        <Header />
        <main className={`flex-1 p-6 ${isCalendarPage ? 'overflow-y-auto' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
