import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ResponsiveSectionProps {
  children: ReactNode;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

/**
 * Seção com espaçamento responsivo entre elementos filho
 * 
 * Use para agrupar seções com espaço consistente
 */
export function ResponsiveSection({
  children,
  spacing = 'md',
  direction = 'vertical',
  className,
}: ResponsiveSectionProps) {
  const spacingClasses = {
    vertical: {
      none: '',
      sm: 'space-y-3 sm:space-y-4',
      md: 'space-y-4 sm:space-y-6 lg:space-y-8',
      lg: 'space-y-6 sm:space-y-8 lg:space-y-10 xl:space-y-12',
    },
    horizontal: {
      none: '',
      sm: 'space-x-3 sm:space-x-4',
      md: 'space-x-4 sm:space-x-6 lg:space-x-8',
      lg: 'space-x-6 sm:space-x-8 lg:space-x-10 xl:space-x-12',
    },
  };

  return (
    <div
      className={cn(
        spacingClasses[direction][spacing],
        className
      )}
    >
      {children}
    </div>
  );
}
