import type { ReactNode, CSSProperties } from 'react';
import { cn } from '@/utils/cn';
import { useScreenDimensions } from '@/hooks/useScreenDimensions';

interface FullWidthGridProps {
  children: ReactNode;
  columns: number;
  gap?: number;
  className?: string;
}

/**
 * Grid que divide 100% da largura em N colunas iguais
 * Cada coluna recebe exatamente (100% / N) do espaço
 * Ajusta automaticamente em telas pequenas
 */
export function FullWidthGrid({
  children,
  columns: desiredColumns,
  gap = 16,
  className,
}: FullWidthGridProps) {
  const dimensions = useScreenDimensions();
  
  // Ajusta colunas para telas pequenas
  let columns = desiredColumns;
  if (dimensions.availableWidth < 640) {
    columns = 1; // Mobile: sempre 1 coluna
  } else if (dimensions.availableWidth < 1024) {
    columns = Math.min(desiredColumns, 2); // Tablet: max 2
  } else if (dimensions.availableWidth < 1280) {
    columns = Math.min(desiredColumns, 3); // Laptop: max 3
  }
  
  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`,
    width: '100%',
  };

  return (
    <div
      className={cn('w-full', className)}
      style={gridStyle}
      data-columns={columns}
    >
      {children}
    </div>
  );
}

interface ResponsiveColumnsProps {
  children: ReactNode;
  mobile?: number;
  tablet?: number;
  laptop?: number;
  desktop?: number;
  gap?: number;
  className?: string;
}

/**
 * Grid com número de colunas responsivo por breakpoint
 */
export function ResponsiveColumns({
  children,
  mobile = 1,
  tablet = 2,
  laptop = 3,
  desktop = 4,
  gap = 16,
  className,
}: ResponsiveColumnsProps) {
  // Usa Tailwind breakpoints com grid-cols-{n}
  const gridClasses = cn(
    'w-full grid',
    `grid-cols-${mobile}`,
    `sm:grid-cols-${tablet}`,
    `md:grid-cols-${laptop}`,
    `lg:grid-cols-${desktop}`,
    `gap-${Math.floor(gap / 4)}`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}
