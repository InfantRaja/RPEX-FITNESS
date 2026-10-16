import React from 'react';
import { AlertTriangle, RefreshCw, Wifi } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center text-center py-16 px-4 ${className}`}>
    {icon && (
      <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4 text-text-muted">
        {icon}
      </div>
    )}
    <h3 className="text-base font-semibold text-text-primary mb-2">{title}</h3>
    {description && <p className="text-sm text-text-secondary mb-6 max-w-sm">{description}</p>}
    {action && (
      <Button onClick={action.onClick}>{action.label}</Button>
    )}
  </div>
);

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading data. Please try again.',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-4">
    <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mb-4">
      <AlertTriangle className="w-8 h-8 text-error" />
    </div>
    <h3 className="text-base font-semibold text-text-primary mb-2">{title}</h3>
    <p className="text-sm text-text-secondary mb-6 max-w-sm">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
        Try Again
      </Button>
    )}
  </div>
);

export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-4">
    <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-4">
      <Wifi className="w-8 h-8 text-warning" />
    </div>
    <h3 className="text-base font-semibold text-text-primary mb-2">Connection Problem</h3>
    <p className="text-sm text-text-secondary mb-6 max-w-sm">
      Unable to connect to the server. Please check your internet connection and try again.
    </p>
    {onRetry && (
      <Button onClick={onRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
        Retry
      </Button>
    )}
  </div>
);
