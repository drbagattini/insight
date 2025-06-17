'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { data: session } = useSession();


  const pathname = usePathname() || '';
  let headerTitle = 'Dashboard';
  
  // Mapeo de rutas a títulos
  const routeTitles: Record<string, string> = {
    '/dashboard': 'Resumen asistencial',
    '/dashboard/profile': 'Mi Perfil',
    '/dashboard/calendar': 'Agenda',
    '/dashboard/patients': 'Pacientes',
    '/dashboard/questionnaires': 'Cuestionarios',
    '/dashboard/reports': 'Reportes'
  };

  // Determinar el título basado en la ruta
  headerTitle = routeTitles[pathname] || headerTitle;

  // Para rutas dinámicas como /dashboard/patients/[id]
  if (pathname.startsWith('/dashboard/patients/') && pathname.split('/').length === 4) {
    headerTitle = 'Seguimiento clínico';
  }

  // Siempre mostrar el título en el header
  const hideTitle = false;

  return (
    <header className="bg-white border-b">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center space-x-6">
          {!hideTitle && (
            <h1 className="text-lg font-semibold text-gray-900">{headerTitle}</h1>
          )}
        </div>

        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center space-x-3 text-sm">
            <span className="font-semibold text-gray-700">
              {session?.user?.firstName && session?.user?.lastName
                ? `${session.user.firstName} ${session.user.lastName}`
                : session?.user?.name || 'Usuario'}
            </span>
            {session?.user?.image_url ? (
              <img
                className="w-8 h-8 rounded-full object-cover"
                src={session.user.image_url}
                alt="Foto de perfil"
              />
            ) : (
              <UserCircleIcon className="w-8 h-8 text-gray-400" />
            )}
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            {/* Elevate dropdown above other UI elements */}
            <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="/dashboard/profile"
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } block px-4 py-2 text-sm text-gray-700`}
                  >
                    Mi Perfil
                  </a>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => signOut()}
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                  >
                    Cerrar Sesión
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
}
