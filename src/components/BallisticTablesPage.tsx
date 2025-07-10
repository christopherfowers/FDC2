import { useState, useEffect } from 'react';
import { FDCLogo } from './FDCLogo';

interface MortarSystem {
  id: number;
  name: string;
  caliberMm: number;
  nationality: string;
}

interface MortarRound {
  id: number;
  name: string;
  roundType: string;
  caliberMm: number;
  nationality: string;
}

interface BallisticData {
  rangeM: number;
  elevationMils: number;
  timeOfFlightS: number;
  avgDispersionM: number;
}

interface BallisticTable {
  mortarSystem: string;
  mortarRound: string;
  roundType: string;
  ballisticData: BallisticData[];
}

export function BallisticTablesPage() {
  const [mortarSystems, setMortarSystems] = useState<MortarSystem[]>([]);
  const [mortarRounds, setMortarRounds] = useState<MortarRound[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [ballisticTable, setBallisticTable] = useState<BallisticTable | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadMortarSystems();
    loadMortarRounds();
  }, []);

  const loadMortarSystems = async () => {
    try {
      const response = await fetch('/api/mortar-systems');
      if (response.ok) {
        const systems = await response.json();
        setMortarSystems(systems);
        if (systems.length > 0) {
          setSelectedSystemId(systems[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error loading mortar systems:', error);
    }
  };

  const loadMortarRounds = async () => {
    try {
      const response = await fetch('/api/mortar-rounds');
      if (response.ok) {
        const rounds = await response.json();
        setMortarRounds(rounds);
        if (rounds.length > 0) {
          setSelectedRoundId(rounds[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error loading mortar rounds:', error);
    }
  };

  const loadBallisticTable = async () => {
    if (!selectedSystemId || !selectedRoundId) {
      setError('Please select both a mortar system and round type');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/ballistic-table/${selectedSystemId}/${selectedRoundId}`);
      if (response.ok) {
        const table = await response.json();
        setBallisticTable(table);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load ballistic table');
        setBallisticTable(null);
      }
    } catch (error) {
      setError('Error loading ballistic table');
      setBallisticTable(null);
      console.error('Error loading ballistic table:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSystemChange = (systemId: string) => {
    setSelectedSystemId(systemId);
    setBallisticTable(null);
  };

  const handleRoundChange = (roundId: string) => {
    setSelectedRoundId(roundId);
    setBallisticTable(null);
  };

  const formatCharge = (data: BallisticData[], index: number) => {
    // Try to group by charge levels based on range patterns
    // This is a simplified approach - in a real system you'd have charge data
    if (index === 0) return '0';
    
    const currentRange = data[index].rangeM;
    const prevRange = data[index - 1].rangeM;
    
    // If there's a significant jump in range, it might be a new charge
    if (currentRange - prevRange > 500) {
      const chargeEstimate = Math.floor(index / 10); // Rough estimate
      return chargeEstimate.toString();
    }
    
    return '0'; // Default charge
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <FDCLogo className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Ballistic Data Tables</h1>
                <p className="text-sm text-gray-600">Lookup firing data by mortar system and round type</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Selection Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Platform and Round</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="system" className="block text-sm font-medium text-gray-700 mb-2">
                Mortar System
              </label>
              <select
                id="system"
                value={selectedSystemId}
                onChange={(e) => handleSystemChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select System...</option>
                {mortarSystems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name} ({system.caliberMm}mm)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="round" className="block text-sm font-medium text-gray-700 mb-2">
                Round Type
              </label>
              <select
                id="round"
                value={selectedRoundId}
                onChange={(e) => handleRoundChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Round...</option>
                {mortarRounds.map((round) => (
                  <option key={round.id} value={round.id}>
                    {round.name} ({round.roundType})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadBallisticTable}
                disabled={!selectedSystemId || !selectedRoundId || loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Loading...
                  </span>
                ) : (
                  'Load Ballistic Table'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Ballistic Table Display */}
        {ballisticTable && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                {ballisticTable.mortarSystem} - {ballisticTable.mortarRound}
              </h3>
              <p className="text-sm text-gray-600">
                Round Type: {ballisticTable.roundType} • {ballisticTable.ballisticData.length} data points
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Range (m)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Elevation (mils)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time of Flight (s)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dispersion (m)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Est. Charge
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ballisticTable.ballisticData.map((data, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {data.rangeM.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.elevationMils}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.timeOfFlightS}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.avgDispersionM}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCharge(ballisticTable.ballisticData, index)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Note:</strong> All ballistic data is for Arma Reforger gameplay only.</p>
                <p><strong>Charges:</strong> Charge estimates are calculated based on range patterns and may not reflect actual charge levels.</p>
                <p><strong>Gaming:</strong> This tool is designed specifically for Arma Reforger mortar calculations and gameplay enhancement.</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!ballisticTable && !loading && !error && (
          <div className="text-center py-12">
            <i className="fas fa-table text-6xl text-gray-300 mb-6"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select Platform and Round</h3>
            <p className="text-gray-600">
              Choose a mortar system and round type to view the complete ballistic data table.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
