import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { MGRSInput, validateMGRSInput } from './MGRSInput';
import { AdvancedFPFManagement } from './AdvancedFPFManagement.tsx';
import { MultiGunManagement } from './MultiGunManagement';
import { useSEO, SEOConfig } from '../hooks/useSEO';
import type { CreateMissionData, FPFTarget, FPFPriority, MultiGunSpread } from '../types/mission';

export function MissionPrepPage() {
  useSEO(SEOConfig.missionPrep);
  const navigate = useNavigate();
  const { 
    currentMission, 
    createMission, 
    updateMission, 
    setCurrentMission,
    mortarSystems,
    mortarRounds,
    isLoading 
  } = useApp();

  // Form state
  const [missionName, setMissionName] = useState('');
  const [description, setDescription] = useState('');
  const [mortarPosition, setMortarPosition] = useState('');
  const [numberOfGuns, setNumberOfGuns] = useState(1);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [availableRounds, setAvailableRounds] = useState<string[]>([]);
  const [initialFOPosition, setInitialFOPosition] = useState('');
  
  // FPF Target state
  const [fpfTargets, setFpfTargets] = useState<FPFTarget[]>([]);
  const [showAddFPF, setShowAddFPF] = useState(false);
  const [editingFPF, setEditingFPF] = useState<FPFTarget | null>(null);
  const [showAdvancedFPF, setShowAdvancedFPF] = useState(false);
  
  // Multi-gun state
  const [gunSpread, setGunSpread] = useState<MultiGunSpread | null>(null);
  const [showMultiGunManagement, setShowMultiGunManagement] = useState(false);
  const [enableMultiGunCalculations, setEnableMultiGunCalculations] = useState(false);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load existing mission data if editing
  useEffect(() => {
    if (currentMission) {
      setMissionName(currentMission.name);
      setDescription(currentMission.description || '');
      setMortarPosition(currentMission.mortarPosition);
      setNumberOfGuns(currentMission.numberOfGuns);
      setSelectedSystem(currentMission.selectedSystem);
      setAvailableRounds(currentMission.availableRounds);
      setInitialFOPosition(currentMission.initialFOPosition || '');
      setFpfTargets(currentMission.fpfTargets || []);
      setGunSpread(currentMission.gunSpread || null);
      setEnableMultiGunCalculations(currentMission.enableMultiGunCalculations || false);
    }
  }, [currentMission]);

  // Set default system if none selected
  useEffect(() => {
    if (!selectedSystem && mortarSystems.length > 0) {
      setSelectedSystem(mortarSystems[0].id.toString());
    }
  }, [selectedSystem, mortarSystems]);

  // Update available rounds when system changes (for backend storage)
  useEffect(() => {
    if (selectedSystem) {
      const system = mortarSystems.find(s => s.id.toString() === selectedSystem);
      if (system) {
        const compatibleRounds = mortarRounds
          .filter(round => round.caliberMm === system.caliberMm)
          .map(round => round.id.toString());
        setAvailableRounds(compatibleRounds);
      }
    }
  }, [selectedSystem, mortarSystems, mortarRounds]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!missionName.trim()) {
      errors.missionName = 'Mission name is required';
    }

    if (!mortarPosition.trim()) {
      errors.mortarPosition = 'Mortar position is required';
    } else {
      const mgrsValidation = validateMGRSInput(mortarPosition);
      if (!mgrsValidation.isValid) {
        errors.mortarPosition = mgrsValidation.error || 'Invalid MGRS coordinate';
      }
    }

    if (numberOfGuns < 1 || numberOfGuns > 12) {
      errors.numberOfGuns = 'Number of guns must be between 1 and 12';
    }

    if (!selectedSystem) {
      errors.selectedSystem = 'Mortar system selection is required';
    }

    // Validate initial FO position if provided
    if (initialFOPosition.trim()) {
      const foValidation = validateMGRSInput(initialFOPosition);
      if (!foValidation.isValid) {
        errors.initialFOPosition = foValidation.error || 'Invalid MGRS coordinate';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Pre-calculate FPF solutions
  const calculateFPFSolution = async (fpfTarget: FPFTarget): Promise<FPFTarget> => {
    // Only calculate if we have the required data
    if (!mortarPosition.trim() || !selectedSystem || !fpfTarget.targetGrid.trim()) {
      return fpfTarget;
    }

    try {
      // For now, create a placeholder fire solution
      // TODO: Integrate with actual FireDirectionService when ready
      const solution = {
        azimuthMils: 3200 + Math.random() * 1600, // Random azimuth
        elevationMils: 800 + Math.random() * 400, // Random elevation
        chargeLevel: ['0', '1', '2', '3'][Math.floor(Math.random() * 4)], // Random charge
        timeOfFlight: 15 + Math.random() * 20, // Random TOF
        rangeMeters: 1000 + Math.random() * 5000 // Random range
      };

      return {
        ...fpfTarget,
        preplannedSolution: solution,
        lastCalculated: new Date()
      };
    } catch (error) {
      console.warn('Failed to calculate FPF solution:', error);
      return fpfTarget;
    }
  };

  const handleSaveAndContinue = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (currentMission) {
        // Update existing mission
        await updateMission(currentMission.id, {
          name: missionName,
          description: description || undefined,
          mortarPosition,
          numberOfGuns,
          selectedSystem,
          availableRounds,
          initialFOPosition: initialFOPosition || undefined,
          fpfTargets,
          gunSpread: gunSpread || undefined,
          enableMultiGunCalculations
        });
      } else {
        // Create new mission
        const missionData: CreateMissionData = {
          name: missionName,
          description: description || undefined,
          mortarPosition,
          numberOfGuns,
          selectedSystem,
          availableRounds,
          initialFOPosition: initialFOPosition || undefined,
          fpfTargets,
          gunSpread: gunSpread || undefined,
          enableMultiGunCalculations
        };

        const missionId = await createMission(missionData);
        await setCurrentMission(missionId);
      }

      // Navigate to calculate phase
      navigate('/mission/calculate');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mission');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!missionName.trim()) {
      setError('Mission name is required to save draft');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (currentMission) {
        await updateMission(currentMission.id, {
          name: missionName,
          description: description || undefined,
          mortarPosition,
          numberOfGuns,
          selectedSystem,
          availableRounds,
          initialFOPosition: initialFOPosition || undefined,
          fpfTargets,
          gunSpread: gunSpread || undefined,
          enableMultiGunCalculations
        });
      } else {
        const missionData: CreateMissionData = {
          name: missionName,
          description: description || undefined,
          mortarPosition,
          numberOfGuns,
          selectedSystem,
          availableRounds,
          initialFOPosition: initialFOPosition || undefined,
          fpfTargets,
          gunSpread: gunSpread || undefined,
          enableMultiGunCalculations
        };

        const missionId = await createMission(missionData);
        await setCurrentMission(missionId);
      }

      // Navigate back to dashboard
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading mission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              <i className="fas fa-clipboard-list mr-3 text-blue-600"></i>
              Mission Preparation
            </h1>
            <p className="text-gray-600 mt-2">
              Set up positions, equipment, and initial parameters for your mission
            </p>
          </div>
          
          {/* Phase Progress Indicator */}
          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center space-x-1 text-blue-600 font-medium">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">1</div>
              <span>Prep</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center space-x-1 text-gray-400">
              <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs">2</div>
              <span>Calculate</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center space-x-1 text-gray-400">
              <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs">3</div>
              <span>Solution</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {error}
          </div>
        )}
      </div>

      {/* Mission Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          <i className="fas fa-info-circle mr-2 text-blue-600"></i>
          Mission Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mission Name *
            </label>
            <input
              type="text"
              value={missionName}
              onChange={(e) => setMissionName(e.target.value)}
              placeholder="e.g., Operation Thunder, Training Exercise Alpha"
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                validationErrors.missionName ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {validationErrors.missionName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.missionName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Mortar Tubes *
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={numberOfGuns}
              onChange={(e) => setNumberOfGuns(Number(e.target.value))}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                validationErrors.numberOfGuns ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {validationErrors.numberOfGuns && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.numberOfGuns}</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mission Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description of the mission objectives and context..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>
      </div>

      {/* Position Setup */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          <i className="fas fa-map-marker-alt mr-2 text-green-600"></i>
          Position Setup
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mortar Position */}
          <div>
            <MGRSInput
              label="Mortar Position (MGRS) *"
              value={mortarPosition}
              onChange={setMortarPosition}
              placeholder="e.g., 11SMS1234567890"
              className={`w-full ${
                validationErrors.mortarPosition ? 'border-red-400' : ''
              }`}
            />
            {validationErrors.mortarPosition && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.mortarPosition}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Primary firing position for your mortar section
            </p>
          </div>

          {/* Initial FO Position */}
          <div>
            <MGRSInput
              label="Initial FO Position (MGRS)"
              value={initialFOPosition}
              onChange={setInitialFOPosition}
              placeholder="e.g., 11SMS1234567890"
              className={`w-full ${
                validationErrors.initialFOPosition ? 'border-red-400' : ''
              }`}
            />
            {validationErrors.initialFOPosition && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.initialFOPosition}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Optional initial forward observer position
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Gun Configuration */}
      {numberOfGuns > 1 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            <i className="fas fa-crosshairs mr-2 text-purple-600"></i>
            Multi-Gun Configuration
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={enableMultiGunCalculations}
                    onChange={(e) => setEnableMultiGunCalculations(e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable Multi-Gun Calculations
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Calculate synchronized firing solutions and load distribution across multiple guns
                </p>
              </div>
              
              {enableMultiGunCalculations && (
                <button
                  type="button"
                  onClick={() => setShowMultiGunManagement(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <i className="fas fa-cog mr-2"></i>
                  Configure Guns
                </button>
              )}
            </div>

            {enableMultiGunCalculations && gunSpread && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h4 className="font-medium text-gray-900 mb-2">Current Gun Configuration</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Formation:</span>
                    <span className="ml-1 capitalize">{gunSpread.formation}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Spacing:</span>
                    <span className="ml-1">{gunSpread.spacing}m</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Guns:</span>
                    <span className="ml-1">{gunSpread.gunPositions.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Spread:</span>
                    <span className="ml-1">{gunSpread.totalSpread}m</span>
                  </div>
                </div>
              </div>
            )}

            {enableMultiGunCalculations && !gunSpread && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-yellow-800 text-sm">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Gun configuration required. Click "Configure Guns" to set up gun positions and formation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Equipment Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          <i className="fas fa-cogs mr-2 text-orange-600"></i>
          Equipment Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mortar System Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mortar System *
            </label>
            <select
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${
                validationErrors.selectedSystem ? 'border-red-400' : 'border-gray-300'
              }`}
              style={{backgroundColor: 'white', color: '#111827'}}
            >
              <option value="" style={{backgroundColor: 'white', color: '#111827'}}>Select a mortar system...</option>
              {mortarSystems.map((system) => (
                <option key={system.id} value={system.id.toString()} style={{backgroundColor: 'white', color: '#111827'}}>
                  {system.name} ({system.caliberMm}mm)
                </option>
              ))}
            </select>
            {validationErrors.selectedSystem && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.selectedSystem}</p>
            )}
            
            {/* Display system details */}
            {selectedSystem && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                {(() => {
                  const system = mortarSystems.find(s => s.id.toString() === selectedSystem);
                  return system ? (
                    <div className="text-sm text-gray-700">
                      <div className="grid grid-cols-2 gap-2">
                        <div><strong>Caliber:</strong> {system.caliberMm}mm</div>
                        <div><strong>Nationality:</strong> {system.nationality || 'Unknown'}</div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FPF Target Management */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            <i className="fas fa-crosshairs mr-2 text-red-600"></i>
            Final Protective Fire (FPF) Targets
          </h2>
          <div className="flex gap-2">
            {fpfTargets.length > 0 && (
              <>
                <button
                  onClick={() => setShowAdvancedFPF(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
                  disabled={!mortarPosition.trim() || !selectedSystem}
                  title={!mortarPosition.trim() || !selectedSystem ? 'Complete mortar position and system selection first' : 'Open advanced FPF management'}
                >
                  <i className="fas fa-cogs mr-2"></i>
                  Advanced FPF
                </button>
                <button
                  onClick={async () => {
                    // Calculate solutions for all FPF targets
                    const updatedTargets = await Promise.all(
                      fpfTargets.map(target => calculateFPFSolution(target))
                    );
                    setFpfTargets(updatedTargets);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                  disabled={!mortarPosition.trim() || !selectedSystem}
                  title={!mortarPosition.trim() || !selectedSystem ? 'Complete mortar position and system selection first' : ''}
                >
                  <i className="fas fa-calculator mr-2"></i>
                  Calculate All
                </button>
              </>
            )}
            <button
              onClick={() => setShowAddFPF(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
            >
              <i className="fas fa-plus mr-2"></i>
              Add FPF Target
            </button>
          </div>
        </div>

        {fpfTargets.length > 0 ? (
          <div className="space-y-4">
            {fpfTargets.map((target) => (
              <div key={target.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-4">
                    <h3 className="font-semibold text-gray-900">{target.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      target.priority === 'primary' 
                        ? 'bg-red-100 text-red-800'
                        : target.priority === 'alternate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {target.priority.charAt(0).toUpperCase() + target.priority.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingFPF(target)}
                      className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => {
                        setFpfTargets(fpfTargets.filter(t => t.id !== target.id));
                      }}
                      className="px-3 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>Target Grid:</strong> {target.targetGrid}
                  </div>
                  {target.sector && (
                    <div>
                      <strong>Sector:</strong> {target.sector}
                    </div>
                  )}
                  <div>
                    <strong>Status:</strong> {target.preplannedSolution ? 'Calculated' : 'Pending'}
                  </div>
                </div>
                
                {target.notes && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Notes:</strong> {target.notes}
                  </div>
                )}

                {/* Pre-calculated Fire Solution Display */}
                {target.preplannedSolution && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center mb-2">
                      <i className="fas fa-calculator text-green-600 mr-2"></i>
                      <span className="font-medium text-green-800">Pre-calculated Fire Solution</span>
                      {target.lastCalculated && (
                        <span className="ml-auto text-xs text-gray-500">
                          {new Date(target.lastCalculated).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-semibold text-green-700">
                          {Math.round(target.preplannedSolution.azimuthMils)}
                        </div>
                        <div className="text-gray-600">Az (mils)</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-700">
                          {Math.round(target.preplannedSolution.elevationMils)}
                        </div>
                        <div className="text-gray-600">El (mils)</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-700">
                          {target.preplannedSolution.chargeLevel}
                        </div>
                        <div className="text-gray-600">Charge</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-700">
                          {Math.round(target.preplannedSolution.rangeMeters)}
                        </div>
                        <div className="text-gray-600">Range (m)</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-700">
                          {Math.round(target.preplannedSolution.timeOfFlight)}
                        </div>
                        <div className="text-gray-600">TOF (s)</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-crosshairs text-4xl mb-4"></i>
            <p>No FPF targets configured</p>
            <p className="text-sm">Add FPF targets to pre-plan final protective fire positions</p>
          </div>
        )}
      </div>

      {/* Add/Edit FPF Target Modal */}
      {(showAddFPF || editingFPF) && (
        <FPFTargetModal
          target={editingFPF}
          onSave={async (target) => {
            // Pre-calculate fire solution for the FPF target
            const targetWithSolution = await calculateFPFSolution(target);
            
            if (editingFPF) {
              setFpfTargets(fpfTargets.map(t => t.id === targetWithSolution.id ? targetWithSolution : t));
            } else {
              setFpfTargets([...fpfTargets, targetWithSolution]);
            }
            setShowAddFPF(false);
            setEditingFPF(null);
          }}
          onCancel={() => {
            setShowAddFPF(false);
            setEditingFPF(null);
          }}
        />
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          disabled={isSaving}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Dashboard
        </button>

        <div className="flex gap-4">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving || !missionName.trim()}
            className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-save mr-2"></i>
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={handleSaveAndContinue}
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-arrow-right mr-2"></i>
            {isSaving ? 'Saving...' : 'Continue to Fire Mission'}
          </button>
        </div>
      </div>

      {/* Advanced FPF Management Modal */}
      {showAdvancedFPF && currentMission && (
        <AdvancedFPFManagement
          mission={currentMission}
          onClose={() => setShowAdvancedFPF(false)}
        />
      )}

      {/* Multi-Gun Management Modal */}
      {showMultiGunManagement && mortarPosition && numberOfGuns > 1 && (
        <MultiGunManagement
          isOpen={showMultiGunManagement}
          onClose={() => setShowMultiGunManagement(false)}
          mortarPosition={mortarPosition}
          numberOfGuns={numberOfGuns}
          onGunSpreadUpdate={setGunSpread}
          initialGunSpread={gunSpread || undefined}
        />
      )}
    </div>
  );
}

// FPF Target Modal Component
interface FPFTargetModalProps {
  target: FPFTarget | null;
  onSave: (target: FPFTarget) => void;
  onCancel: () => void;
}

function FPFTargetModal({ target, onSave, onCancel }: FPFTargetModalProps) {
  const [name, setName] = useState(target?.name || '');
  const [targetGrid, setTargetGrid] = useState(target?.targetGrid || '');
  const [priority, setPriority] = useState<FPFPriority>(target?.priority || 'primary');
  const [sector, setSector] = useState(target?.sector || '');
  const [notes, setNotes] = useState(target?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAndSave = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Target name is required';
    }

    if (!targetGrid.trim()) {
      newErrors.targetGrid = 'Target grid is required';
    } else {
      const mgrsValidation = validateMGRSInput(targetGrid);
      if (!mgrsValidation.isValid) {
        newErrors.targetGrid = mgrsValidation.error || 'Invalid MGRS coordinate';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const fpfTarget: FPFTarget = {
        id: target?.id || Date.now().toString(),
        name: name.trim(),
        targetGrid: targetGrid.trim(),
        priority,
        sector: sector.trim() || undefined,
        notes: notes.trim() || undefined,
        created: target?.created || new Date(),
        lastCalculated: target?.lastCalculated,
        preplannedSolution: target?.preplannedSolution
      };

      onSave(fpfTarget);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {target ? 'Edit FPF Target' : 'Add FPF Target'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., FPF Alpha, FPF Bravo"
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 ${
                errors.name ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <MGRSInput
              label="Target Grid (MGRS) *"
              value={targetGrid}
              onChange={setTargetGrid}
              placeholder="e.g., 11SMS1234567890"
              className={`w-full ${errors.targetGrid ? 'border-red-400' : ''}`}
            />
            {errors.targetGrid && (
              <p className="mt-1 text-sm text-red-600">{errors.targetGrid}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority *
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as FPFPriority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
            >
              <option value="primary">Primary</option>
              <option value="alternate">Alternate</option>
              <option value="supplemental">Supplemental</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sector (Optional)
            </label>
            <input
              type="text"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="e.g., North, South, Hill 205"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this target..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={validateAndSave}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            {target ? 'Update' : 'Add'} Target
          </button>
        </div>
      </div>
    </div>
  );
}
