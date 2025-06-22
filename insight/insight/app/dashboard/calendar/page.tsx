'use client';
import CalendarView from '@/components/CalendarView';

export default function CalendarPage() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <CalendarView />
      </div>
    </div>
  );
}
