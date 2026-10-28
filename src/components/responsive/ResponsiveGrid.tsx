import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ResponsiveGridProps {
  children: ReactNode;
  variant?: 'cards' | 'dashboard' | 'compact' | 'wide';
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}

/**
 * Grid responsivo otimizado para todas as resoluções
 * 
 * Variantes:
 * - cards: 1/2/3/4/6 colunas (mobile/tablet/laptop/desktop/ultrawide)
 * - dashboard: 1/2/3/4/5 colunas
 * - compact: 2/3/4/5/6 colunas (mais denso)
 * - wide: 1/1/2/3/4 colunas (mais espaçoso)
 */
export function ResponsiveGrid({
  children,
  variant = 'cards',
  className,
  gap = 'md',
}: ResponsiveGridProps) {
  const gridVariants = {
    cards: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 5xl:grid-cols-6',
    dashboard: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 5xl:grid-cols-5',
    compact: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 5xl:grid-cols-6',
    wide: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 5xl:grid-cols-4',
  };

  const gapSizes = {
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6 lg:gap-8',
    lg: 'gap-6 sm:gap-8 lg:gap-10',
  };

  return (
    <div
      className={cn(
        'grid',
        gridVariants[variant],
        gapSizes[gap],
        className
      )}
    >
      {children}
    </div>
  );
}
