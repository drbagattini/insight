'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import {
  HomeIcon,
  UserGroupIcon,
  UserPlusIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Pacientes', href: '/dashboard/patients', icon: UserGroupIcon },
  { name: 'Agregar Paciente', href: '/dashboard/patients/new', icon: UserPlusIcon },
  { name: 'Cuestionarios', href: '/dashboard/questionnaires', icon: ClipboardDocumentListIcon },
  { name: 'Calendario', href: '/dashboard/calendar', icon: CalendarIcon },
  { name: 'Reportes', href: '/dashboard/reports', icon: ChartBarIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white border-r">
      <div className="flex items-center justify-center h-16 border-b">
        <span className="text-xl font-semibold">Insight</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
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
