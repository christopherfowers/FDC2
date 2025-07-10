import { AppSettings, PWAStatus } from './PWAComponents';
import { FDCIcon } from './FDCLogo';

export function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      <PWAStatus />
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FDCIcon size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500 mt-1">Fire Direction Center Configuration</p>
            </div>
          </div>
          <i className="fas fa-cog text-2xl text-blue-600"></i>
        </div>
        <p className="mt-4 text-gray-600">
          Configure your Fire Direction Center application preferences and data management.
        </p>
      </div>

      <div className="space-y-8">
        {/* PWA Status Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <i className="fas fa-shield-alt text-xl text-green-600"></i>
            <h2 className="text-xl font-semibold text-gray-900">Application Status</h2>
          </div>
          <div className="text-gray-600 mb-4">
            <p>Your Fire Direction Center app is ready for offline use and will automatically check for updates when online.</p>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <i className="fas fa-database text-xl text-blue-600"></i>
            <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Manage ballistic data, mortar systems, and application cache. The app automatically 
            caches data for offline use and checks for updates when online.
          </p>
          <AppSettings />
        </div>

        {/* Offline Capabilities Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <i className="fas fa-wifi text-xl text-purple-600"></i>
            <h2 className="text-xl font-semibold text-gray-900">Offline Capabilities</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <i className="fas fa-download text-green-500 mt-1"></i>
              <div>
                <h3 className="font-medium text-gray-900">Cached for Offline Use</h3>
                <p className="text-sm text-gray-600">
                  All calculations and essential data are available without internet connection.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <i className="fas fa-sync text-blue-500 mt-1"></i>
              <div>
                <h3 className="font-medium text-gray-900">Automatic Updates</h3>
                <p className="text-sm text-gray-600">
                  The app automatically checks for data updates when connected to the internet.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <i className="fas fa-database text-purple-500 mt-1"></i>
              <div>
                <h3 className="font-medium text-gray-900">Local Storage</h3>
                <p className="text-sm text-gray-600">
                  Mortar systems, rounds, and ballistic data are stored locally for instant access.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* App Information Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <i className="fas fa-cog text-xl text-gray-600"></i>
            <h2 className="text-xl font-semibold text-gray-900">Application Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Version:</span>
              <span className="ml-2 text-gray-600">1.0.0</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <span className="ml-2 text-gray-600">Progressive Web App</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Coordinate System:</span>
              <span className="ml-2 text-gray-600">MGRS (Military Grid Reference System)</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Calculations:</span>
              <span className="ml-2 text-gray-600">Client-side (Offline Ready)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
