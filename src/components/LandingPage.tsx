import { Link } from 'react-router-dom';
import { useSEO, SEOConfig } from '../hooks/useSEO';

export default function LandingPage() {
  useSEO(SEOConfig.home);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Arma Reforger Fire Direction Center
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Professional mortar calculator and mission control center for Arma Reforger gaming. 
          Plan and execute fire missions with military-grade accuracy and the FDC tactical workflow system.
        </p>
        
        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link
            to="/mission/prep"
            className="inline-flex items-center space-x-2 bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
            aria-label="Start new mission preparation"
          >
            <i className="fas fa-rocket"></i>
            <span>Start New Mission</span>
          </Link>
          
          <Link
            to="/calculator"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
            aria-label="Open Arma Reforger mortar calculator"
          >
            <i className="fas fa-calculator"></i>
            <span>Quick Calculator</span>
          </Link>
        </div>
      </div>

      {/* Features Section - SEO Content */}
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Professional Arma Reforger Mortar Calculator
            </h2>
            <p className="text-lg text-gray-600">
              Advanced fire direction center designed specifically for Arma Reforger gaming. 
              Calculate precise mortar fire solutions using MGRS coordinates with military-grade accuracy.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-crosshairs text-blue-600 text-2xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">MGRS Coordinate System</h3>
              <p className="text-sm text-gray-600">
                Native Arma Reforger MGRS coordinate support for accurate targeting and ballistic calculations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-line text-green-600 text-2xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Multiple Mortar Systems</h3>
              <p className="text-sm text-gray-600">
                Support for M252, M224, L16A2, and RT-F1 mortar systems with comprehensive ballistic data.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-bullseye text-purple-600 text-2xl"></i>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Gaming Optimized</h3>
              <p className="text-sm text-gray-600">
                Fast calculations optimized for real-time Arma Reforger gameplay with offline capability.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Key Features for Arma Reforger Players:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-700">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  Real-time ballistic calculations
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  Multi-gun fire mission coordination
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  Final Protective Fire (FPF) management
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-700">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  Mission planning and templates
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  Offline-capable PWA design
                </li>
                <li className="flex items-center text-sm text-gray-700">
                  <i className="fas fa-check text-green-500 mr-2"></i>
                  Professional fire direction workflow
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Navigation */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" aria-label="Additional features">
        {/* Mission Dashboard */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <i className="fas fa-tachometer-alt text-purple-600 text-xl"></i>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 ml-4">Mission Dashboard</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Manage active missions, create fire solutions, and track mission progress.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
          >
            <i className="fas fa-tachometer-alt"></i>
            <span>Mission Dashboard</span>
          </Link>
        </div>

        {/* Ballistic Tables */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <i className="fas fa-table text-orange-600 text-xl"></i>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 ml-4">Ballistic Tables</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Browse comprehensive firing data for all supported mortar systems and ammunition types.
          </p>
          <Link
            to="/ballistic-tables"
            className="inline-flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
          >
            <i className="fas fa-table"></i>
            <span>View Tables</span>
          </Link>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              <i className="fas fa-cog text-gray-600 text-xl"></i>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 ml-4">Settings & Info</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Configure application preferences and view offline capabilities.
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </Link>
        </div>
      </section>

      {/* Call to Action Footer */}
      <div className="text-center bg-blue-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ready to Enhance Your Arma Reforger Experience?
        </h2>
        <p className="text-gray-600 mb-6">
          Join thousands of players using the most advanced mortar calculator for Arma Reforger.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/mission/prep"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <i className="fas fa-play"></i>
            <span>Get Started Now</span>
          </Link>
          <Link
            to="/ballistic-tables"
            className="inline-flex items-center space-x-2 border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
          >
            <i className="fas fa-book"></i>
            <span>View Documentation</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
