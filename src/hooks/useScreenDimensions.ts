import { useState, useEffect } from 'react';

export interface ScreenDimensions {
  width: number;
  height: number;
  availableWidth: number;
  availableHeight: number;
  density: 'ultra-compact' | 'compact' | 'normal' | 'comfortable' | 'spacious';
  scale: number;
  isVerticalScreen: boolean;
}

/**
 * Hook que retorna dimensões exatas da tela em pixels
 * e calcula densidade ideal para maximizar uso do espaço
 */
export function useScreenDimensions(): ScreenDimensions {
  const [dimensions, setDimensions] = useState<ScreenDimensions>(() => 
    calculateDimensions()
  );

  useEffect(() => {
    function handleResize() {
      setDimensions(calculateDimensions());
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Recheck após renderização
    const timer = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return dimensions;
}

function calculateDimensions(): ScreenDimensions {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Considera espaço ocupado por header
  // Sidebar não desconta pois o conteúdo já tem padding-left no AppLayout
  const headerHeight = 80; // altura do header
  
  const availableWidth = width; // Usa largura total
  const availableHeight = height - headerHeight;

  // Calcula densidade baseada no espaço disponível
  const totalSpace = availableWidth * availableHeight;
  let density: ScreenDimensions['density'];
  let scale: number;

  if (totalSpace < 400000) { // < 800x600
    density = 'ultra-compact';
    scale = 0.85;
  } else if (totalSpace < 800000) { // < 1024x768
    density = 'compact';
    scale = 0.9;
  } else if (totalSpace < 1500000) { // < 1366x1024
    density = 'normal';
    scale = 1.0;
  } else if (totalSpace < 2500000) { // < 1920x1200
    density = 'comfortable';
    scale = 1.05;
  } else {
    density = 'spacious';
    scale = 1.1;
  }

  const isVerticalScreen = height > width;

  return {
    width,
    height,
    availableWidth,
    availableHeight,
    density,
    scale,
    isVerticalScreen,
  };
}

/**
 * Retorna número ideal de colunas baseado na largura disponível
 * e largura mínima do card
 */
export function useOptimalColumns(minCardWidth: number = 280): number {
  const { availableWidth } = useScreenDimensions();
  
  // Considera padding do container (ajustado dinamicamente)
  const containerPadding = availableWidth < 640 ? 16 : 
                          availableWidth < 1024 ? 24 : 
                          availableWidth < 1536 ? 32 : 
                          availableWidth < 2560 ? 40 : 48;
  
  // Estima número de colunas primeiro para calcular gaps corretamente
  const roughColumns = Math.floor((availableWidth - containerPadding) / minCardWidth);
  const gapSize = 16; // gap padrão
  const totalGaps = Math.max(0, roughColumns - 1) * gapSize;
  
  const usableWidth = availableWidth - containerPadding - totalGaps;
  const idealColumns = Math.floor(usableWidth / minCardWidth);
  
  // Limita entre 1 e 10 colunas (aumentado para telas ultrawide)
  return Math.max(1, Math.min(10, idealColumns));
}

/**
 * Retorna número ideal de linhas visíveis baseado na altura disponível
 */
export function useOptimalRows(minCardHeight: number = 200): number {
  const { availableHeight } = useScreenDimensions();
  
  // Considera espaçamento entre cards e margens
  const verticalSpacing = 32; // margens top/bottom
  const gapTotal = 16 * 2; // gaps entre 3 linhas
  const usableHeight = availableHeight - verticalSpacing - gapTotal;
  
  const idealRows = Math.floor(usableHeight / minCardHeight);
  
  // Limita entre 1 e 6 linhas
  return Math.max(1, Math.min(6, idealRows));
}
