/**
 * Sistema de Breakpoints Responsivos - Lumina ERP
 * 
 * Otimizado para:
 * - Tablets: 8", 10.4", 11" (16:10, 4:3)
 * - Laptops: 12", 14", 15.1", 15.3", 16" (16:10)
 * - Monitores: 24", 27" (16:9, 21:9)
 * 
 * Proporções consideradas:
 * - 4:3 (Tablets antigos)
 * - 16:10 (Tablets modernos, Laptops)
 * - 16:9 (Monitores padrão)
 * - 21:9 (Ultrawide)
 * - 3:2 (Produtividade)
 */

export const breakpoints = {
  // Mobile First
  mobile: {
    sm: '320px',   // Mobile pequeno
    md: '375px',   // Mobile médio (iPhone)
    lg: '425px',   // Mobile grande (iPhone Plus)
  },
  
  // Tablets
  tablet: {
    sm: '600px',   // 8" tablet portrait (800x600)
    md: '768px',   // 10.4" tablet portrait (1280x800)
    lg: '900px',   // 11" tablet landscape (1366x768)
    xl: '1024px',  // 12" tablet landscape (1440x900)
  },
  
  // Laptops
  laptop: {
    sm: '1280px',  // 14" laptop (1280x800, 16:10)
    md: '1366px',  // 15.1" laptop (1366x768, 16:9)
    lg: '1440px',  // 15.3" laptop (1440x900, 16:10)
    xl: '1536px',  // 16" laptop (1536x960, 16:10)
  },
  
  // Monitores
  desktop: {
    sm: '1680px',  // 24" monitor (1680x1050, 16:10)
    md: '1920px',  // 24" monitor (1920x1080, 16:9) - Full HD
    lg: '2560px',  // 27" monitor (2560x1440, 16:9) - 2K
    xl: '3440px',  // 34" ultrawide (3440x1440, 21:9)
  },
};

// Tailwind breakpoints customizados
export const tailwindBreakpoints = {
  'xs': '475px',    // Mobile extra small
  'sm': '640px',    // Tablet pequeno
  'md': '768px',    // Tablet médio
  'lg': '1024px',   // Tablet grande / Laptop pequeno
  'xl': '1280px',   // Laptop médio
  '2xl': '1536px',  // Laptop grande
  '3xl': '1920px',  // Monitor Full HD
  '4xl': '2560px',  // Monitor 2K
  '5xl': '3440px',  // Ultrawide
};

// Grids otimizados por breakpoint
export const gridConfigs = {
  cards: {
    mobile: 'grid-cols-1',           // 1 coluna
    tablet: 'sm:grid-cols-2',        // 2 colunas
    laptop: 'lg:grid-cols-3',        // 3 colunas
    desktop: 'xl:grid-cols-4',       // 4 colunas
    ultrawide: '5xl:grid-cols-6',    // 6 colunas
  },
  
  dashboard: {
    mobile: 'grid-cols-1',           // 1 coluna
    tablet: 'sm:grid-cols-2',        // 2 colunas
    laptop: 'lg:grid-cols-3',        // 3 colunas
    desktop: '2xl:grid-cols-4',      // 4 colunas
    ultrawide: '5xl:grid-cols-5',    // 5 colunas
  },
  
  sidebar: {
    collapsed: 'w-16',               // Retraído
    expanded: 'w-64',                // Expandido
    mobile: 'w-full max-w-sm',       // Mobile full
  },
  
  container: {
    mobile: 'px-4',                  // Padding horizontal mobile
    tablet: 'sm:px-6',               // Padding horizontal tablet
    laptop: 'lg:px-8',               // Padding horizontal laptop
    desktop: 'xl:px-12',             // Padding horizontal desktop
    ultrawide: '5xl:px-16',          // Padding horizontal ultrawide
  },
};

// Spacing otimizado
export const spacing = {
  section: {
    mobile: 'space-y-4',             // Espaço entre seções mobile
    tablet: 'sm:space-y-6',          // Espaço entre seções tablet
    laptop: 'lg:space-y-8',          // Espaço entre seções laptop
    desktop: 'xl:space-y-10',        // Espaço entre seções desktop
  },
  
  cards: {
    mobile: 'gap-4',                 // Gap entre cards mobile
    tablet: 'sm:gap-6',              // Gap entre cards tablet
    laptop: 'lg:gap-8',              // Gap entre cards laptop
  },
};

