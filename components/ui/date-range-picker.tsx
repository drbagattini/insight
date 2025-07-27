'use client';

import { useState } from 'react';
import { Button } from './button';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

const QUICK_RANGES = [
  { label: 'Última semana', days: 7 },
  { label: 'Últimas 2 semanas', days: 14 },
  { label: 'Último mes', days: 30 },
  { label: 'Últimos 3 meses', days: 90 },
];

export function DateRangePicker({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(false);

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    onEndDateChange(end.toISOString().split('T')[0]);
    onStartDateChange(start.toISOString().split('T')[0]);
    setShowCustom(false);
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Seleccionar período';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Período de análisis</span>
      </div>
      
      {/* Rangos rápidos */}
      <div className="grid grid-cols-2 gap-2">
        {QUICK_RANGES.map((range) => (
          <Button
            key={range.days}
            onClick={() => handleQuickRange(range.days)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {range.label}
          </Button>
        ))}
      </div>
      
      {/* Selector personalizado */}
      <div className="border-t pt-3">
        <Button
          onClick={() => setShowCustom(!showCustom)}
          variant="ghost"
          size="sm"
          className="w-full justify-between text-sm"
        >
          <span>{formatDateRange()}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showCustom ? 'rotate-180' : ''}`} />
        </Button>
        
        {showCustom && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
