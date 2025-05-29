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
  { name: 'Resumen asistencial', href: '/dashboard', icon: HomeIcon },
  { name: 'Agenda', href: '/dashboard/calendar', icon: CalendarIcon },
  { name: 'Pacientes', href: '/dashboard/patients', icon: UserGroupIcon },
  { name: 'Cuestionarios', href: '/dashboard/questionnaires', icon: ClipboardDocumentListIcon },
  { name: 'Reportes', href: '/dashboard/reports', icon: ChartBarIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white border-r">
      <div className="flex items-center justify-center h-20 border-b px-4">
        <InsightLogo textSize="lg" />
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
