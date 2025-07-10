import { Link } from 'react-router-dom';
import { FDCLogo } from './FDCLogo';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <FDCLogo size={48} showText={false} />
          </div>
          <i className="fas fa-exclamation-triangle text-6xl text-yellow-500 mb-4"></i>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Target Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for is outside the operational area.
          </p>
        </div>
        
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
        >
          <i className="fas fa-home"></i>
          <span>Return to Calculator</span>
        </Link>
      </div>
    </div>
  );
}
