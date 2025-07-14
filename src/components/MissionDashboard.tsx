import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useEffect, useState } from 'react';
import { MissionTemplateService } from '../services/missionTemplateService';
import { MissionTemplateModal } from './MissionTemplateModal';
import { useSEO, SEOConfig } from '../hooks/useSEO';
import type { MissionSummary, Mission, MissionTemplate } from '../types/mission';

export function MissionDashboard() {
  useSEO(SEOConfig.dashboard);
  const { currentMission, missions, setCurrentMission, createMission } = useApp();
  const [recentMissions, setRecentMissions] = useState<MissionSummary[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalMissions: 0,
    completedMissions: 0,
    activeMissions: 0,
    totalFireMissions: 0
  });

  useEffect(() => {
    // Load recent missions
    const recent = missions.slice(0, 5);
    setRecentMissions(recent);

    // Calculate statistics
    const completed = missions.filter(m => m.status === 'complete').length;
    const active = missions.filter(m => m.status === 'active').length;
    const totalFireMissions = missions.reduce((sum, m) => sum + m.numberOfFireMissions, 0);

    setStats({
      totalMissions: missions.length,
      completedMissions: completed,
      activeMissions: active,
      totalFireMissions
    });
  }, [missions]);

  const handleResumeMission = (mission: Mission | MissionSummary) => {
    setCurrentMission(mission.id);
    // Navigate to appropriate phase
    const route = getPhaseRoute(mission);
    window.location.href = route;
  };

  const handleCreateFromTemplate = async (template: MissionTemplate) => {
    try {
      const missionData = await MissionTemplateService.createMissionFromTemplate(template, 'New Mission');
      const missionId = await createMission(missionData);
      setCurrentMission(missionId);
      setIsTemplateModalOpen(false);
      window.location.href = '/mission/prep';
    } catch (error) {
      console.error('Failed to create mission from template:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPhaseRoute = (mission: Mission | MissionSummary) => {
    switch (mission.currentPhase) {
      case 'prep': return '/mission/prep';
      case 'calculate': return '/mission/calculate';
      case 'solution': return '/mission/solution';
      default: return '/mission/prep';
    }
  };

  const handleNewFireSolution = (mission: Mission | MissionSummary) => {
    setCurrentMission(mission.id);
    window.location.href = '/mission/calculate';
  };

  const handleViewFireSolutions = (mission: Mission | MissionSummary) => {
    setCurrentMission(mission.id);
    window.location.href = '/mission/solution';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mission Dashboard</h1>
            <p className="text-gray-600">
              Manage your fire missions, track progress, and coordinate fire solutions.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/mission/prep"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
            >
              <i className="fas fa-plus"></i>
              <span>New Mission</span>
            </Link>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center space-x-2"
            >
              <i className="fas fa-clipboard-list"></i>
              <span>From Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Current Mission Alert */}
      {currentMission && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-1">
                Active Mission: {currentMission.name}
              </h2>
              <p className="text-blue-700">
                Phase: {currentMission.currentPhase} | {currentMission.fpfTargets?.length || 0} FPF targets | {currentMission.fireMissions?.length || 0} fire missions
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleNewFireSolution(currentMission)}
                className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors inline-flex items-center space-x-1"
              >
                <i className="fas fa-crosshairs"></i>
                <span>New Fire Solution</span>
              </button>
              <Link
                to={getPhaseRoute(currentMission)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors inline-flex items-center space-x-1"
              >
                <i className="fas fa-play"></i>
                <span>Continue Mission</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.totalMissions}</div>
          <div className="text-sm text-gray-600">Total Missions</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completedMissions}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.activeMissions}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.totalFireMissions}</div>
          <div className="text-sm text-gray-600">Fire Solutions</div>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" aria-label="Quick actions">
        {/* New Fire Mission */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <i className="fas fa-crosshairs text-orange-600 text-xl"></i>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 ml-4">New Fire Solution</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Create a new fire solution for target engagement with ballistic calculations.
          </p>
          <Link
            to="/mission/calculate"
            className="inline-flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
          >
            <i className="fas fa-calculator"></i>
            <span>Calculate Fire Solution</span>
          </Link>
        </div>

        {/* View All Missions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              <i className="fas fa-list text-gray-600 text-xl"></i>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 ml-4">All Missions</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Browse complete mission history with detailed fire solution records.
          </p>
          <Link
            to="/history"
            className="inline-flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-history"></i>
            <span>View History</span>
          </Link>
        </div>

        {/* Quick Calculator */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <i className="fas fa-calculator text-blue-600 text-xl"></i>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 ml-4">Quick Calculator</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Use the standalone calculator for quick ballistic computations.
          </p>
          <Link
            to="/calculator"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-tachometer-alt"></i>
            <span>Open Calculator</span>
          </Link>
        </div>
      </section>

      {/* Recent Missions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Mission List</h2>
            <Link
              to="/history"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All History
            </Link>
          </div>
        </div>
        
        {recentMissions.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            <i className="fas fa-inbox text-4xl mb-4"></i>
            <p>No missions yet. Start your first mission to see it here.</p>
            <Link
              to="/mission/prep"
              className="mt-4 inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              <i className="fas fa-plus"></i>
              <span>Create First Mission</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {recentMissions.map((mission) => (
              <div key={mission.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">{mission.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        mission.status === 'complete' 
                          ? 'bg-green-100 text-green-800'
                          : mission.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {mission.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {mission.numberOfFPFTargets} FPF targets • Phase: {mission.currentPhase}
                    </p>
                    <div className="text-xs text-gray-600 mt-1">
                      {formatDate(mission.lastModified)} • {mission.numberOfFireMissions} fire solutions
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    {mission.numberOfFireMissions > 0 && (
                      <button
                        onClick={() => handleViewFireSolutions(mission)}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors inline-flex items-center space-x-1"
                        title="View fire solutions for adjustments"
                      >
                        <i className="fas fa-chart-line"></i>
                        <span>Solutions</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleNewFireSolution(mission)}
                      className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors inline-flex items-center space-x-1"
                      title="Create new fire solution"
                    >
                      <i className="fas fa-crosshairs"></i>
                      <span>New Solution</span>
                    </button>
                    
                    {mission.status !== 'complete' && (
                      <button
                        onClick={() => handleResumeMission(mission)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors inline-flex items-center space-x-1"
                      >
                        <i className="fas fa-play"></i>
                        <span>Resume</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mission Template Modal */}
      <MissionTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onCreateFromTemplate={handleCreateFromTemplate}
        currentMission={currentMission || undefined}
      />
    </div>
  );
}
