import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { MGRSInput, validateMGRSInput } from './MGRSInput';
import { MGRSService } from '../services/mgrsService';
import type { FPFTarget } from '../types/mission';

export function FireMissionPageNATO() {
  const navigate = useNavigate();
  const { 
    currentMission,
    updateMission,
    mortarRounds,
    isLoading 
  } = useApp();

  // NATO 6-Line Call for Fire state
  const [missionType, setMissionType] = useState<'adjust_fire' | 'fire_for_effect' | 'immediate_suppression'>('adjust_fire');
  const [targetGrid, setTargetGrid] = useState('');
  const [targetDescription, setTargetDescription] = useState('');
  const [methodOfEngagement, setMethodOfEngagement] = useState('');
  const [methodOfFireControl, setMethodOfFireControl] = useState<'at_my_command' | 'fire_when_ready'>('fire_when_ready');
  const [observerDirection, setObserverDirection] = useState<number | ''>('');

  // Enhanced FO data
  const [foPosition, setFOPosition] = useState('');
  const [foAzimuthToTarget, setFOAzimuthToTarget] = useState<number | ''>('');
  const [foDistanceToTarget, setFODistanceToTarget] = useState<number | ''>('');
  
  // Additional mission parameters
  const [roundType, setRoundType] = useState('');
  const [numberOfRounds, setNumberOfRounds] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedFPFTarget, setSelectedFPFTarget] = useState<string | null>(null);

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generatedCallForFire, setGeneratedCallForFire] = useState('');

  // Generate NATO call for fire message
  useEffect(() => {
    const generateCallForFire = () => {
      if (!targetGrid || !targetDescription || !observerDirection) return '';
      
      const missionTypeText = {
        'adjust_fire': 'Adjust Fire',
        'fire_for_effect': 'Fire For Effect', 
        'immediate_suppression': 'Immediate Suppression'
      }[missionType];
      
      const parts = [
        missionTypeText,
        `Grid ${targetGrid}`,
        targetDescription,
        methodOfEngagement ? methodOfEngagement : undefined,
        methodOfFireControl === 'at_my_command' ? 'At my command' : 'Fire when ready',
        `Direction ${observerDirection}`,
        'Over'
      ].filter(Boolean);
      
      return parts.join(', ') + '.';
    };
    
    setGeneratedCallForFire(generateCallForFire());
  }, [missionType, targetGrid, targetDescription, methodOfEngagement, methodOfFireControl, observerDirection]);

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

  // Auto-scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!missionType) {
        errors.missionType = 'Mission type is required';
      }
    } else if (currentStep === 2) {
      if (!targetGrid.trim()) {
        errors.targetGrid = 'Target grid is required';
      } else {
        const targetValidation = validateMGRSInput(targetGrid);
        if (!targetValidation.isValid) {
          errors.targetGrid = targetValidation.error || 'Invalid MGRS coordinate';
        }
      }
    } else if (currentStep === 3) {
      if (!targetDescription.trim()) {
        errors.targetDescription = 'Target description is required';
      }
    } else if (currentStep === 4) {
      // Method of engagement is optional
    } else if (currentStep === 5) {
      if (!methodOfFireControl) {
        errors.methodOfFireControl = 'Fire control method is required';
      }
    } else if (currentStep === 6) {
      if (observerDirection === '' || typeof observerDirection !== 'number' || observerDirection < 0 || observerDirection > 6400) {
        errors.observerDirection = 'Observer direction must be between 0 and 6400 mils';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

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

    if (!targetDescription.trim()) {
      errors.targetDescription = 'Target description is required';
    }

    if (observerDirection === '' || typeof observerDirection !== 'number' || observerDirection < 0 || observerDirection > 6400) {
      errors.observerDirection = 'Observer direction must be between 0 and 6400 mils';
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

  const calculateTargetFromFOData = (): string => {
    if (foPosition.trim() && typeof foAzimuthToTarget === 'number' && typeof foDistanceToTarget === 'number') {
      try {
        return MGRSService.calculateTargetFromPolar(foPosition, foAzimuthToTarget, foDistanceToTarget);
      } catch (error) {
        console.warn('Failed to calculate target from FO data:', error);
        return '';
      }
    }
    return '';
  };

  const handleFPFTargetSelect = (target: FPFTarget) => {
    setTargetGrid(target.targetGrid);
    setSelectedFPFTarget(target.id);
    setTargetDescription(target.name); // Use FPF target name as description
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
          foAzimuthToTarget,
          foDistanceToTarget,
          methodOfFireControl,
          roundType,
          numberOfRounds,
          specialInstructions,
          selectedFPFTarget,
          missionType,
          targetDescription,
          methodOfEngagement,
          observerDirection,
          generatedCallForFire
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to continue to solution');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-2 text-gray-600">Loading mission data...</p>
        </div>
      </div>
    );
  }

  if (!currentMission) {
    return null; // Will redirect in useEffect
  }

  const calculatedTargetGrid = calculateTargetFromFOData();

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            <i className="fas fa-list-ol mr-2 text-red-600"></i>
            NATO 6-Line Call for Fire
          </h2>
          <div className="text-sm text-gray-600">
            Step {currentStep} of 6
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className={`flex items-center ${step < 6 ? 'flex-1' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step < currentStep ? 'bg-green-600 text-white' :
                  step === currentStep ? 'bg-blue-600 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 6 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step < currentStep ? 'bg-green-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Mission Type</span>
            <span>Location</span>
            <span>Description</span>
            <span>Engagement</span>
            <span>Fire Control</span>
            <span>Direction</span>
          </div>
        </div>

        {/* Step 1: Mission Type */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Step 1: Type of Mission</h3>
            <p className="text-sm text-gray-600">Select the type of fire mission you are calling in.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'adjust_fire', label: 'Adjust Fire', desc: 'Observe and adjust rounds onto target', icon: 'fas fa-crosshairs' },
                { value: 'fire_for_effect', label: 'Fire For Effect', desc: 'Maximum effect on confirmed target', icon: 'fas fa-fire' },
                { value: 'immediate_suppression', label: 'Immediate Suppression', desc: 'Urgent suppressive fire', icon: 'fas fa-exclamation-triangle' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMissionType(option.value as any)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    missionType === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <i className={`${option.icon} text-lg mr-3 ${
                      missionType === option.value ? 'text-blue-600' : 'text-gray-600'
                    }`}></i>
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{option.desc}</p>
                </button>
              ))}
            </div>
            {validationErrors.missionType && (
              <p className="text-sm text-red-600">{validationErrors.missionType}</p>
            )}
          </div>
        )}

        {/* Step 2: Target Location */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Step 2: Target Location</h3>
            <p className="text-sm text-gray-600">Provide the grid reference for the target location.</p>
            
            <MGRSInput
              label="Target Grid (MGRS) *"
              value={targetGrid}
              onChange={setTargetGrid}
              placeholder="e.g., 11SMS1234567890"
              className={`w-full ${validationErrors.targetGrid ? 'border-red-400' : ''}`}
            />
            {validationErrors.targetGrid && (
              <p className="text-sm text-red-600">{validationErrors.targetGrid}</p>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 FO Data Entry (Optional but Recommended)</h4>
              <p className="text-sm text-blue-800 mb-3">If you have azimuth and distance from FO to target, enter below to auto-calculate target grid:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MGRSInput
                  label="FO Position"
                  value={foPosition}
                  onChange={setFOPosition}
                  placeholder="e.g., 11SMS1234567890"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">FO Azimuth (mils)</label>
                  <input
                    type="number"
                    min="0"
                    max="6400"
                    value={foAzimuthToTarget}
                    onChange={(e) => setFOAzimuthToTarget(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 3200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">FO Distance (m)</label>
                  <input
                    type="number"
                    min="1"
                    max="20000"
                    value={foDistanceToTarget}
                    onChange={(e) => setFODistanceToTarget(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 1500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {calculatedTargetGrid && (
                <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-800">Calculated Target Grid:</p>
                      <p className="text-green-700 font-mono text-lg">{calculatedTargetGrid}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTargetGrid(calculatedTargetGrid)}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Use This Grid
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* FPF Target Quick Select */}
            {currentMission.fpfTargets.length > 0 && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">
                  <i className="fas fa-star mr-2"></i>
                  Quick Select: FPF Targets
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
        )}

        {/* Step 3: Target Description */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Step 3: Target Description</h3>
            <p className="text-sm text-gray-600">Describe what you are engaging (enemy troops, vehicles, structures).</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                'Infantry Squad', 'Infantry Platoon', 'Mortar Team', 'Machine Gun Position',
                'Vehicle', 'APC/IFV', 'Tank', 'Truck',
                'Building', 'Bunker', 'Trench Line', 'Command Post'
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTargetDescription(preset)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
            
            <textarea
              value={targetDescription}
              onChange={(e) => setTargetDescription(e.target.value)}
              placeholder="e.g., Infantry platoon in the open, Vehicle convoy, Fortified position..."
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.targetDescription ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {validationErrors.targetDescription && (
              <p className="text-sm text-red-600">{validationErrors.targetDescription}</p>
            )}
          </div>
        )}

        {/* Step 4: Method of Engagement */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Step 4: Method of Engagement (Optional)</h3>
            <p className="text-sm text-gray-600">Specify special ammunition or method if needed.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {[
                'HE', 'Smoke', 'Illumination', 'White Phosphorus', 'Precision', 'Area Saturation'
              ].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setMethodOfEngagement(method)}
                  className={`px-3 py-2 text-sm border rounded-md text-left transition-colors ${
                    methodOfEngagement === method
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
            
            <input
              type="text"
              value={methodOfEngagement}
              onChange={(e) => setMethodOfEngagement(e.target.value)}
              placeholder="Optional: Specify method of engagement (e.g., HE, Smoke, Illumination)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {/* Step 5: Method of Fire Control */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Step 5: Method of Fire & Control</h3>
            <p className="text-sm text-gray-600">How should the firing sequence be controlled?</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { 
                  value: 'fire_when_ready', 
                  label: 'Fire When Ready', 
                  desc: 'Fire as soon as the solution is calculated and guns are laid',
                  icon: 'fas fa-play'
                },
                { 
                  value: 'at_my_command', 
                  label: 'At My Command', 
                  desc: 'Wait for fire command from the observer',
                  icon: 'fas fa-hand-paper'
                }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMethodOfFireControl(option.value as any)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    methodOfFireControl === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <i className={`${option.icon} text-lg mr-3 ${
                      methodOfFireControl === option.value ? 'text-blue-600' : 'text-gray-600'
                    }`}></i>
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{option.desc}</p>
                </button>
              ))}
            </div>
            {validationErrors.methodOfFireControl && (
              <p className="text-sm text-red-600">{validationErrors.methodOfFireControl}</p>
            )}
          </div>
        )}

        {/* Step 6: Direction */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Step 6: Direction</h3>
            <p className="text-sm text-gray-600">Azimuth from observer to target in mils (critical for adjustments).</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observer Direction to Target (mils) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="6400"
                  value={observerDirection}
                  onChange={(e) => setObserverDirection(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g., 3200"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.observerDirection ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {validationErrors.observerDirection && (
                  <p className="text-sm text-red-600">{validationErrors.observerDirection}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  0-6400 mils (0° = North, 1600 = East, 3200 = South, 4800 = West)
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">
                  <i className="fas fa-info-circle mr-2"></i>
                  Why Direction Matters
                </h4>
                <p className="text-sm text-yellow-700">
                  This azimuth is <strong>critical</strong> for fire adjustments. All corrections 
                  (add/drop, left/right) will be made from the observer's perspective using this direction.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Previous
          </button>
          
          <button
            type="button"
            onClick={() => {
              if (validateCurrentStep()) {
                setCurrentStep(Math.min(6, currentStep + 1));
              }
            }}
            disabled={currentStep === 6}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </div>

        {/* Generated Call for Fire */}
        {generatedCallForFire && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">
              <i className="fas fa-radio mr-2"></i>
              Generated Call for Fire
            </h4>
            <div className="bg-black text-green-400 p-3 rounded font-mono text-sm">
              {generatedCallForFire}
            </div>
            <p className="text-xs text-green-700 mt-2">
              This is your properly formatted NATO 6-line call for fire that would be transmitted over radio.
            </p>
          </div>
        )}
      </div>

      {/* Additional Configuration */}
      {currentStep === 6 && generatedCallForFire && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            <i className="fas fa-cog mr-2 text-blue-600"></i>
            Additional Fire Mission Parameters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Round Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Round Type *
              </label>
              <select
                value={roundType}
                onChange={(e) => setRoundType(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white ${
                  validationErrors.roundType ? 'border-red-400' : 'border-gray-300'
                }`}
                style={{backgroundColor: 'white', color: '#111827'}}
              >
                <option value="" style={{backgroundColor: 'white', color: '#111827'}}>Select round type...</option>
                {currentMission.availableRounds.map(roundId => {
                  const round = mortarRounds.find(r => r.id.toString() === roundId);
                  return round ? (
                    <option key={roundId} value={roundId} style={{backgroundColor: 'white', color: '#111827'}}>
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
      )}

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

        {currentStep === 6 && generatedCallForFire && (
          <button
            onClick={handleContinueToSolution}
            disabled={isSaving || !roundType}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-calculator mr-2"></i>
            {isSaving ? 'Processing...' : 'Calculate Fire Solution'}
          </button>
        )}
      </div>
    </div>
  );
}
