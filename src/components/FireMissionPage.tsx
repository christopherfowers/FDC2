import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { MGRSInput, validateMGRSInput } from './MGRSInput';
import type { TacticalOptimization, FireControl } from '../types/mission';

export function FireMissionPage() {
  const navigate = useNavigate();
  const { 
    currentMission,
    updateMission,
    isLoading 
  } = useApp();

  // Form state
  const [foPosition, setFOPosition] = useState('');
  const [targetGrid, setTargetGrid] = useState('');
  const [fireControl, setFireControl] = useState<FireControl>('fire_when_ready');
  const [numberOfRounds, setNumberOfRounds] = useState(1);
  const [optimization, setOptimization] = useState<TacticalOptimization>('accuracy');

  // NATO 6-Line state
  const [missionType, setMissionType] = useState<'adjust_fire' | 'fire_for_effect' | 'immediate_suppression'>('adjust_fire');
  const [targetDescription, setTargetDescription] = useState('');
  const [methodOfEngagement, setMethodOfEngagement] = useState('');
  const [observerDirection, setObserverDirection] = useState<number | ''>('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showFPFTargets, setShowFPFTargets] = useState(false);

  // Load initial data from mission
  useEffect(() => {
    if (currentMission) {
      setFOPosition(currentMission.initialFOPosition || '');
    }
  }, [currentMission]);

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

    if (!methodOfEngagement) {
      errors.methodOfEngagement = 'Method of engagement is required';
    }

    if (numberOfRounds < 1 || numberOfRounds > 999) {
      errors.numberOfRounds = 'Number of rounds must be between 1 and 999';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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
          numberOfRounds,
          optimization,
          missionType,
          targetDescription,
          methodOfEngagement,
          observerDirection
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
              <i className="fas fa-radio mr-3 text-red-600"></i>
              NATO Call for Fire
            </h1>
            <p className="text-gray-600 mt-2">
              NATO 6-Line Call for Fire Format for{' '}
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

      {/* NATO 6-Line Call for Fire */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          <i className="fas fa-radio mr-2 text-blue-600"></i>
          NATO Call for Fire
        </h2>
        
        {/* Sequential NATO Lines */}
        <div className="space-y-4">
          {/* Line 1: Type of Mission */}
          <div className="flex items-start space-x-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex-shrink-0">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-semibold text-sm">1</span>
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="font-semibold text-blue-900 mb-2">Type of Mission</h3>
              <select
                value={missionType}
                onChange={(e) => setMissionType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                <option value="adjust_fire">Adjust Fire</option>
                <option value="fire_for_effect">Fire For Effect</option>
                <option value="immediate_suppression">Immediate Suppression</option>
              </select>
            </div>
          </div>

          {/* Line 2: Target Location */}
          <div className="flex items-start space-x-4 p-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex-shrink-0">
              <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-semibold text-sm">2</span>
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="font-semibold text-green-900 mb-2">Target Location (Grid)</h3>
              <div className="space-y-3">
                <div>
                  <MGRSInput
                    label=""
                    value={targetGrid}
                    onChange={setTargetGrid}
                    placeholder="e.g., 18TVL1234567890"
                    className={`w-full ${
                      validationErrors.targetGrid ? 'border-red-400' : ''
                    }`}
                  />
                  {validationErrors.targetGrid && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.targetGrid}</p>
                  )}
                </div>
                
                {/* FPF Targets Quick Select */}
                {currentMission.fpfTargets.length > 0 && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowFPFTargets(!showFPFTargets)}
                      className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <i className="fas fa-star mr-1"></i>
                      {showFPFTargets ? 'Hide' : 'Show'} FPF Targets
                    </button>
                    
                    {showFPFTargets && (
                      <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                        {currentMission.fpfTargets.map(target => (
                          <button
                            key={target.id}
                            onClick={() => {
                              setTargetGrid(target.targetGrid);
                              setTargetDescription(target.name);
                              setShowFPFTargets(false);
                            }}
                            className="text-left p-2 bg-white border border-gray-200 rounded text-xs hover:bg-green-50"
                          >
                            <div className="font-medium text-gray-800">{target.name}</div>
                            <div className="text-gray-600 font-mono">{target.targetGrid}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line 3: Target Description */}
          <div className="flex items-start space-x-4 p-4 border border-purple-200 rounded-lg bg-purple-50">
            <div className="flex-shrink-0">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-semibold text-sm">3</span>
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="font-semibold text-purple-900 mb-2">Target Description <span className="text-xs text-purple-600">(Optional)</span></h3>
              <input
                type="text"
                value={targetDescription}
                onChange={(e) => setTargetDescription(e.target.value)}
                placeholder="e.g., Personnel in the open, Bunker, Vehicle"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Line 4: Method of Engagement */}
          <div className="flex items-start space-x-4 p-4 border border-orange-200 rounded-lg bg-orange-50">
            <div className="flex-shrink-0">
              <span className="flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-full font-semibold text-sm">4</span>
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="font-semibold text-orange-900 mb-2">Method of Engagement *</h3>
              <select
                value={methodOfEngagement}
                onChange={(e) => setMethodOfEngagement(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white ${
                  validationErrors.methodOfEngagement ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                <option value="">Select method of engagement...</option>
                <option value="high_explosive">High Explosive</option>
                <option value="smoke">Smoke</option>
                <option value="illumination">Illumination</option>
                <option value="white_phosphorus">White Phosphorus</option>
              </select>
              {validationErrors.methodOfEngagement && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.methodOfEngagement}</p>
              )}
            </div>
          </div>

          {/* Line 5: Method of Fire and Control */}
          <div className="flex items-start space-x-4 p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex-shrink-0">
              <span className="flex items-center justify-center w-8 h-8 bg-red-600 text-white rounded-full font-semibold text-sm">5</span>
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="font-semibold text-red-900 mb-2">Method of Fire and Control</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-red-800 mb-1">Fire Control</label>
                  <select
                    value={fireControl}
                    onChange={(e) => setFireControl(e.target.value as FireControl)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white text-sm"
                  >
                    <option value="fire_when_ready">Fire When Ready</option>
                    <option value="on_command">At My Command</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-red-800 mb-1">Number of Rounds</label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={numberOfRounds}
                    onChange={(e) => setNumberOfRounds(Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white text-sm ${
                      validationErrors.numberOfRounds ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.numberOfRounds && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.numberOfRounds}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Line 6: Direction */}
          <div className="flex items-start space-x-4 p-4 border border-indigo-200 rounded-lg bg-indigo-50">
            <div className="flex-shrink-0">
              <span className="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full font-semibold text-sm">6</span>
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="font-semibold text-indigo-900 mb-2">Direction (Observer to Target)</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-indigo-800 mb-1">Forward Observer Position</label>
                  <MGRSInput
                    label=""
                    value={foPosition}
                    onChange={setFOPosition}
                    placeholder="e.g., 18TVL0987654321"
                    className={`w-full text-sm ${
                      validationErrors.foPosition ? 'border-red-400' : ''
                    }`}
                  />
                  {validationErrors.foPosition && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.foPosition}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-indigo-800 mb-1">Direction in Mils</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={observerDirection}
                      onChange={(e) => setObserverDirection(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0000"
                      min="0"
                      max="6400"
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                    />
                    <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 text-sm">mils</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NATO Call Summary */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg border-l-4 border-gray-400">
          <h4 className="font-semibold text-gray-800 mb-2">
            <i className="fas fa-clipboard-check mr-2"></i>
            Call for Fire Summary
          </h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div><strong>Line 1:</strong> {missionType ? missionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not set'}</div>
            <div><strong>Line 2:</strong> {targetGrid || 'Target grid not set'}</div>
            <div><strong>Line 3:</strong> {targetDescription || 'No description'}</div>
            <div><strong>Line 4:</strong> {methodOfEngagement ? methodOfEngagement.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not selected'}</div>
            <div><strong>Line 5:</strong> {fireControl === 'fire_when_ready' ? 'Fire When Ready' : 'At My Command'} • {numberOfRounds || '0'} rounds</div>
            <div><strong>Line 6:</strong> {observerDirection ? `${observerDirection} mils` : 'Direction not set'}</div>
          </div>
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
