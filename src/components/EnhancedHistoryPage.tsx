import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useSEO, SEOConfig } from '../hooks/useSEO';
import type { MissionSummary, Mission } from '../types/mission';

interface MissionHistoryFilters {
  status: 'all' | 'prep' | 'active' | 'complete';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  searchQuery: string;
}

export function EnhancedHistoryPage() {
  useSEO(SEOConfig.history);
  const { missions, getMission } = useApp();
  const [filteredMissions, setFilteredMissions] = useState<MissionSummary[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showMissionDetail, setShowMissionDetail] = useState(false);
  const [filters, setFilters] = useState<MissionHistoryFilters>({
    status: 'all',
    dateRange: 'all',
    searchQuery: ''
  });
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    applyFilters();
  }, [missions, filters, sortBy, sortOrder]);

  const applyFilters = () => {
    let filtered = [...missions];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(mission => mission.status === filters.status);
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoff.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(mission => 
        new Date(mission.lastModified) >= cutoff
      );
    }

    // Filter by search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(mission =>
        mission.name.toLowerCase().includes(query)
      );
    }

    // Sort missions
    filtered.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'date':
        default:
          aValue = new Date(a.lastModified);
          bValue = new Date(b.lastModified);
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredMissions(filtered);
  };

  const handleViewMission = async (missionId: string) => {
    const mission = await getMission(missionId);
    if (mission) {
      setSelectedMission(mission);
      setShowMissionDetail(true);
    }
  };

  const exportMissionReport = (mission: MissionSummary) => {
    // Create a simple text report for the mission
    const report = [
      `MISSION REPORT`,
      `=============`,
      `Mission: ${mission.name}`,
      `Status: ${mission.status.toUpperCase()}`,
      `Phase: ${mission.currentPhase}`,
      `Last Modified: ${new Date(mission.lastModified).toLocaleString()}`,
      `FPF Targets: ${mission.numberOfFPFTargets}`,
      `Fire Missions: ${mission.numberOfFireMissions}`,
      ``,
      `Generated by FDC Tactical Fire Direction Computer`,
      `Date: ${new Date().toLocaleString()}`
    ].join('\n');

    // Create and download the report
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mission-report-${mission.name.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getMissionAnalytics = () => {
    if (missions.length === 0) return null;

    const total = missions.length;
    const completed = missions.filter(m => m.status === 'complete').length;
    const active = missions.filter(m => m.status === 'active').length;
    const totalFireMissions = missions.reduce((sum, m) => sum + m.numberOfFireMissions, 0);
    const avgFireMissions = total > 0 ? (totalFireMissions / total).toFixed(1) : '0';
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';

    return {
      total,
      completed,
      active,
      totalFireMissions,
      avgFireMissions,
      completionRate
    };
  };

  const analytics = getMissionAnalytics();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mission History</h1>
        <p className="text-gray-600">
          Complete mission history with analytics and search capabilities.
        </p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{analytics.total}</div>
            <div className="text-sm text-gray-600">Total Missions</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{analytics.totalFireMissions}</div>
            <div className="text-sm text-gray-600">Fire Missions</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{analytics.avgFireMissions}</div>
            <div className="text-sm text-gray-600">Avg/Mission</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{analytics.completionRate}%</div>
            <div className="text-sm text-gray-600">Completion</div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Missions
            </label>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search by mission name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="prep">Preparation</option>
              <option value="active">Active</option>
              <option value="complete">Complete</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mission List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Missions ({filteredMissions.length})
          </h2>
        </div>

        {filteredMissions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <i className="fas fa-search text-4xl mb-4"></i>
            <p>No missions found matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredMissions.map((mission) => (
              <div key={mission.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-gray-900">{mission.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        mission.status === 'complete' 
                          ? 'bg-green-100 text-green-800'
                          : mission.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {mission.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Phase: {mission.currentPhase}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span>
                          <i className="fas fa-bullseye mr-1"></i>
                          {mission.numberOfFPFTargets} FPF targets
                        </span>
                        <span>
                          <i className="fas fa-fire mr-1"></i>
                          {mission.numberOfFireMissions} fire missions
                        </span>
                        <span>
                          <i className="fas fa-clock mr-1"></i>
                          {new Date(mission.lastModified).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => exportMissionReport(mission)}
                      className="px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                    >
                      <i className="fas fa-download mr-1"></i>
                      Export
                    </button>
                    <button
                      onClick={() => handleViewMission(mission.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      <i className="fas fa-eye mr-1"></i>
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mission Detail Modal */}
      {showMissionDetail && selectedMission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  <i className="fas fa-info-circle mr-2"></i>
                  Mission Details: {selectedMission.name}
                </h2>
                <button
                  onClick={() => setShowMissionDetail(false)}
                  className="text-white hover:text-gray-300 text-xl"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Mission Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Mission Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Status:</span> {selectedMission.status}</div>
                    <div><span className="font-medium">Phase:</span> {selectedMission.currentPhase}</div>
                    <div><span className="font-medium">Created:</span> {new Date(selectedMission.created).toLocaleString()}</div>
                    <div><span className="font-medium">Last Modified:</span> {new Date(selectedMission.lastModified).toLocaleString()}</div>
                    <div><span className="font-medium">Description:</span> {selectedMission.description || 'None'}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Equipment Configuration</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Mortar Position:</span> {selectedMission.mortarPosition}</div>
                    <div><span className="font-medium">Number of Guns:</span> {selectedMission.numberOfGuns}</div>
                    <div><span className="font-medium">System ID:</span> {selectedMission.selectedSystem}</div>
                    <div><span className="font-medium">Available Rounds:</span> {selectedMission.availableRounds.length}</div>
                    <div><span className="font-medium">Initial FO Position:</span> {selectedMission.initialFOPosition || 'Not set'}</div>
                  </div>
                </div>
              </div>

              {/* FPF Targets */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">FPF Targets ({selectedMission.fpfTargets.length})</h3>
                {selectedMission.fpfTargets.length === 0 ? (
                  <p className="text-gray-500 text-sm">No FPF targets configured.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedMission.fpfTargets.map((target) => (
                      <div key={target.id} className="border rounded p-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{target.name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            target.priority === 'primary' ? 'bg-red-100 text-red-800' :
                            target.priority === 'alternate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {target.priority}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>Grid: {target.targetGrid}</div>
                          {target.sector && <div>Sector: {target.sector}</div>}
                          {target.notes && <div>Notes: {target.notes}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fire Missions */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Fire Missions ({selectedMission.fireMissions.length})</h3>
                {selectedMission.fireMissions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No fire missions completed yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedMission.fireMissions.map((fireMission, index) => (
                      <div key={fireMission.id} className="border rounded p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Fire Mission {index + 1}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(fireMission.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Target:</span> {fireMission.targetGrid}
                          </div>
                          <div>
                            <span className="font-medium">Rounds:</span> {fireMission.numberOfRounds}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> {fireMission.status}
                          </div>
                          <div>
                            <span className="font-medium">Corrections:</span> {fireMission.corrections.length}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
