"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRoleCheck } from "@/app/hooks/useRoleCheck";

export default function TestRolesPage() {
  const { data: session } = useSession();
  const { currentRole, isAdmin, isPsychologist } = useRoleCheck();

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-4">Test de Roles y Rutas</h1>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Estado de Sesión:</h2>
        <pre className="bg-white p-2 rounded text-sm">
          {JSON.stringify({ 
            authenticated: !!session,
            email: session?.user?.email,
            role: currentRole
          }, null, 2)}
        </pre>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">Acciones:</h2>
        {!session ? (
          <button
            onClick={() => signIn()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Iniciar Sesión
          </button>
        ) : (
          <button
            onClick={() => signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Cerrar Sesión
          </button>
        )}
      </div>

      {session && (
        <div className="space-y-4">
          <h2 className="font-semibold">Enlaces de Prueba:</h2>
          <div className="space-y-2">
            <a 
              href="/dashboard"
              className={`block p-2 rounded ${isPsychologist() || isAdmin() ? 'bg-green-100' : 'bg-red-100'}`}
            >
              /dashboard (Requiere: PSYCHOLOGIST o ADMIN)
            </a>
            <a 
              href="/admin"
              className={`block p-2 rounded ${isAdmin() ? 'bg-green-100' : 'bg-red-100'}`}
            >
              /admin (Requiere: ADMIN)
            </a>
            <a 
              href="/patients"
              className={`block p-2 rounded ${isPsychologist() || isAdmin() ? 'bg-green-100' : 'bg-red-100'}`}
            >
              /patients (Requiere: PSYCHOLOGIST o ADMIN)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
