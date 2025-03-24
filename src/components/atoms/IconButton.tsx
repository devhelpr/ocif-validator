import { ReactNode } from 'react';

interface IconButtonProps {
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  as?: 'button' | 'div';
}

export function IconButton({ icon, children, onClick, className = '', as = 'button' }: IconButtonProps) {
  const baseClassName = `px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium flex items-center gap-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 ${className}`;

  if (as === 'div') {
    return (
      <div onClick={onClick} className={baseClassName}>
        {icon}
        {children}
      </div>
    );
  }

  return (
    <button onClick={onClick} className={baseClassName}>
      {icon}
      {children}
    </button>
  );
} 