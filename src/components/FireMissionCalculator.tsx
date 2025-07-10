import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { MGRSService } from '../services/mgrsService';
import { MGRSInput, validateMGRSInput } from './MGRSInput';
import { fireMissionHistoryService } from '../services/fireMissionHistoryService';
import type { FireMissionRecord } from '../services/fireMissionHistoryService';

interface FireSolution {
  fireCommand?: string;
  azimuthMils?: number;
  elevationMils?: number;
  chargeLevel?: number;
  timeOfFlight?: number;
  rangeMeters?: number;
  quadrant?: string;
  adjustedTargetGrid?: string;
  [key: string]: unknown; // Allow additional properties
}

interface FireMissionCalculatorProps {
  initialMission?: FireMissionRecord;
}

export function FireMissionCalculator({ initialMission }: FireMissionCalculatorProps) {
  const { fdService, mortarSystems, isOffline, calculatorState, setCalculatorState } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [result, setResult] = useState<FireSolution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Destructure calculator state for easier access
  const {
    mortarGrid,
    observerGrid,
    foAzimuthMils,
    foDistanceMeters,
    targetGrid,
    selectedSystem,
    selectedRound,
    rangeAdjustmentM,
    directionAdjustmentMils,
    notes
  } = calculatorState;

  // Calculate target grid from FO data if available
  const calculatedTargetGrid = (observerGrid.trim() && foAzimuthMils > 0 && foDistanceMeters > 0) 
    ? (() => {
        try {
          return MGRSService.calculateTargetFromPolar(observerGrid, foAzimuthMils, foDistanceMeters);
        } catch {
          return '';
        }
      })()
    : '';

  // Use calculated target grid if available, otherwise use manual input
  const effectiveTargetGrid = calculatedTargetGrid || targetGrid;

  // Load initial mission if provided (from history edit)
  useEffect(() => {
    if (initialMission) {
      setCalculatorState({
        mortarGrid: initialMission.mortarGrid,
        observerGrid: initialMission.observerGrid,
        foAzimuthMils: 0, // These are new fields, won't be in old missions
        foDistanceMeters: 0,
        targetGrid: initialMission.targetGrid,
        selectedSystem: initialMission.system,
        selectedRound: initialMission.round,
        rangeAdjustmentM: initialMission.adjustments?.rangeAdjustmentM || 0,
        directionAdjustmentMils: initialMission.adjustments?.directionAdjustmentMils || 0,
        notes: initialMission.notes || ''
      });
    }
  }, [initialMission, setCalculatorState]);

  // Handle adjustments from results page
  useEffect(() => {
    const adjustmentsParam = searchParams.get('adjustments');
    if (adjustmentsParam) {
      try {
        const adjustmentData = JSON.parse(decodeURIComponent(adjustmentsParam));
        
        // Update calculator state with the data and adjustments
        setCalculatorState({
          mortarGrid: adjustmentData.mortarGrid || '',
          observerGrid: adjustmentData.observerGrid || '',
          foAzimuthMils: adjustmentData.foAzimuthMils || 0,
          foDistanceMeters: adjustmentData.foDistanceMeters || 0,
          targetGrid: adjustmentData.targetGrid || '',
          selectedSystem: '', // Will need to be set manually
          selectedRound: '', // Will need to be set manually
          rangeAdjustmentM: adjustmentData.rangeAdjustmentM || 0,
          directionAdjustmentMils: adjustmentData.directionAdjustmentMils || 0,
          notes: adjustmentData.notes || ''
        });
        
        // Clear the URL parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } catch (error) {
        console.error('Error parsing adjustments data:', error);
      }
    }
  }, [searchParams, setCalculatorState]);

  const validateInputs = () => {
    const errors: Record<string, string> = {};
    
    // Mortar grid is required
    const mortarValidation = validateMGRSInput(mortarGrid);
    if (!mortarValidation.isValid) {
      errors.mortarGrid = mortarValidation.error || 'Invalid mortar position grid';
    }
    
    // Observer grid validation (optional)
    if (observerGrid.trim()) {
      const observerValidation = validateMGRSInput(observerGrid);
      if (!observerValidation.isValid) {
        errors.observerGrid = observerValidation.error || 'Invalid observer grid';
      }
    }
    
    // Target grid validation - either manual input OR calculated from FO data
    const hasManualTarget = targetGrid.trim();
    const hasCalculatedTarget = calculatedTargetGrid.trim();
    const hasFOData = observerGrid.trim() && foAzimuthMils > 0 && foDistanceMeters > 0;
    
    if (!hasManualTarget && !hasCalculatedTarget) {
      if (hasFOData) {
        errors.targetGrid = 'Unable to calculate target from FO data - check inputs';
      } else {
        errors.targetGrid = 'Either enter target grid manually OR provide FO position, azimuth, and distance';
      }
    } else if (hasManualTarget) {
      const targetValidation = validateMGRSInput(targetGrid);
      if (!targetValidation.isValid) {
        errors.targetGrid = targetValidation.error || 'Invalid target grid';
      }
    }
    
    // FO data validation - if any FO field is filled, require all
    if (observerGrid.trim() || foAzimuthMils > 0 || foDistanceMeters > 0) {
      if (!observerGrid.trim()) {
        errors.observerGrid = 'FO position required when using FO data';
      }
      if (foAzimuthMils <= 0) {
        errors.foAzimuth = 'FO azimuth required when using FO data';
      }
      if (foDistanceMeters <= 0) {
        errors.foDistance = 'FO distance required when using FO data';
      }
    }
    
    if (!selectedSystem) {
      errors.system = 'Please select a mortar system';
    }
    
    if (!selectedRound) {
      errors.round = 'Please select a round type';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateFireMission = () => {
    if (!validateInputs()) return;
    
    try {
      setError(null);
      
      // Use the effective target grid (calculated or manual)
      const finalTargetGrid = effectiveTargetGrid;
      
      // Use mortar position as observer if no observer position is specified
      const effectiveObserverGrid = observerGrid.trim() || mortarGrid;
      
      // Calculate observer to target (for target reference)
      const observerToTarget = MGRSService.calculateFireMission(effectiveObserverGrid, finalTargetGrid);
      
      let solution;
      
      // Check if observer adjustments are being applied
      const rangeAdj = rangeAdjustmentM || 0;
      const dirAdj = directionAdjustmentMils || 0;
      
      if (rangeAdj !== 0 || dirAdj !== 0) {
        // Calculate with observer adjustments
        solution = fdService.calculateAdjustedFiringSolution(
          effectiveObserverGrid,
          mortarGrid,
          finalTargetGrid,
          Number(selectedSystem)!,
          Number(selectedRound)!,
          rangeAdj,
          dirAdj
        );
      } else {
        // Calculate mortar to target (standard firing solution)
        solution = fdService.calculateCompleteFiringSolution(
          mortarGrid,
          finalTargetGrid,
          Number(selectedSystem)!,
          Number(selectedRound)!
        );
      }
      
      // Add system/round names to result
      const selectedSystemData = mortarSystems.find(s => s.id === Number(selectedSystem));
      const selectedRoundData = compatibleRounds.find(r => r.id === Number(selectedRound));
      
      const enrichedResult = {
        ...solution,
        observerGrid: effectiveObserverGrid,
        mortarGrid,
        targetGrid: finalTargetGrid,
        observerToTargetDistance: observerToTarget.distanceMeters,
        observerToTargetAzimuth: observerToTarget.azimuthMils,
        observerToTargetBackAzimuth: observerToTarget.backAzimuthMils,
        isUsingMortarAsObserver: !observerGrid.trim(),
        mortarSystemName: selectedSystemData?.name || 'Unknown System',
        roundName: selectedRoundData?.name || 'Unknown Round',
        // Include FO data for results page
        foAzimuthMils,
        foDistanceMeters,
        calculatedFromFO: !!calculatedTargetGrid
      };
      
      // Auto-navigate to results page
      navigate(`/results?data=${encodeURIComponent(JSON.stringify(enrichedResult))}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
      setResult(null);
    }
  };

  const saveFireMission = () => {
    if (!result) return;
    
    setIsSaving(true);
    try {
      const selectedSystemData = mortarSystems.find(s => s.id === Number(selectedSystem));
      const selectedRoundData = compatibleRounds.find(r => r.id === Number(selectedRound));
      
      const effectiveObserverGrid = observerGrid.trim() || mortarGrid;
      const finalTargetGrid = effectiveTargetGrid;
      
      const missionData = {
        observerGrid: effectiveObserverGrid,
        mortarGrid,
        targetGrid: finalTargetGrid,
        system: selectedSystemData?.name || 'Unknown System',
        round: selectedRoundData?.name || 'Unknown Round',
        fireCommand: result.fireCommand || '',
        fireSolution: {
          azimuthMils: result.azimuthMils || 0,
          elevationMils: result.elevationMils || 0,
          chargeLevel: String(result.chargeLevel || 0),
          timeOfFlight: result.timeOfFlight || 0,
          rangeMeters: result.rangeMeters || 0,
          quadrant: Number(result.quadrant || 0)
        },
        adjustments: (rangeAdjustmentM !== 0 || directionAdjustmentMils !== 0) ? {
          rangeAdjustmentM,
          directionAdjustmentMils,
          adjustedTargetGrid: result.adjustedTargetGrid || finalTargetGrid
        } : undefined,
        notes: notes.trim() || undefined,
        isUsingMortarAsObserver: !observerGrid.trim()
      };
      
      const savedId = fireMissionHistoryService.saveMission(missionData);
      console.log('Fire mission saved with ID:', savedId);
      
      // Show success feedback
      alert('Fire mission saved to history!');
    } catch (error) {
      console.error('Failed to save fire mission:', error);
      alert('Failed to save fire mission');
    } finally {
      setIsSaving(false);
    }
  };
  const compatibleRounds = selectedSystem
    ? fdService.getCompatibleRounds(Number(selectedSystem))
    : [];
  
  const rangeCapabilities = selectedSystem && selectedRound
    ? fdService.getRangeCapabilities(Number(selectedSystem), Number(selectedRound))
    : null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        
        {isOffline && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-wifi text-yellow-600"></i>
              <p className="font-semibold">Offline Mode</p>
            </div>
            <p>Using cached data. Some features may be limited.</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Step 1: Mortar Position (Required) */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              <i className="fas fa-crosshairs mr-2"></i>
              Step 1: Mortar Position (Required)
            </h3>
            <MGRSInput
              value={mortarGrid}
              onChange={(value) => setCalculatorState({ mortarGrid: value })}
              label="Mortar Position (MGRS)"
              icon={<i className="fas fa-crosshairs text-green-600"></i>}
              placeholder="e.g., 1000010000"
            />
            {validationErrors.mortarGrid && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.mortarGrid}</p>
            )}
          </div>

          {/* Step 2: Forward Observer Data (Optional) */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-orange-800 mb-3">
              <i className="fas fa-map-marker-alt mr-2"></i>
              Step 2: Forward Observer Data (Optional)
            </h3>
            <p className="text-sm text-orange-700 mb-4">
              If you have FO position and target data, the target grid will be calculated automatically.
            </p>
            
            <div className="space-y-4">
              <div>
                <MGRSInput
                  value={observerGrid}
                  onChange={(value) => setCalculatorState({ observerGrid: value })}
                  label="FO Position (MGRS)"
                  icon={<i className="fas fa-map-marker-alt text-blue-600"></i>}
                  placeholder="e.g., 1250010000"
                />
                {validationErrors.observerGrid && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.observerGrid}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="foAzimuth" className="block text-sm font-medium text-gray-700 mb-1">
                    FO Azimuth to Target (mils)
                  </label>
                  <input
                    type="number"
                    id="foAzimuth"
                    value={foAzimuthMils || ''}
                    onChange={(e) => setCalculatorState({ foAzimuthMils: Number(e.target.value) || 0 })}
                    placeholder="e.g., 3200"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.foAzimuth ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.foAzimuth && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.foAzimuth}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">0-6400 mils</p>
                </div>
                
                <div>
                  <label htmlFor="foDistance" className="block text-sm font-medium text-gray-700 mb-1">
                    FO Distance to Target (meters)
                  </label>
                  <input
                    type="number"
                    id="foDistance"
                    value={foDistanceMeters || ''}
                    onChange={(e) => setCalculatorState({ foDistanceMeters: Number(e.target.value) || 0 })}
                    placeholder="e.g., 2500"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.foDistance ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.foDistance && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.foDistance}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Distance in meters</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Target Grid */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-3">
              <i className="fas fa-bullseye mr-2"></i>
              Step 3: Target Location
            </h3>
            
            {calculatedTargetGrid ? (
              <div className="space-y-3">
                <div className="bg-green-100 border border-green-300 rounded p-3">
                  <p className="text-green-800 font-medium">
                    <i className="fas fa-info-circle mr-2"></i>
                    Target grid calculated from FO data
                  </p>
                  <p className="text-green-700 text-lg font-mono mt-1">{calculatedTargetGrid}</p>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>You can still enter a manual target grid below if needed:</p>
                  <div className="mt-2">
                    <MGRSInput
                      value={targetGrid}
                      onChange={(value) => setCalculatorState({ targetGrid: value })}
                      label="Manual Target Grid (Optional Override)"
                      icon={<i className="fas fa-bullseye text-red-600"></i>}
                      placeholder="e.g., 1200011000"
                    />
                    {validationErrors.targetGrid && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.targetGrid}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-red-700 mb-3">
                  {observerGrid.trim() || foAzimuthMils > 0 || foDistanceMeters > 0
                    ? "Complete FO data above to auto-calculate, or enter target grid manually:"
                    : "Enter target grid manually, or use FO data above to calculate automatically:"
                  }
                </p>
                <MGRSInput
                  value={targetGrid}
                  onChange={(value) => setCalculatorState({ targetGrid: value })}
                  label="Target Grid (MGRS)"
                  icon={<i className="fas fa-bullseye text-red-600"></i>}
                  placeholder="e.g., 1200011000"
                />
                {validationErrors.targetGrid && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.targetGrid}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Mortar System */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mortar System
            </label>
            <select
              value={selectedSystem || ''}
              onChange={(e) => {
                setCalculatorState({ 
                  selectedSystem: e.target.value,
                  selectedRound: '' // Reset round selection
                });
              }}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.system ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a mortar system</option>
              {mortarSystems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name} ({system.caliberMm}mm)
                </option>
              ))}
            </select>
            {validationErrors.system && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.system}</p>
            )}
          </div>

          {/* Round Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Round Type
            </label>
            <select
              value={selectedRound || ''}
              onChange={(e) => setCalculatorState({ selectedRound: e.target.value })}
              disabled={!selectedSystem}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                validationErrors.round ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a round type</option>
              {compatibleRounds.map((round) => (
                <option key={round.id} value={round.id}>
                  {round.name} ({round.roundType})
                </option>
              ))}
            </select>
            {validationErrors.round && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.round}</p>
            )}
          </div>
        </div>

        {/* Range Capabilities */}
        {rangeCapabilities && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-700">
              <i className="fas fa-info-circle mr-2"></i>
              <strong>Range Capabilities:</strong> {rangeCapabilities.min}m - {rangeCapabilities.max}m
            </p>
          </div>
        )}



        {/* Notes Field */}
        <div className="mt-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Mission Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setCalculatorState({ notes: e.target.value })}
            placeholder="Add any additional notes for this fire mission..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={calculateFireMission}
            disabled={!mortarGrid || !effectiveTargetGrid || !selectedSystem || !selectedRound}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
          >
            <i className="fas fa-calculator mr-2"></i>
            Calculate Fire Mission
          </button>
          
          {result && (
            <div className="flex space-x-3">
              <button
                onClick={saveFireMission}
                disabled={isSaving}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                <i className="fas fa-save mr-2"></i>
                {isSaving ? 'Saving...' : 'Save to History'}
              </button>
              
              <Link
                to="/history"
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium text-center"
              >
                <i className="fas fa-history mr-2"></i>
                View History
              </Link>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="flex items-center space-x-2">
              <i className="fas fa-exclamation-triangle"></i>
              <p className="font-semibold">Error:</p>
            </div>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
