import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  rightIcon,
  disabled,
  children,
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-accent text-background font-semibold hover:shadow-accent hover:scale-[1.02] active:scale-[0.98]',
    secondary: 'bg-surface text-text-primary border border-border hover:border-accent hover:text-accent',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface',
    danger: 'bg-error/10 text-error border border-error/20 hover:bg-error hover:text-white',
    outline: 'border border-border text-text-primary hover:border-accent hover:text-accent bg-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3.5 text-base rounded-2xl gap-2.5',
    icon: 'p-2.5 rounded-xl',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : leftIcon ? (
        leftIcon
      ) : null}
      {children}
      {!isLoading && rightIcon && rightIcon}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
