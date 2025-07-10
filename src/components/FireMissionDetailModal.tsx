import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCopy, faDownload, faTrash, faEdit, faBullseye, faCompass, faRulerCombined } from '@fortawesome/free-solid-svg-icons';
import type { FireMissionRecord } from '../services/fireMissionHistoryService';

// Helper function to format MGRS coordinates
function formatMGRS(grid: string): string {
  if (!grid) return '';
  
  // If it's a coordinate-only format (8 or 10 digits), return as-is
  if (/^\d{8,10}$/.test(grid)) {
    return grid.replace(/(\d{4})(\d{4,6})/, '$1 $2');
  }
  
  // Full MGRS format
  if (grid.length >= 10) {
    const zone = grid.substring(0, 2);
    const band = grid.substring(2, 3);
    const square = grid.substring(3, 5);
    const coords = grid.substring(5);
    const easting = coords.substring(0, coords.length / 2);
    const northing = coords.substring(coords.length / 2);
    
    return `${zone}${band} ${square} ${easting} ${northing}`;
  }
  
  return grid;
}

interface FireMissionDetailModalProps {
  mission: FireMissionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (mission: FireMissionRecord) => void;
}

export function FireMissionDetailModal({
  mission,
  isOpen,
  onClose,
  onDelete,
  onEdit
}: FireMissionDetailModalProps) {
  if (!isOpen || !mission) return null;

  const handleCopyCommand = () => {
    const fireCommand = `FIRE MISSION
Grid: ${mission.targetGrid}
Direction: ${mission.fireSolution.azimuthMils} mils
Elevation: ${mission.fireSolution.elevationMils} mils
Charge: ${mission.fireSolution.chargeLevel}
Shell: ${mission.round}
Time of Flight: ${mission.fireSolution.timeOfFlight}s`;
    
    navigator.clipboard.writeText(fireCommand);
    alert('Fire command copied to clipboard!');
  };

  const handleExportMission = () => {
    const data = JSON.stringify(mission, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fire-mission-${mission.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCoordinate = (grid: string) => {
    try {
      return formatMGRS(grid);
    } catch {
      return grid;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1">🎯 Fire Mission Details</h2>
            <div className="flex items-center space-x-4 text-red-100">
              <span className="text-sm">
                {formatTimestamp(mission.timestamp)}
              </span>
              <span className="text-sm">ID: {mission.id}</span>
            </div>
            <div className="mt-2 bg-white text-red-800 rounded px-3 py-1 font-mono text-lg font-bold inline-block">
              TARGET: {formatCoordinate(mission.targetGrid)}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(mission)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                title="Edit mission"
              >
                <FontAwesomeIcon icon={faEdit} />
              </button>
            )}
            <button
              onClick={handleCopyCommand}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Copy fire command"
            >
              <FontAwesomeIcon icon={faCopy} />
            </button>
            <button
              onClick={handleExportMission}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Export mission"
            >
              <FontAwesomeIcon icon={faDownload} />
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(mission.id)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                title="Delete mission"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Close"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coordinates */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">📍 Coordinates</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Observer:</span>
                  <div className="font-mono text-blue-600 ml-2 text-base">
                    {formatCoordinate(mission.observerGrid)}
                    {mission.isUsingMortarAsObserver && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Using Mortar Position
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Mortar:</span>
                  <div className="font-mono text-green-600 ml-2 text-base">
                    {formatCoordinate(mission.mortarGrid)}
                  </div>
                </div>
                <div className="border-2 border-red-200 bg-red-50 rounded-lg p-3 -mx-1">
                  <span className="font-bold text-red-700 text-base">🎯 TARGET:</span>
                  <div className="font-mono text-red-700 ml-2 text-xl font-bold">
                    {formatCoordinate(mission.targetGrid)}
                  </div>
                </div>
                {mission.adjustments && (
                  <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-3 -mx-1">
                    <span className="font-bold text-orange-700">⚠️ ADJUSTED TARGET:</span>
                    <div className="font-mono text-orange-700 ml-2 text-lg font-bold">
                      {formatCoordinate(mission.adjustments.adjustedTargetGrid)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* System & Round */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">System & Ammunition</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">System:</span>
                  <span className="ml-2">{mission.system}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Round:</span>
                  <span className="ml-2">{mission.round}</span>
                </div>
              </div>
            </div>

            {/* Fire Solution - PROMINENT DISPLAY */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6 shadow-lg">
              <h3 className="font-bold text-white mb-4 text-xl text-center">
                🎯 FIRING SOLUTION
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-red-700 bg-opacity-50 rounded-lg p-3 text-center">
                  <div className="text-red-200 text-xs mb-1">DIRECTION</div>
                  <div className="text-2xl font-bold font-mono">
                    {mission.fireSolution.azimuthMils}
                  </div>
                  <div className="text-red-200 text-xs">mils</div>
                </div>
                <div className="bg-red-700 bg-opacity-50 rounded-lg p-3 text-center">
                  <div className="text-red-200 text-xs mb-1">ELEVATION</div>
                  <div className="text-2xl font-bold font-mono">
                    {mission.fireSolution.elevationMils}
                  </div>
                  <div className="text-red-200 text-xs">mils</div>
                </div>
                <div className="bg-red-700 bg-opacity-50 rounded-lg p-3 text-center">
                  <div className="text-red-200 text-xs mb-1">CHARGE</div>
                  <div className="text-2xl font-bold font-mono">
                    {mission.fireSolution.chargeLevel}
                  </div>
                  <div className="text-red-200 text-xs">propellant</div>
                </div>
                <div className="bg-red-700 bg-opacity-50 rounded-lg p-3 text-center">
                  <div className="text-red-200 text-xs mb-1">TOF</div>
                  <div className="text-xl font-bold font-mono">
                    {mission.fireSolution.timeOfFlight.toFixed(1)}
                  </div>
                  <div className="text-red-200 text-xs">seconds</div>
                </div>
                <div className="bg-red-700 bg-opacity-50 rounded-lg p-3 text-center">
                  <div className="text-red-200 text-xs mb-1">RANGE</div>
                  <div className="text-xl font-bold font-mono">
                    {mission.fireSolution.rangeMeters}
                  </div>
                  <div className="text-red-200 text-xs">meters</div>
                </div>
                {mission.fireSolution.quadrant && (
                  <div className="bg-red-700 bg-opacity-50 rounded-lg p-3 text-center">
                    <div className="text-red-200 text-xs mb-1">QUADRANT</div>
                    <div className="text-xl font-bold font-mono">
                      {mission.fireSolution.quadrant}
                    </div>
                    <div className="text-red-200 text-xs">elev</div>
                  </div>
                )}
              </div>
            </div>

            {/* Adjustments */}
            {mission.adjustments && (
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Observer Adjustments</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Range Adjustment:</span>
                    <span className="ml-2 font-mono text-orange-600">
                      {mission.adjustments.rangeAdjustmentM > 0 ? '+' : ''}
                      {mission.adjustments.rangeAdjustmentM}m
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Direction Adjustment:</span>
                    <span className="ml-2 font-mono text-orange-600">
                      {mission.adjustments.directionAdjustmentMils > 0 ? '+' : ''}
                      {mission.adjustments.directionAdjustmentMils} mils
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fire Command - PROMINENT DISPLAY */}
          <div className="mt-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-6 shadow-lg">
            <h3 className="font-bold text-white mb-4 text-xl text-center">
              🔥 FIRE COMMAND
            </h3>
            <div className="bg-black bg-opacity-30 rounded-lg p-4 font-mono text-sm md:text-base whitespace-pre-wrap">
              {mission.fireCommand}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={handleCopyCommand}
                className="flex-1 px-4 py-2 bg-green-800 hover:bg-green-900 text-white rounded-lg font-semibold transition-colors shadow-md"
              >
                <FontAwesomeIcon icon={faCopy} className="mr-2" />
                Copy Fire Command
              </button>
              <button
                onClick={handleExportMission}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md"
              >
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Export Mission
              </button>
            </div>
          </div>

          {/* Notes */}
          {mission.notes && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {mission.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
