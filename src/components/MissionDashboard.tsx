import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useEffect, useState } from 'react';
import { MissionTemplateService } from '../services/missionTemplateService';
import { MissionTemplateModal } from './MissionTemplateModal';
import { useSEO, SEOConfig } from '../hooks/useSEO';
import type { MissionSummary, Mission, MissionTemplate } from '../types/mission';

export function MissionDashboard() {
  useSEO(SEOConfig.home);
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
    // Get recent missions (last 5)
    const sortedMissions = [...missions].sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
    setRecentMissions(sortedMissions.slice(0, 5));

    // Calculate statistics
    const totalFireMissions = missions.reduce((total, mission) => 
      total + mission.numberOfFireMissions, 0
    );
    
    setStats({
      totalMissions: missions.length,
      completedMissions: missions.filter(m => m.status === 'complete').length,
      activeMissions: missions.filter(m => m.status === 'active').length,
      totalFireMissions
    });
  }, [missions]);

  const handleResumeMission = (mission: MissionSummary) => {
    setCurrentMission(mission.id);
  };

  const handleCreateFromTemplate = async (template: MissionTemplate, missionName: string) => {
    try {
      const missionData = MissionTemplateService.createMissionFromTemplate(template, missionName);
      const newMissionId = await createMission(missionData);
      setCurrentMission(newMissionId);
      // Navigate to mission prep to complete setup
      window.location.href = '/mission/prep';
    } catch (error) {
      console.error('Failed to create mission from template:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Arma Reforger Fire Direction Center</h1>
        <p className="text-gray-600">
          Professional mortar calculator and mission control center for Arma Reforger gaming. Plan and execute fire missions with the FDC tactical workflow system.
        </p>
      </div>

      {/* Current Mission Alert */}
      {currentMission && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-1">
                Active Mission: {currentMission.name}
              </h2>
              <p className="text-blue-700">
                Current Phase: {currentMission.currentPhase === 'prep' && 'Mission Preparation'}
                {currentMission.currentPhase === 'calculate' && 'Fire Mission Calculations'}
                {currentMission.currentPhase === 'solution' && 'Fire Solution'}
              </p>
            </div>
            <Link
              to={getPhaseRoute(currentMission)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Continue Mission
            </Link>
          </div>
        </div>
      )}

      {/* Action Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" aria-label="Quick actions">
        {/* Start New Mission */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <i className="fas fa-plus text-green-600 text-xl"></i>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 ml-4">Start New Mission</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Begin mission preparation with position setup, FPF target planning, and equipment configuration.
          </p>
          <Link
            to="/mission/prep"
            className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            aria-label="Start new mission preparation"
          >
            <i className="fas fa-rocket"></i>
            <span>Start Mission Prep</span>
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
            Use the Arma Reforger mortar calculator for streamlined fire solutions with essential features.
          </p>
          <Link
            to="/calculator"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            aria-label="Open Arma Reforger mortar calculator"
          >
            <i className="fas fa-calculator"></i>
            <span>Open Calculator</span>
          </Link>
        </div>

        {/* Mission Templates */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <i className="fas fa-save text-purple-600 text-xl"></i>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 ml-4">Mission Templates</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Use pre-configured mission templates or save your current mission setup for reuse.
          </p>
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
          >
            <i className="fas fa-folder-open"></i>
            <span>Browse Templates</span>
          </button>
        </div>
      </section>

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
          <div className="text-sm text-gray-600">Fire Missions</div>
        </div>
      </div>

      {/* Recent Missions */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Missions</h2>
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
                      {mission.numberOfFPFTargets} FPF targets
                    </p>
                    <div className="text-xs text-gray-600 mt-1">
                      {formatDate(mission.lastModified)} • {mission.numberOfFireMissions} fire missions
                    </div>
                  </div>
                  
                  {mission.status !== 'complete' && (
                    <button
                      onClick={() => handleResumeMission(mission)}
                      className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Resume
                    </button>
                  )}
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

      {/* SEO Content Section - Arma Reforger Mortar Calculator Features */}
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
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
    </div>
  );
}
