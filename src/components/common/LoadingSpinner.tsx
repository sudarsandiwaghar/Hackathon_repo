import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading Dayflow data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[300px]">
      <Loader2 className="w-8 h-8 text-[#4A1F45] animate-spin mb-3" />
      <p className="text-sm font-medium text-gray-600">{message}</p>
    </div>
  );
};
