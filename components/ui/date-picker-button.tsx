'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Calendar } from 'lucide-react';

interface DatePickerButtonProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePickerButton({ 
  value, 
  onChange, 
  placeholder = "Seleccionar", 
  className = "" 
}: DatePickerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateString: string) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.showPicker?.();
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        className={`justify-start text-left font-normal ${className} ${
          !value ? 'text-gray-500' : 'text-gray-900'
        }`}
      >
        <Calendar className="mr-2 h-3.5 w-3.5" />
        {formatDate(value)}
      </Button>
      
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        tabIndex={-1}
      />
    </div>
  );
}
