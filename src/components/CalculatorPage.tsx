import { FireMissionCalculator } from './FireMissionCalculator';
import { PWAStatus } from './PWAComponents';
import { FDCIcon } from './FDCLogo';
import { useSEO, SEOConfig } from '../hooks/useSEO';

export function CalculatorPage() {
  useSEO(SEOConfig.calculator);
  
  return (
    <div className="py-8 relative">
      <PWAStatus />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FDCIcon size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Arma Reforger Mortar Calculator</h1>
              <p className="text-sm text-gray-600 mt-1">Streamlined Fire Direction Center</p>
            </div>
          </div>
          <i className="fas fa-calculator text-2xl text-blue-600"></i>
        </div>
        <p className="mt-4 text-gray-600">
          Streamlined calculator for essential firing solutions using observer, mortar, and target positions in MGRS coordinates.
        </p>
      </div>
      <FireMissionCalculator />
    </div>
  );
}
