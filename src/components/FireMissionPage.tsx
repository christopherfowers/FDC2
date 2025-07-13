import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { MGRSInput, validateMGRSInput } from './MGRSInput';
import type { FPFTarget, TacticalOptimization, FireControl } from '../types/mission';

export function FireMissionPage() {
  const navigate = useNavigate();
  const { 
    currentMission,
    updateMission,
    mortarRounds,
    isLoading 
  } = useApp();

  // Form state
  const [foPosition, setFOPosition] = useState('');
  const [targetGrid, setTargetGrid] = useState('');
  const [fireControl, setFireControl] = useState<FireControl>('fire_when_ready');
  const [roundType, setRoundType] = useState('');
  const [numberOfRounds, setNumberOfRounds] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [optimization, setOptimization] = useState<TacticalOptimization>('accuracy');
  const [selectedFPFTarget, setSelectedFPFTarget] = useState<string | null>(null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showFPFTargets, setShowFPFTargets] = useState(false);

  // Load initial data from mission
  useEffect(() => {
    if (currentMission) {
      setFOPosition(currentMission.initialFOPosition || '');
      // Set default round type to first available
      if (currentMission.availableRounds.length > 0 && !roundType) {
        setRoundType(currentMission.availableRounds[0]);
      }
    }
  }, [currentMission, roundType]);

  // Redirect if no mission
  useEffect(() => {
    if (!isLoading && !currentMission) {
      navigate('/mission/prep');
    }
  }, [currentMission, isLoading, navigate]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!foPosition.trim()) {
      errors.foPosition = 'Forward observer position is required';
    } else {
      const foValidation = validateMGRSInput(foPosition);
      if (!foValidation.isValid) {
        errors.foPosition = foValidation.error || 'Invalid MGRS coordinate';
      }
    }

    if (!targetGrid.trim()) {
      errors.targetGrid = 'Target grid is required';
    } else {
      const targetValidation = validateMGRSInput(targetGrid);
      if (!targetValidation.isValid) {
        errors.targetGrid = targetValidation.error || 'Invalid MGRS coordinate';
      }
    }

    if (!roundType) {
      errors.roundType = 'Round type selection is required';
    }

    if (numberOfRounds < 1 || numberOfRounds > 999) {
      errors.numberOfRounds = 'Number of rounds must be between 1 and 999';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFPFTargetSelect = (fpfTarget: FPFTarget) => {
    setTargetGrid(fpfTarget.targetGrid);
    setSelectedFPFTarget(fpfTarget.id);
    setShowFPFTargets(false);
    
    // Clear any validation errors for target grid
    if (validationErrors.targetGrid) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated.targetGrid;
        return updated;
      });
    }
  };

  const handleContinueToSolution = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Update mission with current fire mission data if needed
      if (currentMission) {
        await updateMission(currentMission.id, {
          currentPhase: 'solution' as const
        });
      }

      // Navigate to fire solution page with fire mission data
      navigate('/mission/solution', {
        state: {
          foPosition,
          targetGrid,
          fireControl,
          roundType,
          numberOfRounds,
          specialInstructions,
          optimization,
          selectedFPFTarget
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to proceed to fire solution');
    } finally {
      setIsSaving(false);
    }
  };

  const getOptimizationDescription = (opt: TacticalOptimization): string => {
    switch (opt) {
      case 'speed': return 'Fastest time of flight (shortest trajectory)';
      case 'accuracy': return 'Best precision (balanced charge/angle)';
      case 'dispersion': return 'Area target coverage (spread pattern)';
      case 'high_angle': return 'Obstacle clearance (high trajectory)';
      case 'efficiency': return 'Lowest charge consumption';
      default: return '';
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

  if (!currentMission) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              <i className="fas fa-crosshairs mr-3 text-orange-600"></i>
              Fire Mission Calculations
            </h1>
            <p className="text-gray-600 mt-2">
              Configure call for fire details and tactical optimization for{' '}
              <span className="font-semibold">{currentMission.name}</span>
            </p>
          </div>
          
          {/* Phase Progress Indicator */}
          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center space-x-1 text-green-600">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">
                <i className="fas fa-check text-xs"></i>
              </div>
              <span>Prep</span>
            </div>
            <div className="w-8 h-0.5 bg-green-600"></div>
            <div className="flex items-center space-x-1 text-orange-600 font-medium">
              <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs">2</div>
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

      {/* Target Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          <i className="fas fa-map-pin mr-2 text-red-600"></i>
          Target Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FO Position */}
          <div>
            <MGRSInput
              label="Forward Observer Position (MGRS) *"
              value={foPosition}
              onChange={setFOPosition}
              placeholder="e.g., 11SMS1234567890"
              className={`w-full ${
                validationErrors.foPosition ? 'border-red-400' : ''
              }`}
            />
            {validationErrors.foPosition && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.foPosition}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Current position of the forward observer
            </p>
          </div>

          {/* Target Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <MGRSInput
                label="Target Grid (MGRS) *"
                value={targetGrid}
                onChange={setTargetGrid}
                placeholder="e.g., 11SMS1234567890"
                className={`w-full ${
                  validationErrors.targetGrid ? 'border-red-400' : ''
                }`}
              />
              
              {/* FPF Target Quick Select */}
              {currentMission.fpfTargets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowFPFTargets(!showFPFTargets)}
                  className="ml-3 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm whitespace-nowrap"
                >
                  <i className="fas fa-list mr-1"></i>
                  FPF Targets
                </button>
              )}
            </div>
            
            {validationErrors.targetGrid && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.targetGrid}</p>
            )}
            
            {selectedFPFTarget && (
              <p className="mt-1 text-xs text-purple-600">
                <i className="fas fa-star mr-1"></i>
                Using FPF target: {currentMission.fpfTargets.find(t => t.id === selectedFPFTarget)?.name}
              </p>
            )}
            
            <p className="mt-1 text-xs text-gray-500">
              MGRS coordinate of the target to engage
            </p>
          </div>
        </div>

        {/* FPF Targets Dropdown */}
        {showFPFTargets && currentMission.fpfTargets.length > 0 && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
            <h4 className="text-sm font-medium text-purple-800 mb-3">
              <i className="fas fa-star mr-2"></i>
              Select FPF Target
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentMission.fpfTargets.map(target => (
                <button
                  key={target.id}
                  onClick={() => handleFPFTargetSelect(target)}
                  className="text-left p-3 bg-white border border-purple-300 rounded-md hover:bg-purple-100 hover:border-purple-400 transition-colors"
                >
                  <div className="font-medium text-purple-800">{target.name}</div>
                  <div className="text-sm text-gray-600">{target.targetGrid}</div>
                  <div className="text-xs text-purple-600 capitalize">{target.priority} Priority</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Call for Fire Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          <i className="fas fa-cog mr-2 text-blue-600"></i>
          Call for Fire Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Fire Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fire Control *
            </label>
            <select
              value={fireControl}
              onChange={(e) => setFireControl(e.target.value as FireControl)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="fire_when_ready">Fire When Ready</option>
              <option value="on_command">At My Command</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {fireControl === 'fire_when_ready' 
                ? 'Fire immediately when ready' 
                : 'Wait for command to fire'
              }
            </p>
          </div>

          {/* Round Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Round Type *
            </label>
            <select
              value={roundType}
              onChange={(e) => setRoundType(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                validationErrors.roundType ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <option value="">Select round type...</option>
              {currentMission.availableRounds.map(roundId => {
                const round = mortarRounds.find(r => r.id.toString() === roundId);
                return round ? (
                  <option key={roundId} value={roundId}>
                    {round.name} ({round.roundType})
                  </option>
                ) : null;
              })}
            </select>
            {validationErrors.roundType && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.roundType}</p>
            )}
          </div>

          {/* Number of Rounds */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Rounds *
            </label>
            <input
              type="number"
              min="1"
              max="999"
              value={numberOfRounds}
              onChange={(e) => setNumberOfRounds(Number(e.target.value))}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                validationErrors.numberOfRounds ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {validationErrors.numberOfRounds && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.numberOfRounds}</p>
            )}
          </div>
        </div>

        {/* Special Instructions */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Instructions
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Any special instructions for this fire mission..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>
      </div>

      {/* Tactical Optimization */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          <i className="fas fa-bullseye mr-2 text-green-600"></i>
          Tactical Optimization
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(['speed', 'accuracy', 'dispersion', 'high_angle', 'efficiency'] as TacticalOptimization[]).map(opt => (
            <div
              key={opt}
              onClick={() => setOptimization(opt)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                optimization === opt
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center mb-2">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  optimization === opt
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300'
                }`}>
                  {optimization === opt && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <h4 className="font-medium text-gray-800 capitalize">
                  {opt === 'high_angle' ? 'High Angle' : opt}
                </h4>
              </div>
              <p className="text-sm text-gray-600">
                {getOptimizationDescription(opt)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <button
          onClick={() => navigate('/mission/prep')}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          disabled={isSaving}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Mission Prep
        </button>

        <button
          onClick={handleContinueToSolution}
          disabled={isSaving}
          className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-calculator mr-2"></i>
          {isSaving ? 'Processing...' : 'Calculate Fire Solution'}
        </button>
      </div>
    </div>
  );
}
