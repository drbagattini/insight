'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import InsightLogo from '../common/InsightLogo';

const navigation = [
  { name: 'Resumen asistencial', href: '/resumen-asistencial', icon: HomeIcon },
  { name: 'Agenda', href: '/dashboard/calendar', icon: CalendarIcon },
  { name: 'Pacientes', href: '/dashboard/patients', icon: UserGroupIcon },
  { name: 'Cuestionarios', href: '/dashboard/questionnaires', icon: ClipboardDocumentListIcon },
  { name: 'Reportes', href: '/dashboard/reports', icon: ChartBarIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white border-r">
      {/* Logo centrado con protagonismo */}
      <div className="flex items-center justify-center h-16 border-b border-gray-100 px-4">
        <InsightLogo textSize="lg" href="/resumen-asistencial" />
      </div>
      {/* Navegación alineada a la izquierda con espaciado refinado */}
      <nav className="flex-1 px-5 pt-6 pb-4 space-y-1.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (pathname.startsWith('/dashboard/patients/') && item.href === '/dashboard/patients') ||
            (pathname.startsWith('/resumen-asistencial') && item.href === '/resumen-asistencial');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3.5 text-[15px] rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-600 shadow-sm'
                  : 'text-gray-700 font-medium hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              }`}>
                <item.icon className={`mr-3.5 transition-all duration-200 ${
                  isActive ? 'w-[22px] h-[22px] text-blue-600' : 'w-5 h-5'
                }`} />
                <span className="select-none tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
