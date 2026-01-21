import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  variant?: 'default' | 'dark' | 'light';
}

export function GlassCard({
  children,
  className,
  hover = true,
  glow = false,
  variant = 'default',
  ...props
}: GlassCardProps) {
  const variants = {
    default: 'bg-white/5 border-white/10',
    dark: 'bg-black/20 border-white/5',
    light: 'bg-white/10 border-white/20',
  };

  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'relative rounded-2xl backdrop-blur-lg border p-6',
        'shadow-xl shadow-black/20',
        variants[variant],
        glow && 'animate-glow',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
}

export function GlassButton({
  children,
  className,
  variant = 'default',
  size = 'md',
  ...props
}: GlassButtonProps) {
  const variants = {
    default: 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/30',
    primary: 'bg-primary-500/20 hover:bg-primary-500/30 border-primary-500/30 hover:border-primary-500/50 text-primary-300',
    success: 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30 hover:border-green-500/50 text-green-300',
    danger: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30 hover:border-red-500/50 text-red-300',
    warning: 'bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/30 hover:border-yellow-500/50 text-yellow-300',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'rounded-xl backdrop-blur-sm border font-medium',
        'transition-all duration-200 cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info';
  children: ReactNode;
  pulse?: boolean;
}

export function StatusBadge({ status, children, pulse = false }: StatusBadgeProps) {
  const statusClasses = {
    success: 'bg-green-500/20 border-green-500/30 text-green-400',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
        'backdrop-blur-sm border',
        statusClasses[status]
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              status === 'success' && 'bg-green-400',
              status === 'warning' && 'bg-yellow-400',
              status === 'error' && 'bg-red-400',
              status === 'info' && 'bg-blue-400'
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              status === 'success' && 'bg-green-500',
              status === 'warning' && 'bg-yellow-500',
              status === 'error' && 'bg-red-500',
              status === 'info' && 'bg-blue-500'
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function MetricCard({ label, value, icon, trend, className }: MetricCardProps) {
  return (
    <GlassCard className={cn('p-4', className)} hover={false}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-white/60">{label}</span>
          <span className="text-2xl font-bold gradient-text">{value}</span>
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-white/5 text-primary-400">{icon}</div>
        )}
      </div>
      {trend && (
        <div
          className={cn(
            'mt-2 text-xs',
            trend === 'up' && 'text-green-400',
            trend === 'down' && 'text-red-400',
            trend === 'neutral' && 'text-white/40'
          )}
        >
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {trend === 'neutral' && '→'}
        </div>
      )}
    </GlassCard>
  );
}
