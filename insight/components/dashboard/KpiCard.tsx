import React from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // Assuming Skeleton component exists

interface KpiCardProps {
  title: string;
  value: number | string;
  delta?: number | null;
  icon?: React.ElementType; // Icon is now optional and can be any React component type
  isLoading?: boolean;
  onClick?: () => void;
  bgColor?: string;    // e.g., 'bg-red-700'
  textColor?: string;  // e.g., 'text-white'
  className?: string;  // Allow additional classes
}

export default function KpiCard({
  title,
  value,
  delta,
  icon: Icon,
  isLoading = false,
  onClick,
  bgColor = 'bg-white',
  textColor = 'text-gray-900',
  className = '',
}: KpiCardProps) {
  const cardClasses = `
    p-6 rounded-lg shadow 
    ${bgColor} 
    ${textColor} 
    ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
    ${className}
  `;

  const titleColor = bgColor === 'bg-white' ? 'text-gray-600' : textColor;
  const valueColor = textColor;
  const deltaPositiveColor = bgColor === 'bg-white' ? 'text-green-600' : 'text-green-300';
  const deltaNegativeColor = bgColor === 'bg-white' ? 'text-red-600' : 'text-red-300';
  const iconColor = bgColor === 'bg-white' ? 'text-gray-400' : textColor;

  if (isLoading) {
    return (
      <div className={cardClasses}>
        <Skeleton className={`h-6 w-3/4 mb-2 ${bgColor === 'bg-white' ? '' : 'bg-gray-500/50'}`} />
        <Skeleton className={`h-8 w-1/2 mb-3 ${bgColor === 'bg-white' ? '' : 'bg-gray-500/50'}`} />
        <Skeleton className={`h-4 w-1/4 ${bgColor === 'bg-white' ? '' : 'bg-gray-500/50'}`} />
      </div>
    );
  }

  return (
    <div className={cardClasses.trim()} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${titleColor}`}>{title}</p>
          <p className={`mt-1 text-3xl font-semibold ${valueColor}`}>{value}</p>
          {delta !== null && delta !== undefined && (
            <p className={`mt-2 text-sm ${delta >= 0 ? deltaPositiveColor : deltaNegativeColor}`}>
              {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
            </p>
          )}
        </div>
        {Icon && <Icon className={`h-10 w-10 ${iconColor} opacity-80`} />}
      </div>
    </div>
  );
}

