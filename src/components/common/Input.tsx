import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-gray-700 tracking-tight">
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 pointer-events-none text-gray-400 flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-white border ${
              error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-gray-300 focus:border-[#6F3C68] focus:ring-[#6F3C68]/20'
            } rounded-xl px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 transition-all outline-none focus:ring-3 disabled:bg-gray-50 disabled:text-gray-400 ${
              leftIcon ? 'pl-9' : ''
            } ${rightIcon ? 'pr-9' : ''} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-gray-400 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-600 font-medium leading-tight">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500 leading-tight">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
