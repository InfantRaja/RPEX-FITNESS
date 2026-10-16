import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  variant = 'rectangular',
  style,
  ...props
}) => {
  const variants = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={cn('skeleton', variants[variant], className)}
      style={{ width, height, ...style }}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="card p-5 space-y-3">
    <Skeleton height="20px" width="40%" />
    <Skeleton height="40px" width="60%" />
    <Skeleton height="16px" width="80%" />
  </div>
);

export const WorkoutCardSkeleton: React.FC = () => (
  <div className="card p-5 space-y-4">
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-1">
        <Skeleton height="20px" width="60%" />
        <Skeleton height="14px" width="40%" />
      </div>
      <Skeleton height="28px" width="70px" variant="text" />
    </div>
    <div className="flex gap-4">
      <Skeleton height="14px" width="80px" />
      <Skeleton height="14px" width="80px" />
    </div>
  </div>
);

export const StatCardSkeleton: React.FC = () => (
  <div className="card p-5 space-y-2">
    <Skeleton height="14px" width="50%" />
    <Skeleton height="36px" width="70%" />
    <Skeleton height="12px" width="40%" />
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="card p-5">
    <Skeleton height="20px" width="40%" className="mb-6" />
    <Skeleton height="200px" className="rounded-xl" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="card p-5 space-y-3">
    <Skeleton height="20px" width="30%" className="mb-4" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <Skeleton height="40px" width="40px" variant="circular" />
        <div className="flex-1 space-y-1.5">
          <Skeleton height="14px" width="50%" />
          <Skeleton height="12px" width="30%" />
        </div>
        <Skeleton height="14px" width="80px" />
      </div>
    ))}
  </div>
);

export const PageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex items-center justify-between">
      <Skeleton height="32px" width="200px" />
      <Skeleton height="40px" width="120px" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
    <ChartSkeleton />
    <TableSkeleton />
  </div>
);
