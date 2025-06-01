import React from 'react';

interface KpiCardProps {
  title: string;
  value: number;
  delta?: number | null;
  icon: React.ComponentType<{ className?: string }>;
}

export default function KpiCard({ title, value, delta, icon: Icon }: KpiCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
          {delta !== null && delta !== undefined && (
            <p className={`mt-2 text-sm ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
            </p>
          )}
        </div>
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
    </div>
  );
}
