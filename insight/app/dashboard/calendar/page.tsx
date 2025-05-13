'use client';
import CalendarView from '@/components/CalendarView';

export default function CalendarPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Agenda</h1>
      <CalendarView />
    </div>
  );
}
