import React from "react";

export function SliderThumb({ value, color }: { value: number; color: string }) {
  return (
    <div
      className="absolute -top-8 left-1/2 transform -translate-x-1/2 pointer-events-none"
      style={{ color }}
    >
      <span className="font-bold text-base drop-shadow-sm">{value}</span>
    </div>
  );
}
