import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fireMissionHistoryService } from '../services/fireMissionHistoryService';
import { useApp } from '../contexts/AppContext';

// Define the result interface based on what the calculator provides
interface FireMissionResult {
  // Fire solution data
  targetDistance: number;
  azimuthMils: number;
  elevationMils: number;
  chargeLevel: string;
  timeOfFlightS: number;
  avgDispersionM: number;
  interpolated?: boolean;
  reasoning?: string; // Added for tactical fire methods
  
  // Grid positions
  observerGrid: string;
  mortarGrid: string;
  targetGrid: string;
  
  // Observer data
  observerToTargetDistance: number;
  observerToTargetAzimuth: number;
  observerToTargetBackAzimuth: number;
  isUsingMortarAsObserver: boolean;
  
  // System info (these come from the selected system/round)
  mortarSystemName?: string;
  roundName?: string;
  
  // FO data (new fields)
  foAzimuthMils?: number;
  foDistanceMeters?: number;
  calculatedFromFO?: boolean;
  
  // Adjustments data (optional)
  adjustmentApplied?: {
    range: number;
    direction: number;
  };
  originalTargetGrid?: string;
}

export function ResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fdService } = useApp();
  const [result, setResult] = useState<FireMissionResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [missionNotes, setMissionNotes] = useState('');
  
  // Adjustment states
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [rangeAdjustment, setRangeAdjustment] = useState(0);
  const [directionAdjustment, setDirectionAdjustment] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [originalResult, setOriginalResult] = useState<FireMissionResult | null>(null);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const resultData = JSON.parse(decodeURIComponent(dataParam));
        setResult(resultData);
        setOriginalResult(resultData); // Store original for adjustments
        
        // If the result already has adjustments applied, show them
        if (resultData.adjustmentApplied) {
          setRangeAdjustment(resultData.adjustmentApplied.range || 0);
          setDirectionAdjustment(resultData.adjustmentApplied.direction || 0);
          setShowAdjustments(true);
        }
      } catch (error) {
        console.error('Error parsing result data:', error);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [searchParams, navigate]);

  const saveFireMission = async () => {
    if (!result) return;
    
    setIsSaving(true);
    try {
      await fireMissionHistoryService.saveMission({
        observerGrid: result.observerGrid,
        mortarGrid: result.mortarGrid,
        targetGrid: result.targetGrid,
        system: result.mortarSystemName || 'Unknown System',
        round: result.roundName || 'Unknown Round',
        fireCommand: `Az: ${result.azimuthMils} El: ${result.elevationMils} Ch: ${result.chargeLevel}`,
        fireSolution: {
          azimuthMils: result.azimuthMils,
          elevationMils: result.elevationMils,
          chargeLevel: result.chargeLevel,
          timeOfFlight: result.timeOfFlightS,
          rangeMeters: result.targetDistance
        },
        notes: missionNotes,
        isUsingMortarAsObserver: result.isUsingMortarAsObserver
      });
      
      setSaveMessage('Fire mission saved to history successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving fire mission:', error);
      setSaveMessage('Error saving fire mission');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSaveMessage(`${label} copied to clipboard!`);
      setTimeout(() => setSaveMessage(''), 2000);
    });
  };

  const shareResults = () => {
    if (!result) return;
    
    const shareText = `Fire Mission Results:
Mortar: ${result.mortarGrid}
Target: ${result.targetGrid}
Distance: ${Math.round(result.targetDistance)}m
Azimuth: ${result.azimuthMils} mils
Elevation: ${result.elevationMils} mils
Charge: ${result.chargeLevel}
Time of Flight: ${result.timeOfFlightS}s`;

    if (navigator.share) {
      navigator.share({
        title: 'Fire Mission Results',
        text: shareText
      });
    } else {
      copyToClipboard(shareText, 'Results');
    }
  };

  const applyAdjustments = () => {
    if (!result || !fdService) return;
    
    setIsCalculating(true);
    setSaveMessage('');
    
    try {
      // Determine observer position for adjustments
      const observerPos = result.isUsingMortarAsObserver ? result.mortarGrid : result.observerGrid;
      
      if (!observerPos) {
        setSaveMessage('Error: No observer position available for adjustments');
        setIsCalculating(false);
        return;
      }
      
      // For now, we'll use system/round IDs 1,1 - in a real implementation,
      // we'd need to store and pass the actual IDs from the calculator
      const mortarSystemId = 1; // Would need to get from result or pass through
      const mortarRoundId = 1;   // Would need to get from result or pass through
      
      // Calculate adjusted firing solution using the fire direction service
      const adjustedSolution = fdService.calculateAdjustedFiringSolution(
        observerPos,
        result.mortarGrid,
        result.targetGrid,
        mortarSystemId,
        mortarRoundId,
        rangeAdjustment,
        directionAdjustment
      );
      
      // Update result with adjusted data
      setResult({
        ...result,
        targetDistance: adjustedSolution.targetDistance,
        azimuthMils: adjustedSolution.azimuthMils,
        elevationMils: adjustedSolution.elevationMils,
        chargeLevel: adjustedSolution.chargeLevel,
        timeOfFlightS: adjustedSolution.timeOfFlightS,
        targetGrid: adjustedSolution.targetGrid,
        adjustmentApplied: {
          range: rangeAdjustment,
          direction: directionAdjustment
        },
        originalTargetGrid: originalResult?.targetGrid || result.targetGrid
      });
      
      setShowAdjustments(false);
      setRangeAdjustment(0);
      setDirectionAdjustment(0);
      
      setSaveMessage('Adjustments applied successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error) {
      console.error('Error applying adjustments:', error);
      setSaveMessage('Error applying adjustments: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsCalculating(false);
    }
  };

  if (!result) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Calculator
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <i className="fas fa-bullseye mr-3 text-red-600"></i>
          Fire Mission Results
        </h1>
        <p className="text-gray-600">
          Complete firing solution and observer data
        </p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mission Overview */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              <i className="fas fa-map-marker-alt mr-2 text-blue-600"></i>
              Mission Overview
            </h2>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Mortar Position</label>
                  <p className="text-lg font-mono">{result.mortarGrid}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Target Position</label>
                  <p className="text-lg font-mono">{result.targetGrid}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Mortar System</label>
                  <p className="text-lg">{result.mortarSystemName || 'Unknown System'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Round Type</label>
                  <p className="text-lg">{result.roundName || 'Unknown Round'}</p>
                </div>
              </div>
              
              {result.observerGrid && !result.isUsingMortarAsObserver && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Observer Position</label>
                  <p className="text-lg font-mono">{result.observerGrid}</p>
                </div>
              )}
              
              {result.isUsingMortarAsObserver && (
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-blue-700">
                    <i className="fas fa-eye mr-1"></i>
                    Using mortar position as observer
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Observer Data */}
          {!result.isUsingMortarAsObserver && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                <i className="fas fa-eye mr-2 text-purple-600"></i>
                Observer Data
              </h2>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Distance to Target</label>
                    <p className="text-lg">{Math.round(result.observerToTargetDistance)}m</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Azimuth to Target</label>
                    <p className="text-lg">{result.observerToTargetAzimuth} mils</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500">Back Azimuth</label>
                  <p className="text-lg">{result.observerToTargetBackAzimuth} mils</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Firing Solution */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              <i className="fas fa-crosshairs mr-2 text-green-600"></i>
              Firing Solution
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <i className="fas fa-ruler-combined text-2xl text-green-600 mb-2"></i>
                  <label className="block text-sm font-medium text-gray-500">Distance</label>
                  <p className="text-2xl font-bold text-green-700">{Math.round(result.targetDistance)}m</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <i className="fas fa-compass text-2xl text-blue-600 mb-2"></i>
                  <label className="block text-sm font-medium text-gray-500">Azimuth</label>
                  <p className="text-2xl font-bold text-blue-700">{result.azimuthMils}</p>
                  <p className="text-sm text-gray-500">mils</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <label className="block text-sm font-medium text-gray-500">Elevation</label>
                  <p className="text-2xl font-bold text-orange-700">{result.elevationMils}</p>
                  <p className="text-sm text-gray-500">mils</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <label className="block text-sm font-medium text-gray-500">Charge</label>
                  <p className="text-2xl font-bold text-purple-700">{result.chargeLevel}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <i className="fas fa-clock text-2xl text-gray-600 mb-2"></i>
                  <label className="block text-sm font-medium text-gray-500">Time of Flight</label>
                  <p className="text-xl font-bold text-gray-700">{result.timeOfFlightS}s</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <label className="block text-sm font-medium text-gray-500">Dispersion</label>
                  <p className="text-xl font-bold text-red-700">{result.avgDispersionM}m</p>
                </div>
              </div>
              
              {result.interpolated && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <p className="text-yellow-800 font-medium">
                    ⚠️ Solution is interpolated between available firing table data
                  </p>
                </div>
              )}
              
              {result.reasoning && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    <i className="fas fa-lightbulb mr-2"></i>
                    {result.reasoning}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Observer Adjustments Interface */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                <i className="fas fa-edit mr-2 text-orange-600"></i>
                Fire Direction Adjustments
              </h2>
              <button
                onClick={() => setShowAdjustments(!showAdjustments)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {showAdjustments ? 'Hide' : 'Show'} Adjustments
              </button>
            </div>

            {/* Observer Point of View Info */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                <i className="fas fa-eye mr-2"></i>
                Adjustments Point of View: {result.isUsingMortarAsObserver ? 'Mortar Team' : 'Forward Observer'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {result.isUsingMortarAsObserver 
                  ? `Adjustments relative to mortar team at ${result.mortarGrid}`
                  : `Adjustments relative to FO at ${result.observerGrid}`
                }
              </p>
              {result.calculatedFromFO && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Original target calculated from FO azimuth ({result.foAzimuthMils} mils) and distance ({result.foDistanceMeters}m)
                </p>
              )}
            </div>
            
            {showAdjustments && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Make adjustments and recalculate the firing solution. 
                  Adjustments are relative to the {result.isUsingMortarAsObserver ? 'mortar team\'s' : 'observer\'s'} line of sight to target.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Range Adjustment (meters)
                    </label>
                    <input
                      type="number"
                      value={rangeAdjustment || ''}
                      onChange={(e) => setRangeAdjustment(Number(e.target.value) || 0)}
                      placeholder="e.g., 100 (add), -50 (drop)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Standard: "Add 100" or "Drop 50"</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Direction Adjustment (mils)
                    </label>
                    <input
                      type="number"
                      value={directionAdjustment || ''}
                      onChange={(e) => setDirectionAdjustment(Number(e.target.value) || 0)}
                      placeholder="e.g., 50 (right), -30 (left)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Standard: "Right 50" or "Left 30"</p>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={applyAdjustments}
                    disabled={isCalculating || (rangeAdjustment === 0 && directionAdjustment === 0)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold"
                  >
                    {isCalculating ? 'Calculating...' : 'Apply Adjustments & Recalculate'}
                  </button>
                    
                  <button
                    onClick={() => {
                      setRangeAdjustment(0);
                      setDirectionAdjustment(0);
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium"
                  >
                    Clear
                  </button>
                </div>
                
                {(rangeAdjustment !== 0 || directionAdjustment !== 0) && (
                  <div className="mt-3 p-3 bg-orange-100 rounded-lg">
                    <p className="text-sm text-orange-800">
                      <strong>Pending Adjustments:</strong>
                      {rangeAdjustment !== 0 && ` Range: ${rangeAdjustment > 0 ? 'ADD' : 'DROP'} ${Math.abs(rangeAdjustment)}m`}
                      {directionAdjustment !== 0 && ` Direction: ${directionAdjustment > 0 ? 'RIGHT' : 'LEFT'} ${Math.abs(directionAdjustment)} mils`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Adjustments Applied Display */}
          {result.adjustmentApplied && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">
                🎯 Observer Adjustments Applied
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-orange-600 font-medium">Range Adjustment</label>
                  <p className="text-orange-800">
                    {result.adjustmentApplied.range > 0 ? 'ADD' : 'DROP'} {Math.abs(result.adjustmentApplied.range)} meters
                  </p>
                </div>
                <div>
                  <label className="block text-orange-600 font-medium">Direction Adjustment</label>
                  <p className="text-orange-800">
                    {result.adjustmentApplied.direction > 0 ? 'RIGHT' : 'LEFT'} {Math.abs(result.adjustmentApplied.direction)} mils
                  </p>
                </div>
              </div>
              {result.originalTargetGrid && (
                <div className="mt-2 pt-2 border-t border-orange-200">
                  <p className="text-xs text-orange-700">
                    <strong>Original Target:</strong> {result.originalTargetGrid}
                  </p>
                  <p className="text-xs text-orange-700">
                    <strong>Adjusted Target:</strong> {result.targetGrid}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => copyToClipboard(
                  `Az: ${result.azimuthMils} El: ${result.elevationMils} Ch: ${result.chargeLevel}`,
                  'Firing data'
                )}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm"
              >
                <i className="fas fa-copy mr-1"></i>
                Copy Firing Data
              </button>
              
              <button
                onClick={shareResults}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm"
              >
                <i className="fas fa-share mr-1"></i>
                Share Results
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mission Notes (Optional)
                </label>
                <textarea
                  value={missionNotes}
                  onChange={(e) => setMissionNotes(e.target.value)}
                  placeholder="Add notes about this fire mission..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              
              <button
                onClick={saveFireMission}
                disabled={isSaving}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold"
              >
                <i className="fas fa-save mr-2"></i>
                {isSaving ? 'Saving...' : 'Save to History'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Adjustments Section */}
      {result && (
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                <i className="fas fa-edit mr-2 text-yellow-600"></i>
                Adjust Observer Settings
              </h3>
              
              <button
                onClick={() => setShowAdjustments(!showAdjustments)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {showAdjustments ? 'Cancel' : 'Adjust Settings'}
              </button>
            </div>
            
            {showAdjustments && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Range Adjustment (m)</label>
                    <input
                      type="number"
                      value={rangeAdjustment}
                      onChange={(e) => setRangeAdjustment(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Direction Adjustment (mils)</label>
                    <input
                      type="number"
                      value={directionAdjustment}
                      onChange={(e) => setDirectionAdjustment(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowAdjustments(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-semibold"
                  >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Back
                  </button>
                  
                  <button
                    onClick={applyAdjustments}
                    disabled={isCalculating}
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-semibold"
                  >
                    <i className="fas fa-save mr-2"></i>
                    {isCalculating ? 'Applying...' : 'Apply Adjustments'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold"
        >
          <i className="fas fa-edit mr-2"></i>
          Make Adjustments
        </button>
        
        <button
          onClick={() => navigate('/history')}
          className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold"
        >
          View Mission History
        </button>
      </div>
    </div>
  );
}
