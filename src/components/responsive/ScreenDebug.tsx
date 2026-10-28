import { useScreenDimensions } from '@/hooks/useScreenDimensions';

interface ScreenDebugProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Componente de debug que mostra dimensões da tela em tempo real
 * Use apenas em desenvolvimento
 */
export function ScreenDebug({ position = 'bottom-right' }: ScreenDebugProps) {
  const dimensions = useScreenDimensions();

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  // Só mostrar em desenvolvimento
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 bg-black/90 text-white p-3 rounded-lg text-xs font-mono shadow-lg backdrop-blur-sm`}
    >
      <div className="space-y-1">
        <div className="font-bold text-green-400 mb-2">📐 Screen Info</div>
        <div>
          <span className="text-gray-400">Screen:</span>{' '}
          <span className="text-white font-semibold">
            {dimensions.width}x{dimensions.height}px
          </span>
        </div>
        <div>
          <span className="text-gray-400">Available:</span>{' '}
          <span className="text-white font-semibold">
            {dimensions.availableWidth}x{dimensions.availableHeight}px
          </span>
        </div>
        <div>
          <span className="text-gray-400">Density:</span>{' '}
          <span className="text-cyan-400 font-semibold uppercase">
            {dimensions.density}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Scale:</span>{' '}
          <span className="text-yellow-400 font-semibold">
            {dimensions.scale}x
          </span>
        </div>
        <div>
          <span className="text-gray-400">Orientation:</span>{' '}
          <span className="text-purple-400 font-semibold">
            {dimensions.isVerticalScreen ? '📱 Vertical' : '🖥️ Horizontal'}
          </span>
        </div>
        <div className="pt-2 mt-2 border-t border-gray-700">
          <span className="text-gray-400">Space:</span>{' '}
          <span className="text-green-400 font-semibold">
            {Math.round((dimensions.availableWidth * dimensions.availableHeight) / 1000)}k px²
          </span>
        </div>
      </div>
    </div>
  );
}
