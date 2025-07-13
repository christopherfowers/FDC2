import { useState, useEffect } from 'react';
import type { 
  MultiGunSpread, 
  SynchronizedFireSolution, 
  LoadDistribution,
  FireSolution
} from '../types/mission';
import { MultiGunService } from '../services/multiGunService';

interface MultiGunManagementProps {
  isOpen: boolean;
  onClose: () => void;
  mortarPosition: string;
  numberOfGuns: number;
  onGunSpreadUpdate: (gunSpread: MultiGunSpread) => void;
  initialGunSpread?: MultiGunSpread;
}

export function MultiGunManagement({
  isOpen,
  onClose,
  mortarPosition,
  numberOfGuns,
  onGunSpreadUpdate,
  initialGunSpread
}: MultiGunManagementProps) {
  const [activeTab, setActiveTab] = useState<'formation' | 'solution' | 'distribution'>('formation');
  const [gunSpread, setGunSpread] = useState<MultiGunSpread | null>(initialGunSpread || null);
  const [formation, setFormation] = useState<MultiGunSpread['formation']>('line');
  const [spacing, setSpacing] = useState(50);
  const [orientation, setOrientation] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Sample fire solution for demonstration
  const [sampleFireSolution, setSampleFireSolution] = useState<FireSolution>({
    azimuthMils: 3200,
    elevationMils: 800,
    chargeLevel: 'Charge 4',
    timeOfFlight: 45.2,
    rangeMeters: 2500
  });
  const [synchronizedSolution, setSynchronizedSolution] = useState<SynchronizedFireSolution | null>(null);
  const [loadDistribution, setLoadDistribution] = useState<LoadDistribution | null>(null);
  const [totalRounds, setTotalRounds] = useState(12);
  const [distributionMethod, setDistributionMethod] = useState<LoadDistribution['distributionMethod']>('equal');

  // Generate gun spread when parameters change
  useEffect(() => {
    if (mortarPosition && numberOfGuns > 0) {
      try {
        const newGunSpread = MultiGunService.calculateGunSpread(
          mortarPosition,
          numberOfGuns,
          formation,
          spacing,
          orientation
        );
        setGunSpread(newGunSpread);
        
        // Validate the gun spread
        const validation = MultiGunService.validateGunSpread(newGunSpread);
        if (!validation.isValid) {
          setValidationErrors({ gunSpread: validation.errors.join(', ') });
        } else {
          setValidationErrors({});
        }
      } catch (error) {
        console.error('Failed to calculate gun spread:', error);
        setValidationErrors({ gunSpread: 'Failed to calculate gun positions' });
      }
    }
  }, [mortarPosition, numberOfGuns, formation, spacing, orientation]);

  // Calculate synchronized solution when gun spread changes
  useEffect(() => {
    if (gunSpread && gunSpread.gunPositions.length > 1) {
      try {
        const targetGrid = '33UXP1250068500'; // Sample target
        const solution = MultiGunService.calculateSynchronizedFireSolution(
          gunSpread,
          targetGrid,
          sampleFireSolution,
          true // Simultaneous impact
        );
        setSynchronizedSolution(solution);
      } catch (error) {
        console.error('Failed to calculate synchronized solution:', error);
      }
    }
  }, [gunSpread, sampleFireSolution]);

  // Calculate load distribution
  useEffect(() => {
    if (numberOfGuns > 1) {
      const distribution = MultiGunService.calculateLoadDistribution(
        numberOfGuns,
        totalRounds,
        distributionMethod
      );
      setLoadDistribution(distribution);
    }
  }, [numberOfGuns, totalRounds, distributionMethod]);

  const handleApplyGunSpread = () => {
    if (gunSpread && Object.keys(validationErrors).length === 0) {
      onGunSpreadUpdate(gunSpread);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            <i className="fas fa-crosshairs mr-2 text-blue-600"></i>
            Multi-Gun Calculations
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('formation')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'formation'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="fas fa-grip-horizontal mr-2"></i>
              Gun Formation
            </button>
            <button
              onClick={() => setActiveTab('solution')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'solution'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="fas fa-bullseye mr-2"></i>
              Synchronized Solution
            </button>
            <button
              onClick={() => setActiveTab('distribution')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'distribution'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="fas fa-divide mr-2"></i>
              Load Distribution
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Gun Formation Tab */}
          {activeTab === 'formation' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formation Type
                  </label>
                  <select
                    value={formation}
                    onChange={(e) => setFormation(e.target.value as MultiGunSpread['formation'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="line">Line Formation</option>
                    <option value="arc">Arc Formation</option>
                    <option value="dispersed">Dispersed Formation</option>
                    <option value="custom">Custom Formation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gun Spacing (meters)
                  </label>
                  <input
                    type="number"
                    value={spacing}
                    onChange={(e) => setSpacing(Number(e.target.value))}
                    min="10"
                    max="1000"
                    step="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orientation (mils)
                  </label>
                  <input
                    type="number"
                    value={orientation}
                    onChange={(e) => setOrientation(Number(e.target.value))}
                    min="0"
                    max="6399"
                    step="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {validationErrors.gunSpread && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-700 text-sm">{validationErrors.gunSpread}</p>
                </div>
              )}

              {/* Formation Description */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-medium text-blue-900 mb-2">Formation Details</h4>
                <div className="text-sm text-blue-800">
                  {formation === 'line' && (
                    <p>Linear formation with guns arranged in a straight line perpendicular to the orientation.</p>
                  )}
                  {formation === 'arc' && (
                    <p>Arc formation with guns spread in a curved line for improved coverage angles.</p>
                  )}
                  {formation === 'dispersed' && (
                    <p>Dispersed formation with guns positioned in a diamond/box pattern for survivability.</p>
                  )}
                  {formation === 'custom' && (
                    <p>Custom formation allows manual positioning of individual guns (currently defaults to line).</p>
                  )}
                </div>
              </div>

              {/* Gun Positions Display */}
              {gunSpread && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Gun Positions ({gunSpread.gunPositions.length} guns)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {gunSpread.gunPositions.map((gun) => (
                      <div key={gun.id} className="bg-white border border-gray-200 rounded p-3">
                        <div className="font-medium text-gray-900">{gun.name}</div>
                        <div className="text-sm text-gray-600">
                          Grid: {gun.position}
                        </div>
                        <div className="text-xs text-gray-500">
                          Status: {gun.status}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    Total Spread: {gunSpread.totalSpread}m
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Synchronized Solution Tab */}
          {activeTab === 'solution' && (
            <div className="space-y-6">
              {/* Sample Fire Solution Input */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h4 className="font-medium text-yellow-900 mb-3">
                  <i className="fas fa-info-circle mr-2"></i>
                  Sample Fire Solution (for demonstration)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs text-yellow-800 mb-1">Azimuth (mils)</label>
                    <input
                      type="number"
                      value={sampleFireSolution.azimuthMils}
                      onChange={(e) => setSampleFireSolution(prev => ({ ...prev, azimuthMils: Number(e.target.value) }))}
                      className="w-full px-2 py-1 text-sm border border-yellow-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-yellow-800 mb-1">Elevation (mils)</label>
                    <input
                      type="number"
                      value={sampleFireSolution.elevationMils}
                      onChange={(e) => setSampleFireSolution(prev => ({ ...prev, elevationMils: Number(e.target.value) }))}
                      className="w-full px-2 py-1 text-sm border border-yellow-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-yellow-800 mb-1">Range (m)</label>
                    <input
                      type="number"
                      value={sampleFireSolution.rangeMeters}
                      onChange={(e) => setSampleFireSolution(prev => ({ ...prev, rangeMeters: Number(e.target.value) }))}
                      className="w-full px-2 py-1 text-sm border border-yellow-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-yellow-800 mb-1">Time of Flight (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={sampleFireSolution.timeOfFlight}
                      onChange={(e) => setSampleFireSolution(prev => ({ ...prev, timeOfFlight: Number(e.target.value) }))}
                      className="w-full px-2 py-1 text-sm border border-yellow-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-yellow-800 mb-1">Charge Level</label>
                    <input
                      type="text"
                      value={sampleFireSolution.chargeLevel}
                      onChange={(e) => setSampleFireSolution(prev => ({ ...prev, chargeLevel: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-yellow-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Synchronized Solutions Display */}
              {synchronizedSolution && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Synchronized Fire Solutions
                    {synchronizedSolution.simultaneousImpact && (
                      <span className="ml-2 text-sm text-green-600">
                        <i className="fas fa-clock mr-1"></i>
                        Simultaneous Impact
                      </span>
                    )}
                  </h4>
                  
                  <div className="space-y-3">
                    {synchronizedSolution.gunSolutions.map((gunSolution) => (
                      <div key={gunSolution.gunId} className="bg-white border border-gray-200 rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{gunSolution.gunName}</div>
                            <div className="text-sm text-gray-600">Grid: {gunSolution.position}</div>
                          </div>
                          <div className="text-right">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>Az: {gunSolution.fireSolution.azimuthMils}</div>
                              <div>El: {gunSolution.fireSolution.elevationMils}</div>
                              <div>Range: {gunSolution.fireSolution.rangeMeters}m</div>
                              <div>TOF: {gunSolution.fireSolution.timeOfFlight}s</div>
                            </div>
                            {gunSolution.timeDelay > 0 && (
                              <div className="text-xs text-orange-600 mt-1">
                                Delay: {gunSolution.timeDelay.toFixed(1)}s
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <h5 className="font-medium text-blue-900 mb-2">Impact Pattern</h5>
                    <div className="grid grid-cols-3 gap-2 text-sm text-blue-800">
                      <div>Width: {synchronizedSolution.spreadPattern.width}m</div>
                      <div>Depth: {synchronizedSolution.spreadPattern.depth}m</div>
                      <div>Center: {synchronizedSolution.spreadPattern.center}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Load Distribution Tab */}
          {activeTab === 'distribution' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Rounds
                  </label>
                  <input
                    type="number"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(Number(e.target.value))}
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distribution Method
                  </label>
                  <select
                    value={distributionMethod}
                    onChange={(e) => setDistributionMethod(e.target.value as LoadDistribution['distributionMethod'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="equal">Equal Distribution</option>
                    <option value="weighted">Weighted Distribution</option>
                    <option value="priority">Priority Distribution</option>
                    <option value="custom">Custom Distribution</option>
                  </select>
                </div>
              </div>

              {/* Load Distribution Display */}
              {loadDistribution && (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Gun Assignments</h4>
                    <div className="space-y-2">
                      {loadDistribution.gunAssignments.map((assignment) => (
                        <div key={assignment.gunId} className="bg-white border border-gray-200 rounded p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900">{assignment.gunName}</div>
                              <div className="text-sm text-gray-600">{assignment.justification}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-blue-600">
                                {assignment.assignedRounds} rounds
                              </div>
                              <div className="text-sm text-gray-500">
                                Order: #{assignment.firingOrder}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Firing Sequence</h4>
                    <div className="space-y-2">
                      {loadDistribution.firingSequence.map((phase) => (
                        <div key={phase.phase} className="bg-white border border-gray-200 rounded p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-gray-900">
                                Phase {phase.phase}
                              </div>
                              <div className="text-sm text-gray-600">
                                Guns: {phase.guns.join(', ')}
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <div>{phase.roundsPerGun} round(s) per gun</div>
                              <div className="text-gray-500">
                                Interval: {phase.interval}s
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {numberOfGuns} guns configured • {gunSpread?.totalSpread || 0}m total spread
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyGunSpread}
              disabled={!gunSpread || Object.keys(validationErrors).length > 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Apply Gun Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
