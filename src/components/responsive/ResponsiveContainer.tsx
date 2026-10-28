import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  className?: string;
}

/**
 * Container responsivo com padding e max-width adaptativos
 * 
 * Otimizado para evitar scroll horizontal e aproveitar espaço disponível
 */
export function ResponsiveContainer({
  children,
  maxWidth = 'full',
  padding = true,
  className,
}: ResponsiveContainerProps) {
  const maxWidths = {
    sm: 'max-w-screen-sm',   // 640px
    md: 'max-w-screen-md',   // 768px
    lg: 'max-w-screen-lg',   // 1024px
    xl: 'max-w-screen-xl',   // 1280px
    full: 'max-w-full',
  };

  const paddingClasses = padding
    ? 'px-4 sm:px-6 lg:px-8 xl:px-12 5xl:px-16'
    : '';

  return (
    <div
      className={cn(
        'mx-auto w-full',
        maxWidths[maxWidth],
        paddingClasses,
        className
      )}
    >
      {children}
    </div>
  );
}
