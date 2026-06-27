import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-3 font-semibold rounded-2xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-4 select-none';

  const variants = {
    primary:
      'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-400/30 focus:ring-yellow-300/40',
    secondary:
      'bg-black/35 hover:bg-yellow-400/15 text-yellow-100 border border-yellow-300/25 backdrop-blur-sm focus:ring-yellow-300/25',
    danger:
      'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30 focus:ring-red-400/40',
    ghost:
      'bg-transparent hover:bg-yellow-400/10 text-yellow-100/80 hover:text-yellow-200 focus:ring-yellow-300/20',
    success:
      'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-400/30 focus:ring-yellow-300/40',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed active:scale-100',
        className
      )}
    >
      {loading ? (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
};
