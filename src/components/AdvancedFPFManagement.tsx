import { useState } from 'react';
import type { Mission } from '../types/mission';

interface AdvancedFPFManagementProps {
  mission: Mission;
  onClose: () => void;
}

export function AdvancedFPFManagement({ mission, onClose }: AdvancedFPFManagementProps) {
  const [activeTab, setActiveTab] = useState<'sectors' | 'analysis' | 'distribution'>('sectors');

  if (mission.fpfTargets.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="bg-purple-600 text-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                <i className="fas fa-cogs mr-2"></i>
                Advanced FPF Management
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 text-xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          
          <div className="p-8 text-center">
            <i className="fas fa-bullseye text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No FPF Targets</h3>
            <p className="text-gray-600 mb-4">
              Add FPF targets to your mission to use advanced FPF management features.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                <i className="fas fa-cogs mr-2"></i>
                Advanced FPF Management
              </h2>
              <p className="text-purple-100 text-sm">
                Sector assignments and fire distribution for {mission.fpfTargets.length} FPF targets
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-xl"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'sectors', label: 'Sector Management', icon: 'fas fa-map' },
              { id: 'analysis', label: 'Coverage Analysis', icon: 'fas fa-chart-area' },
              { id: 'distribution', label: 'Fire Distribution', icon: 'fas fa-fire' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'sectors' | 'analysis' | 'distribution')}
                className={`py-3 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Sectors Tab */}
          {activeTab === 'sectors' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  <i className="fas fa-map mr-2"></i>
                  FPF Sector Management
                </h3>
                <p className="text-sm text-blue-800 mb-4">
                  Assign FPF targets to tactical sectors for coordinated fire planning.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mission.fpfTargets.map((target, index) => (
                    <div key={target.id} className="bg-white border rounded p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{target.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          target.priority === 'primary' ? 'bg-red-100 text-red-800' :
                          target.priority === 'alternate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {target.priority}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Grid: {target.targetGrid}
                      </div>
                      <div className="text-sm text-gray-600">
                        Sector: {['Alpha', 'Bravo', 'Charlie', 'Delta'][index % 4]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">85%</div>
                  <div className="text-sm text-gray-600">Coverage Estimate</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">2</div>
                  <div className="text-sm text-gray-600">Potential Gaps</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">Good</div>
                  <div className="text-sm text-gray-600">Overall Rating</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Coverage Analysis</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>• FPF targets provide good coverage of primary approaches</p>
                  <p>• Consider additional targets for complete 360° protection</p>
                  <p>• Current distribution supports {mission.numberOfGuns} gun positions</p>
                </div>
              </div>
            </div>
          )}

          {/* Fire Distribution Tab */}
          {activeTab === 'distribution' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  <i className="fas fa-fire mr-2"></i>
                  Fire Distribution Plan
                </h4>
                <p className="text-sm text-blue-800 mb-4">
                  Recommended allocation for {mission.numberOfGuns} guns across {mission.fpfTargets.length} FPF targets.
                </p>
              </div>

              <div className="space-y-4">
                {mission.fpfTargets.map((target, index) => {
                  const tubesAssigned = target.priority === 'primary' ? 2 : 1;
                  const roundsPerTube = target.priority === 'primary' ? 12 : 8;

                  return (
                    <div key={target.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                            #{index + 1}
                          </span>
                          <h5 className="font-semibold text-gray-900">{target.name}</h5>
                          <span className={`text-xs px-2 py-1 rounded ${
                            target.priority === 'primary' ? 'bg-red-100 text-red-800' :
                            target.priority === 'alternate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {target.priority}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {tubesAssigned} tubes × {roundsPerTube} rounds
                          </div>
                          <div className="text-sm text-gray-600">
                            Total: {tubesAssigned * roundsPerTube} rounds
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded p-3">
                        <div className="text-sm text-gray-700">
                          {target.priority === 'primary' 
                            ? 'Primary target requires maximum firepower for critical defensive position.'
                            : 'Secondary target with substantial fire support for defensive flexibility.'
                          }
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-50 border rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">Summary</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Targets:</span> {mission.fpfTargets.length}
                  </div>
                  <div>
                    <span className="font-medium">Available Guns:</span> {mission.numberOfGuns}
                  </div>
                  <div>
                    <span className="font-medium">Total Rounds:</span> {
                      mission.fpfTargets.reduce((sum, target) => {
                        const tubes = target.priority === 'primary' ? 2 : 1;
                        const rounds = target.priority === 'primary' ? 12 : 8;
                        return sum + (tubes * rounds);
                      }, 0)
                    }
                  </div>
                  <div>
                    <span className="font-medium">Efficiency:</span> Optimal
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
