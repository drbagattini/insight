'use client';

import { useSession } from 'next-auth/react';
import { UserCircleIcon, ArrowUpTrayIcon } from '@heroicons/react/24/solid';
import ConnectCalendarButton from '@/components/auth/ConnectCalendarButton';
import { useState, useRef, useEffect } from 'react';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Set initial image URL from session
  useEffect(() => {
    if (session?.user?.image_url) {
      setImageUrl(session.user.image_url);
    }
  }, [session]);

  // Update preview when file changes
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      // Basic file type validation
      if (!selectedFile.type.startsWith('image/')) {
        setError('Por favor, selecciona un archivo de imagen válido');
        return;
      }
      // Limit file size to 5MB
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);
    
    try {
      const res = await fetch('/api/profile', { 
        method: 'PUT', 
        body: formData,
        credentials: 'include' // Asegura que las cookies se envíen
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al subir la imagen');
      }
      
      // Actualizar la URL de la imagen localmente
      if (data.image_url) {
        setImageUrl(data.image_url);
        
        // Actualizar la sesión
        await update({
          ...session,
          user: {
            ...session?.user,
            image_url: data.image_url
          }
        });
      }
      
      // Resetear el input de archivo
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Ocurrió un error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso denegado</h2>
          <p className="text-gray-600 mb-6">Por favor, inicia sesión para ver esta página.</p>
          <a 
            href="/auth/signin" 
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  const { user } = session;
  const currentImage = preview || imageUrl || null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column - Profile Picture */}
              <div className="md:w-1/3 flex flex-col items-center">
                <div className="relative">
                  <div className="w-40 h-40 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-md">
                    {currentImage ? (
                      <img 
                        src={currentImage} 
                        alt="Foto de perfil" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-full h-full text-gray-400" />
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <label 
                      htmlFor="profile-picture" 
                      className="cursor-pointer flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                      {currentImage ? 'Cambiar foto' : 'Subir foto'}
                    </label>
                    <input
                      id="profile-picture"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                
                {file && (
                  <div className="mt-4 w-full space-y-2">
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-white ${isUploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
                    >
                      {isUploading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Subiendo...
                        </>
                      ) : (
                        'Guardar cambios'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                
                {error && (
                  <div className="mt-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </div>
              
              {/* Right Column - User Info */}
              <div className="md:w-2/3 mt-6 md:mt-0">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Información Personal</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre completo
                      </label>
                      <div className="mt-1">
                        <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700">
                          {user.firstName || 'No especificado'} {user.lastName || ''}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Correo electrónico
                      </label>
                      <div className="mt-1">
                        <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700">
                          {user.email || 'No especificado'}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Rol
                      </label>
                      <div className="mt-1">
                        <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 capitalize">
                          {user.role || 'usuario'}
                        </div>
                      </div>
                    </div>
                    {/* Connect Calendar Button Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Integraciones de Calendario
                      </label>
                      <div className="mt-1">
                        <ConnectCalendarButton />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