// Tipografia responsiva
export const typography = {
  heading: {
    h1: 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl',
    h2: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl',
    h3: 'text-lg sm:text-xl lg:text-2xl xl:text-3xl',
    h4: 'text-base sm:text-lg lg:text-xl xl:text-2xl',
  },
  
  body: {
    large: 'text-base sm:text-lg lg:text-xl',
    normal: 'text-sm sm:text-base lg:text-lg',
    small: 'text-xs sm:text-sm lg:text-base',
  },
};

// Heights otimizadas
export const heights = {
  header: 'h-16',                    // Header fixo
  card: {
    small: 'h-32 sm:h-40 lg:h-48',
    medium: 'h-48 sm:h-56 lg:h-64',
    large: 'h-64 sm:h-72 lg:h-80',
  },
  chart: {
    mobile: 'h-64',
    tablet: 'sm:h-80',
    laptop: 'lg:h-96',
    desktop: 'xl:h-[32rem]',
  },
};

// Layouts específicos
export const layouts = {
  twoColumn: {
    mobile: 'flex-col',
    tablet: 'sm:flex-row',
    gap: 'gap-4 sm:gap-6 lg:gap-8',
  },
  
  threeColumn: {
    mobile: 'grid-cols-1',
    tablet: 'sm:grid-cols-2',
    laptop: 'lg:grid-cols-3',
    gap: 'gap-4 sm:gap-6',
  },
  
  sidebar: {
    main: 'flex-col lg:flex-row',
    left: 'w-full lg:w-64 xl:w-80',
    right: 'flex-1 min-w-0',
  },
};

// Utility para combinar classes
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Helper para responsividade
export const responsive = {
  show: {
    mobile: 'block sm:hidden',
    tablet: 'hidden sm:block lg:hidden',
    laptop: 'hidden lg:block xl:hidden',
    desktop: 'hidden xl:block',
  },
  
  hide: {
    mobile: 'hidden sm:block',
    tablet: 'sm:hidden lg:block',
    laptop: 'lg:hidden xl:block',
  },
};

// Valores para cálculos dinâmicos
export const viewportSizes = {
  // Tablets (em pixels)
  tablet8: { width: 800, height: 600, ratio: '4:3' },
  tablet10: { width: 1280, height: 800, ratio: '16:10' },
  tablet11: { width: 1366, height: 768, ratio: '16:9' },
  tablet12: { width: 1440, height: 900, ratio: '16:10' },
  
  // Laptops
  laptop14: { width: 1280, height: 800, ratio: '16:10' },
  laptop15_1: { width: 1366, height: 768, ratio: '16:9' },
  laptop15_3: { width: 1440, height: 900, ratio: '16:10' },
  laptop16: { width: 1536, height: 960, ratio: '16:10' },
  
  // Monitores
  monitor24_1610: { width: 1680, height: 1050, ratio: '16:10' },
  monitor24_169: { width: 1920, height: 1080, ratio: '16:9' },
  monitor27: { width: 2560, height: 1440, ratio: '16:9' },
  ultrawide34: { width: 3440, height: 1440, ratio: '21:9' },
};

// Media queries para uso em JS
export const mediaQueries = {
  isMobile: () => window.matchMedia('(max-width: 639px)').matches,
  isTablet: () => window.matchMedia('(min-width: 640px) and (max-width: 1023px)').matches,
  isLaptop: () => window.matchMedia('(min-width: 1024px) and (max-width: 1535px)').matches,
  isDesktop: () => window.matchMedia('(min-width: 1536px)').matches,
  isUltrawide: () => window.matchMedia('(min-width: 3440px)').matches,
  
  // Orientação
  isPortrait: () => window.matchMedia('(orientation: portrait)').matches,
  isLandscape: () => window.matchMedia('(orientation: landscape)').matches,
};

export default {
  breakpoints,
  tailwindBreakpoints,
  gridConfigs,
  spacing,
  typography,
  heights,
  layouts,
  responsive,
  viewportSizes,
  mediaQueries,
  cn,
};
