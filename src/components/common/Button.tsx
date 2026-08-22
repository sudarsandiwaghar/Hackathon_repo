import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  // Padding Math: horizontal padding is strictly 2x vertical padding
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm rounded-xl gap-2 font-medium',
    lg: 'px-6 py-3 text-base rounded-xl gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary:
      'bg-[#4A1F45] text-white hover:bg-[#351532] active:scale-[0.98] shadow-sm transition-all duration-150 focus:ring-2 focus:ring-[#6F3C68]/40 focus:outline-none',
    secondary:
      'bg-[#F5EEF4] text-[#4A1F45] hover:bg-[#ebdbe9] active:scale-[0.98] transition-all duration-150 focus:ring-2 focus:ring-[#6F3C68]/40 focus:outline-none',
    outline:
      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all duration-150 focus:ring-2 focus:ring-gray-300 focus:outline-none',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98] shadow-sm transition-all duration-150 focus:ring-2 focus:ring-rose-400 focus:outline-none',
    ghost:
      'text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center whitespace-nowrap cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
