import React from 'react';

export type StatusVariant =
  | 'Present'
  | 'Absent'
  | 'Half-day'
  | 'Leave'
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Paid'
  | 'Processed'
  | 'Active'
  | 'Inactive'
  | 'On Leave';

interface StatusBadgeProps {
  status: StatusVariant | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const getStyle = (s: string) => {
    switch (s.toLowerCase()) {
      case 'present':
      case 'approved':
      case 'paid':
      case 'active':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'half-day':
      case 'pending':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'absent':
      case 'rejected':
      case 'inactive':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
        };
      case 'leave':
      case 'processed':
      case 'on leave':
      default:
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
          dot: 'bg-sky-500',
        };
    }
  };

  const style = getStyle(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap leading-none ${sizeClasses} ${style.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
};
