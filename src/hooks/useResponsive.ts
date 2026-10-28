import { useState, useEffect } from 'react';
import { mediaQueries } from '@/config/responsive';

export type ScreenSize = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide';
export type Orientation = 'portrait' | 'landscape';

interface UseResponsiveReturn {
  screenSize: ScreenSize;
  orientation: Orientation;
  isMobile: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isUltrawide: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  width: number;
  height: number;
  // Helpers para layouts
  columns: {
    cards: number;
    dashboard: number;
  };
  showSidebar: boolean;
  sidebarCollapsed: boolean;
}

export function useResponsive(): UseResponsiveReturn {
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDimensions({ width, height });

      // Detectar tamanho
      if (mediaQueries.isUltrawide()) {
        setScreenSize('ultrawide');
      } else if (mediaQueries.isDesktop()) {
        setScreenSize('desktop');
      } else if (mediaQueries.isLaptop()) {
        setScreenSize('laptop');
      } else if (mediaQueries.isTablet()) {
        setScreenSize('tablet');
      } else {
        setScreenSize('mobile');
      }

      // Detectar orientação
      setOrientation(mediaQueries.isPortrait() ? 'portrait' : 'landscape');
    };

    updateScreenSize();

    window.addEventListener('resize', updateScreenSize);
    window.addEventListener('orientationchange', updateScreenSize);

    return () => {
      window.removeEventListener('resize', updateScreenSize);
      window.removeEventListener('orientationchange', updateScreenSize);
    };
  }, []);

  // Calcular número de colunas ideal
  const getColumns = () => {
    switch (screenSize) {
      case 'ultrawide':
        return { cards: 6, dashboard: 5 };
      case 'desktop':
        return { cards: 4, dashboard: 4 };
      case 'laptop':
        return { cards: 3, dashboard: 3 };
      case 'tablet':
        return { cards: 2, dashboard: 2 };
      default:
        return { cards: 1, dashboard: 1 };
    }
  };

  // Sidebar deve ser visível?
  const showSidebar = screenSize !== 'mobile';
  
  // Sidebar deve iniciar colapsado?
  const sidebarCollapsed = screenSize === 'tablet' || screenSize === 'laptop';

  return {
    screenSize,
    orientation,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isLaptop: screenSize === 'laptop',
    isDesktop: screenSize === 'desktop',
    isUltrawide: screenSize === 'ultrawide',
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    width: dimensions.width,
    height: dimensions.height,
    columns: getColumns(),
    showSidebar,
    sidebarCollapsed,
  };
}
