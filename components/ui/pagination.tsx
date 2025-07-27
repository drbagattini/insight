import React from 'react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange, 
  className 
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <nav className={cn('flex items-center justify-center space-x-2', className)}>
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={cn(
          'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md',
          'hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        Anterior
      </button>
      
      <span className="text-sm text-gray-700">
        Página {currentPage} de {totalPages}
      </span>

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={cn(
          'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md',
          'hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        Siguiente
      </button>
    </nav>
  );
};
