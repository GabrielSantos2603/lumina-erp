import type { ReactNode, CSSProperties } from 'react';
import { cn } from '@/utils/cn';
import { useScreenDimensions, useOptimalColumns } from '@/hooks/useScreenDimensions';

interface DynamicGridProps {
  children: ReactNode;
  minCardWidth?: number;
  minCardHeight?: number;
  columns?: number; // Força número específico de colunas
  gap?: number;
  className?: string;
  density?: 'auto' | 'ultra-compact' | 'compact' | 'normal' | 'comfortable';
}

/**
 * Grid que calcula automaticamente colunas baseado no espaço real disponível
 * Maximiza uso de largura E altura da tela
 * Use prop `columns` para forçar número específico de colunas
 */
export function DynamicGrid({
  children,
  minCardWidth = 280,
  minCardHeight = 200,
  columns: forcedColumns,
  gap = 16,
  className,
  density = 'auto',
}: DynamicGridProps) {
  const dimensions = useScreenDimensions();
  const calculatedColumns = useOptimalColumns(minCardWidth);
  
  // Se columns foi forçado, ajusta responsivamente para telas pequenas
  let columns = forcedColumns || calculatedColumns;
  if (forcedColumns) {
    // Reduz colunas progressivamente em telas menores
    if (dimensions.availableWidth < 400) {
      columns = 1; // Telas muito pequenas: sempre 1 coluna
    } else if (dimensions.availableWidth < 640) {
      columns = Math.min(forcedColumns, 2); // Mobile: max 2 colunas
    } else if (dimensions.availableWidth < 1024) {
      columns = Math.min(forcedColumns, 3); // Tablet: max 3 colunas
    } else {
      columns = forcedColumns; // Laptop/Desktop: usar valor forçado (normalmente 4)
    }
  }

  // Usa densidade automática ou manual
  const finalDensity = density === 'auto' ? dimensions.density : density;

  // Calcula espaçamentos baseados na densidade
  const spacingConfig = {
    'ultra-compact': {
      gap: Math.max(6, gap * 0.4), // Gap mínimo 6px para mobile
      padding: '0.5rem',
      fontSize: '0.75rem',
    },
    'compact': {
      gap: Math.max(10, gap * 0.65),
      padding: '0.75rem',
      fontSize: '0.8125rem',
    },
    'normal': {
      gap: gap,
      padding: '1rem',
      fontSize: '0.9375rem',
    },
    'comfortable': {
      gap: gap * 1.25,
      padding: '1.25rem',
      fontSize: '1rem',
    },
    'spacious': {
      gap: gap * 1.5,
      padding: '1.5rem',
      fontSize: '1.0625rem',
    },
  };

  const config = spacingConfig[finalDensity];
  
  // Ajusta gap para telas muito pequenas
  let finalGap = config.gap;
  if (dimensions.availableWidth < 640) {
    finalGap = Math.max(8, finalGap * 0.5); // Reduz gap no mobile
  }

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`, // 1fr divide igualmente
    gap: `${finalGap}px`,
    fontSize: config.fontSize,
    width: '100%', // Usa 100% da largura
  };

  return (
    <div
      className={cn('w-full', className)}
      style={gridStyle}
      data-columns={columns}
      data-density={finalDensity}
      data-dimensions={`${dimensions.availableWidth}x${dimensions.availableHeight}`}
    >
      {children}
    </div>
  );
}

interface DynamicContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: false | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

/**
 * Container que ajusta padding baseado no espaço disponível
 */
export function DynamicContainer({
  children,
  className,
  maxWidth = 'full',
}: DynamicContainerProps) {
  const dimensions = useScreenDimensions();

  // Calcula padding dinâmico baseado na largura (ULTRA MÍNIMO para mobile)
  const getPadding = () => {
    if (dimensions.availableWidth < 400) return 'px-2 py-2'; // Telas muito pequenas
    if (dimensions.availableWidth < 640) return 'px-2 py-3'; // Mobile
    if (dimensions.availableWidth < 1024) return 'px-3 py-3'; // Tablet
    if (dimensions.availableWidth < 1536) return 'px-4 py-4'; // Laptop
    if (dimensions.availableWidth < 2560) return 'px-5 py-4'; // Desktop
    return 'px-6 py-5'; // Ultrawide
  };

  // Ignora maxWidth - sempre usa 100%
  const maxWidthClasses = {
    false: '',
    sm: '',
    md: '',
    lg: '',
    xl: '',
    '2xl': '',
    full: '',
  };

  return (
    <div
      className={cn(
        'w-full',
        getPadding(),
        maxWidth !== false && maxWidthClasses[maxWidth],
        className
      )}
      data-available-width={dimensions.availableWidth}
      data-density={dimensions.density}
    >
      {children}
    </div>
  );
}

interface DynamicSpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Espaçador que ajusta baseado na densidade da tela
 */
export function DynamicSpacer({ size = 'md', className }: DynamicSpacerProps) {
  const dimensions = useScreenDimensions();

  const sizeMap = {
    'ultra-compact': { xs: 8, sm: 12, md: 16, lg: 20, xl: 24 },
    'compact': { xs: 12, sm: 16, md: 20, lg: 24, xl: 32 },
    'normal': { xs: 16, sm: 20, md: 24, lg: 32, xl: 40 },
    'comfortable': { xs: 20, sm: 24, md: 32, lg: 40, xl: 48 },
    'spacious': { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 },
  };

  const height = sizeMap[dimensions.density][size];

  return <div className={className} style={{ height: `${height}px` }} />;
}

interface AdaptiveTextProps {
  children: ReactNode;
  variant?: 'body' | 'small' | 'large' | 'heading';
  className?: string;
}

/**
 * Texto que ajusta tamanho baseado na densidade
 */
export function AdaptiveText({
  children,
  variant = 'body',
  className,
}: AdaptiveTextProps) {
  const dimensions = useScreenDimensions();

  const sizeMap = {
    'ultra-compact': {
      body: 'text-xs',
      small: 'text-[0.625rem]',
      large: 'text-sm',
      heading: 'text-base',
    },
    'compact': {
      body: 'text-sm',
      small: 'text-xs',
      large: 'text-base',
      heading: 'text-lg',
    },
    'normal': {
      body: 'text-base',
      small: 'text-sm',
      large: 'text-lg',
      heading: 'text-xl',
    },
    'comfortable': {
      body: 'text-base',
      small: 'text-sm',
      large: 'text-lg',
      heading: 'text-2xl',
    },
    'spacious': {
      body: 'text-lg',
      small: 'text-base',
      large: 'text-xl',
      heading: 'text-3xl',
    },
  };

  const sizeClass = sizeMap[dimensions.density][variant];

  return <div className={cn(sizeClass, className)}>{children}</div>;
}
