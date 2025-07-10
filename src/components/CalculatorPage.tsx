import { FireMissionCalculator } from './FireMissionCalculator';
import { PWAStatus } from './PWAComponents';
import { FDCIcon } from './FDCLogo';

export function CalculatorPage() {
  return (
    <div className="py-8 relative">
      <PWAStatus />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FDCIcon size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fire Mission Calculator</h1>
              <p className="text-sm text-gray-500 mt-1">Precision Fire Direction Center</p>
            </div>
          </div>
          <i className="fas fa-calculator text-2xl text-blue-600"></i>
        </div>
        <p className="mt-4 text-gray-600">
          Calculate firing solutions using observer, mortar, and target positions in MGRS coordinates.
        </p>
      </div>
      <FireMissionCalculator />
    </div>
  );
}
