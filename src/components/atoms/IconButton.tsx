import { ReactNode } from 'react';

interface IconButtonProps {
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  variant?: 'primary' | 'subtle';
}

export function IconButton({ icon, onClick, disabled, className = '', children, variant = 'primary' }: IconButtonProps) {
  const baseStyles = 'px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300';
  
  const variantStyles = variant === 'primary' 
    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25'
    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 hover:scale-102 hover:shadow-sm';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variantStyles}
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
} 