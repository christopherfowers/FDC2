import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWifi, 
  faDownload, 
  faSync,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { useApp } from '../contexts/AppContext';

export function PWAStatus() {
  const { isOffline, hasUpdate, updateApp } = useApp();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Offline Indicator */}
      {isOffline && (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <FontAwesomeIcon icon={faWifi} className="text-white opacity-50" />
          <span className="text-sm font-medium">Offline Mode</span>
        </div>
      )}

      {/* Update Available */}
      {hasUpdate && (
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faDownload} />
              <span className="text-sm font-medium">Update Available</span>
            </div>
            <button
              onClick={updateApp}
              className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-semibold hover:bg-blue-50"
            >
              Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PWAInstallPrompt() {
  // This would typically use a more sophisticated install prompt
  // For now, we'll show basic browser install instructions
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
      <h3 className="font-semibold text-blue-800 mb-2">Install FDC App</h3>
      <p className="text-blue-700 text-sm mb-3">
        Install this app on your device for quick access and offline capability.
      </p>
      <div className="text-xs text-blue-600">
        <p><strong>Chrome/Edge:</strong> Menu → Install App</p>
        <p><strong>Safari:</strong> Share → Add to Home Screen</p>
        <p><strong>Firefox:</strong> Menu → Install</p>
      </div>
    </div>
  );
}

export function AppSettings() {
  const { clearCache, refreshData, isLoading } = useApp();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="space-y-4">
        <button
          onClick={refreshData}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <FontAwesomeIcon icon={faSync} className={isLoading ? 'animate-spin' : ''} />
          <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>

        <button
          onClick={clearCache}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center justify-center space-x-2"
        >
          <FontAwesomeIcon icon={faTrash} />
          <span>Clear Cache & Restart</span>
        </button>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Refresh Data:</strong> Check for latest ballistic data</p>
          <p><strong>Clear Cache:</strong> Remove all cached data and restart app</p>
        </div>
      </div>
    </div>
  );
}
