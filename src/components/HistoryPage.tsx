import { useState, useEffect } from 'react';
import { FireMissionDetailModal } from './FireMissionDetailModal';
import { fireMissionHistoryService } from '../services/fireMissionHistoryService';
import { useSEO, SEOConfig } from '../hooks/useSEO';
import type { FireMissionRecord, FireMissionSummary } from '../services/fireMissionHistoryService';

interface HistoryPageProps {
  onEditMission?: (mission: FireMissionRecord) => void;
}

export function HistoryPage({ onEditMission }: HistoryPageProps) {
  useSEO(SEOConfig.history);
  const [missions, setMissions] = useState<FireMissionSummary[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<FireMissionSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMission, setSelectedMission] = useState<FireMissionRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredMissions(fireMissionHistoryService.searchHistory(searchQuery));
    } else {
      setFilteredMissions(missions);
    }
  }, [searchQuery, missions]);

  const loadHistory = () => {
    setLoading(true);
    const history = fireMissionHistoryService.getHistorySummary();
    setMissions(history);
    setFilteredMissions(history);
    setLoading(false);
  };

  const handleViewMission = async (id: string) => {
    const mission = fireMissionHistoryService.getMission(id);
    if (mission) {
      setSelectedMission(mission);
      setShowDetailModal(true);
    }
  };

  const handleEditMission = (mission: FireMissionRecord) => {
    setShowDetailModal(false);
    onEditMission?.(mission);
  };

  const handleDeleteMission = (id: string) => {
    if (confirm('Are you sure you want to delete this fire mission?')) {
      fireMissionHistoryService.deleteMission(id);
      loadHistory();
      setShowDetailModal(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all fire mission history? This cannot be undone.')) {
      fireMissionHistoryService.clearHistory();
      loadHistory();
    }
  };

  const handleExportHistory = () => {
    const data = fireMissionHistoryService.exportHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fire-mission-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (fireMissionHistoryService.importHistory(content)) {
          loadHistory();
          alert('History imported successfully!');
        } else {
          alert('Failed to import history. Please check the file format.');
        }
      } catch {
        alert('Failed to import history. Invalid file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const formatCoordinate = (grid: string) => {
    if (/^\d+$/.test(grid) && grid.length >= 6) {
      const halfLength = Math.floor(grid.length / 2);
      return grid.substring(0, halfLength) + ' ' + grid.substring(halfLength);
    }
    return grid;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fire Mission History</h1>
            <p className="text-gray-600 mt-1">{missions.length} missions recorded</p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportHistory}
                className="hidden"
                id="import-history"
              />
              <label
                htmlFor="import-history"
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center"
              >
                <i className="fas fa-upload mr-2"></i>
                Import
              </label>
            </div>
            
            <button
              onClick={handleExportHistory}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              disabled={missions.length === 0}
            >
              <i className="fas fa-download mr-2"></i>
              Export
            </button>
            
            <button
              onClick={handleClearHistory}
              className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              disabled={missions.length === 0}
            >
              <i className="fas fa-trash mr-2"></i>
              Clear All
            </button>
          </div>
        </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Search missions by target, system, or command..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Mission List */}
        {loading ? (
          <div className="text-center py-8">
            <i className="fas fa-history text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600">Loading history...</p>
          </div>
        ) : filteredMissions.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery ? (
              <div>
                <i className="fas fa-search text-6xl text-gray-300 mb-6"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No missions found</h3>
                <p className="text-gray-600 mb-4">
                  No fire missions match your search query "{searchQuery}".
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear search to view all missions
                </button>
              </div>
            ) : (
              <div>
                <i className="fas fa-history text-6xl text-gray-300 mb-6"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No fire missions yet</h3>
                <p className="text-gray-600 mb-6">
                  Your fire mission history will appear here once you start calculating missions.
                </p>
                <div className="space-y-4">
                  <a
                    href="/"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <i className="fas fa-calculator mr-2"></i>
                    Calculate Your First Mission
                  </a>
                  <div className="text-sm text-gray-500">
                    <p>💡 <strong>Tip:</strong> Fire missions are automatically saved to your browser's local storage.</p>
                    <p className="mt-1">🗑️ Clearing browser cache will remove your history - this is normal and expected.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMissions.map((mission) => (
              <div
                key={mission.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <i className="fas fa-crosshairs text-red-500"></i>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Target: <span className="font-mono text-red-600">{formatCoordinate(mission.targetGrid)}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                              {mission.system} • {mission.round}
                              {mission.hasAdjustments && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                  Adjusted
                                </span>
                              )}
                            </p>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-500">
                            <i className="fas fa-clock mr-1"></i>
                            {formatTimestamp(mission.timestamp)}
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded truncate">
                            {mission.fireCommand}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewMission(mission.id)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                      title="View details"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    
                    {onEditMission && (
                      <button
                        onClick={() => {
                          const fullMission = fireMissionHistoryService.getMission(mission.id);
                          if (fullMission) handleEditMission(fullMission);
                        }}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                        title="Edit mission"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteMission(mission.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                      title="Delete mission"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Detail Modal */}
      <FireMissionDetailModal
        mission={selectedMission}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onDelete={handleDeleteMission}
        onEdit={handleEditMission}
      />
      </div>
    </div>
  );
}
