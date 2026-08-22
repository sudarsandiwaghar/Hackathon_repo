import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button.tsx';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Failed to load the requested information. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-white rounded-2xl border border-rose-100 shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mb-3 border border-rose-200">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-gray-900 mb-1">{title}</h4>
      <p className="text-xs text-gray-500 max-w-sm mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" leftIcon={<RotateCcw className="w-3.5 h-3.5" />} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
