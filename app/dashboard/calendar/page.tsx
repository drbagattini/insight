'use client';
import CalendarView from '@/components/CalendarView';

export default function CalendarPage() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Título principal y controles */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Mi agenda</h1>
          <p className="text-lg text-gray-600">Gestiona tus citas y horarios</p>
        </div>
        
        {/* Botón de acción */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v2a1 1 0 01-1 1h-3v3a1 1 0 01-1 1H9a1 1 0 01-1-1v-3H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
            </svg>
            Programar cita
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <CalendarView />
      </div>
    </div>
  );
}
