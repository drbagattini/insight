'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white shadow-md border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-end">
        {/* Perfil del profesional */}
        <Menu as="div" className="relative flex-shrink-0">
          <Menu.Button className="flex items-center space-x-3 text-sm">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {session?.user?.firstName && session?.user?.lastName
                  ? `${session.user.firstName} ${session.user.lastName}`
                  : session?.user?.name || 'Nicolás Bagattini'}
              </p>
            </div>
            {session?.user?.image_url ? (
              <img
                className="h-10 w-10 rounded-full object-cover shadow-lg"
                src={session.user.image_url}
                alt="Foto de perfil"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                <span className="text-sm font-semibold text-white">NB</span>
              </div>
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
