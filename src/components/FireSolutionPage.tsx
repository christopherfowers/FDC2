import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import type { FireMissionMethod } from '../services/fireDirectionService';
import type { FireSolution, FireMissionCorrection } from '../types/mission';

interface LocationState {
  foPosition: string;
  targetGrid: string;
  fireControl: 'fire_when_ready' | 'on_command';
  roundType: string;
  numberOfRounds: number;
  specialInstructions: string;
  optimization: 'speed' | 'accuracy' | 'dispersion' | 'high_angle' | 'efficiency';
  selectedFPFTarget?: string | null;
}

export function FireSolutionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentMission,
    updateMission,
    mortarRounds,
    fdService,
    isLoading 
  } = useApp();

  const state = location.state as LocationState;

  // Fire solution state
  const [fireSolution, setFireSolution] = useState<FireSolution | null>(null);
  const [commandScript, setCommandScript] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Corrections state
  const [rangeCorrection, setRangeCorrection] = useState<number>(0);
  const [directionCorrection, setDirectionCorrection] = useState<number>(0);
  const [correctionNotes, setCorrectionNotes] = useState<string>('');
  const [appliedCorrections, setAppliedCorrections] = useState<FireMissionCorrection[]>([]);

  // Mission state
  const [isSaving, setIsSaving] = useState(false);
  const [missionComplete, setMissionComplete] = useState(false);

  // Redirect if no state or mission
  useEffect(() => {
    if (!state || !currentMission) {
      navigate('/mission/prep');
    }
  }, [state, currentMission, navigate]);

  const calculateFireSolution = useCallback(async () => {
    if (!state || !currentMission) return;

    setIsCalculating(true);
    setCalculationError(null);

    try {
      // Get the selected round data
      const selectedRound = mortarRounds.find(r => r.id.toString() === state.roundType);
      if (!selectedRound) {
        throw new Error('Selected round type not found');
      }

      // Map optimization to FireMissionMethod
      const methodMap: Record<string, FireMissionMethod> = {
        'speed': 'speed',
        'accuracy': 'standard',
        'dispersion': 'area_target',
        'high_angle': 'high_angle',
        'efficiency': 'efficiency'
      };

      // Calculate complete firing solution using initialized service from context
      const result = fdService.calculateCompleteFiringSolution(
        state.foPosition,
        state.targetGrid,
        parseInt(currentMission.selectedSystem),
        selectedRound.id,
        { method: methodMap[state.optimization] }
      );

      const solution: FireSolution = {
        azimuthMils: result.azimuthMils,
        elevationMils: result.elevationMils,
        chargeLevel: result.chargeLevel,
        timeOfFlight: result.timeOfFlightS,
        rangeMeters: result.targetDistance
      };

      setFireSolution(solution);
      
      // Generate command script
      const roundAbbrev = selectedRound.name.split(' ')[0];
      const charge = solution.chargeLevel;
      const elevation = Math.round(solution.elevationMils);
      const azimuth = Math.round(solution.azimuthMils);
      const range = Math.round(solution.rangeMeters);
      const tof = Math.round(solution.timeOfFlight);

      const script = [
        `FIRE MISSION`,
        `TARGET: ${state.targetGrid}`,
        `ROUND: ${roundAbbrev}`,
        `CHARGE: ${charge}`,
        `ELEVATION: ${elevation} MILS`,
        `AZIMUTH: ${azimuth} MILS`,
        `RANGE: ${range}M`,
        `TOF: ${tof}S`,
        `ROUNDS: ${state.numberOfRounds}`,
        state.fireControl === 'fire_when_ready' ? 'FIRE WHEN READY' : 'AT MY COMMAND',
        state.specialInstructions ? `SPECIAL: ${state.specialInstructions}` : ''
      ].filter(line => line.trim() !== '').join('\n');

      setCommandScript(script);

    } catch (error) {
      setCalculationError(error instanceof Error ? error.message : 'Failed to calculate fire solution');
    } finally {
      setIsCalculating(false);
    }
  }, [state, currentMission, mortarRounds]);

  const generateCommandScript = useCallback((solution: FireSolution, roundName: string) => {
    const roundAbbrev = roundName.split(' ')[0]; // e.g., "M821" from "M821 HE"
    const charge = solution.chargeLevel;
    const elevation = Math.round(solution.elevationMils);
    const azimuth = Math.round(solution.azimuthMils);
    const range = Math.round(solution.rangeMeters);
    const tof = Math.round(solution.timeOfFlight);

    const script = [
      `FIRE MISSION`,
      `TARGET: ${state.targetGrid}`,
      `ROUND: ${roundAbbrev}`,
      `CHARGE: ${charge}`,
      `ELEVATION: ${elevation} MILS`,
      `AZIMUTH: ${azimuth} MILS`,
      `RANGE: ${range}M`,
      `TOF: ${tof}S`,
      `ROUNDS: ${state.numberOfRounds}`,
      state.fireControl === 'fire_when_ready' ? 'FIRE WHEN READY' : 'AT MY COMMAND',
      state.specialInstructions ? `SPECIAL: ${state.specialInstructions}` : ''
    ].filter(line => line.trim() !== '').join('\n');

    setCommandScript(script);
  }, [state]);

  // Calculate fire solution on mount
  useEffect(() => {
    if (state && currentMission) {
      calculateFireSolution();
    }
  }, [state, currentMission, calculateFireSolution]);

  const applyCorrection = () => {
    if (!fireSolution) return;

    const correctedSolution: FireSolution = {
      ...fireSolution,
      rangeMeters: fireSolution.rangeMeters + rangeCorrection,
      elevationMils: fireSolution.elevationMils + (rangeCorrection * 0.1), // Simplified correction
      azimuthMils: fireSolution.azimuthMils + directionCorrection
    };

    const correction = {
      id: Date.now().toString(),
      timestamp: new Date(),
      rangeCorrection,
      directionCorrection,
      adjustedSolution: correctedSolution,
      notes: correctionNotes
    };

    setAppliedCorrections(prev => [...prev, correction]);
    setFireSolution(correctedSolution);
    generateCommandScript(correctedSolution, mortarRounds.find(r => r.id.toString() === state.roundType)?.name || '');

    // Reset correction inputs
    setRangeCorrection(0);
    setDirectionCorrection(0);
    setCorrectionNotes('');
  };

  const saveMissionComplete = async () => {
    if (!state || !currentMission || !fireSolution) return;

    setIsSaving(true);

    try {
      // Create fire mission record
      const fireMissionRecord = {
        missionId: currentMission.id,
        targetGrid: state.targetGrid,
        foPosition: state.foPosition,
        fireControl: state.fireControl,
        roundType: state.roundType,
        numberOfRounds: state.numberOfRounds,
        specialInstructions: state.specialInstructions,
        optimization: state.optimization,
        fireSolution: fireSolution,
        generatedCommand: commandScript,
        corrections: appliedCorrections,
        status: 'complete' as const,
        notes: ''
      };

      // Add fire mission to current mission
      const updatedMission = {
        ...currentMission,
        fireMissions: [...currentMission.fireMissions, {
          id: Date.now().toString(),
          timestamp: new Date(),
          ...fireMissionRecord
        }],
        status: 'complete' as const,
        currentPhase: 'solution' as const,
        lastModified: new Date()
      };

      await updateMission(currentMission.id, updatedMission);
      setMissionComplete(true);

    } catch (err) {
      setCalculationError(err instanceof Error ? err.message : 'Failed to save mission');
    } finally {
      setIsSaving(false);
    }
  };

  const copyCommandScript = async () => {
    try {
      await navigator.clipboard.writeText(commandScript);
      // Could add a toast notification here
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = commandScript;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  if (isLoading || !state || !currentMission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
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
              <i className="fas fa-crosshairs mr-3 text-green-600"></i>
              Fire Solution
            </h1>
            <p className="text-gray-600 mt-2">
              Final fire solution for{' '}
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
            <div className="flex items-center space-x-1 text-green-600">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">
                <i className="fas fa-check text-xs"></i>
              </div>
              <span>Calculate</span>
            </div>
            <div className="w-8 h-0.5 bg-green-600"></div>
            <div className="flex items-center space-x-1 text-green-600 font-medium">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">3</div>
              <span>Solution</span>
            </div>
          </div>
        </div>

        {calculationError && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {calculationError}
          </div>
        )}

        {missionComplete && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <i className="fas fa-check-circle mr-2"></i>
            Mission completed and saved to history!
          </div>
        )}
      </div>

      {isCalculating ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Calculating fire solution...</p>
        </div>
      ) : fireSolution ? (
        <>
          {/* Fire Solution Display */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              <i className="fas fa-bullseye mr-2 text-green-600"></i>
              Fire Solution
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{Math.round(fireSolution.azimuthMils)}</div>
                <div className="text-sm text-gray-600">Azimuth (mils)</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{Math.round(fireSolution.elevationMils)}</div>
                <div className="text-sm text-gray-600">Elevation (mils)</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{fireSolution.chargeLevel}</div>
                <div className="text-sm text-gray-600">Charge</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{Math.round(fireSolution.rangeMeters)}</div>
                <div className="text-sm text-gray-600">Range (m)</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{Math.round(fireSolution.timeOfFlight)}</div>
                <div className="text-sm text-gray-600">TOF (s)</div>
              </div>
            </div>
          </div>

          {/* Command Script */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                <i className="fas fa-terminal mr-2 text-blue-600"></i>
                Fire Command Script
              </h2>
              <button
                onClick={copyCommandScript}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                <i className="fas fa-copy mr-2"></i>
                Copy
              </button>
            </div>

            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-line">
              {commandScript}
            </div>
          </div>

          {/* FO Corrections */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              <i className="fas fa-adjust mr-2 text-orange-600"></i>
              Forward Observer Corrections
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Range Correction (m)
                </label>
                <input
                  type="number"
                  value={rangeCorrection}
                  onChange={(e) => setRangeCorrection(Number(e.target.value))}
                  placeholder="+ Add / - Drop"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Positive = Add, Negative = Drop</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direction Correction (mils)
                </label>
                <input
                  type="number"
                  value={directionCorrection}
                  onChange={(e) => setDirectionCorrection(Number(e.target.value))}
                  placeholder="+ Right / - Left"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Positive = Right, Negative = Left</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <input
                  type="text"
                  value={correctionNotes}
                  onChange={(e) => setCorrectionNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                />
              </div>
            </div>

            <button
              onClick={applyCorrection}
              disabled={rangeCorrection === 0 && directionCorrection === 0}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-plus mr-2"></i>
              Apply Correction
            </button>

            {/* Applied Corrections History */}
            {appliedCorrections.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Correction History</h3>
                <div className="space-y-2">
                  {appliedCorrections.map((correction, index) => (
                    <div key={correction.id} className="p-3 bg-gray-50 rounded-md text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Correction {index + 1}</span>
                        <span className="text-gray-500">{new Date(correction.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="mt-1 text-gray-600">
                        Range: {correction.rangeCorrection > 0 ? '+' : ''}{correction.rangeCorrection}m, 
                        Direction: {correction.directionCorrection > 0 ? '+' : ''}{correction.directionCorrection} mils
                        {correction.notes && ` - ${correction.notes}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <button
              onClick={() => navigate('/mission/calculate')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              disabled={isSaving}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Calculate
            </button>

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/mission/prep')}
                className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
                disabled={isSaving}
              >
                <i className="fas fa-plus mr-2"></i>
                New Fire Mission
              </button>

              <button
                onClick={saveMissionComplete}
                disabled={isSaving || missionComplete}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-check mr-2"></i>
                {isSaving ? 'Saving...' : missionComplete ? 'Mission Complete' : 'Complete Mission'}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
