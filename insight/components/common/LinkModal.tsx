'use client';

import React from 'react';

interface LinkModalProps {
  link: string;
  onClose: () => void;
}

export default function LinkModal({ link, onClose }: LinkModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>
        <h2 className="text-lg font-semibold mb-4">Link del cuestionario</h2>
        <div className="flex items-center mb-4">
          <input
            type="text"
            readOnly
            value={link}
            className="flex-grow border border-gray-300 rounded-l px-3 py-2 focus:outline-none"
          />
          <button
            onClick={() => navigator.clipboard.writeText(link)}
            className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600"
          >
            Copiar
          </button>
        </div>
      </div>
    </div>
  );
}
