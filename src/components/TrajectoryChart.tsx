import { useMemo } from 'react';

interface TrajectoryChartProps {
  rangeMeters: number;
  elevationMils: number;
  timeOfFlightS: number;
  gunElevationM?: number;
  targetElevationM?: number;
  chargeLevel: string;
  roundName?: string;
}

export function TrajectoryChart({
  rangeMeters,
  elevationMils,
  timeOfFlightS,
  gunElevationM = 0,
  targetElevationM = 0,
  chargeLevel,
  roundName = 'Round'
}: TrajectoryChartProps) {
  
  // Calculate trajectory points
  const trajectoryData = useMemo(() => {
    const points = [];
    const numPoints = 50;
    
    // Convert elevation from mils to radians (1 mil = 0.001 radians approximately)
    const elevationRad = (elevationMils / 1000);
    
    // Calculate initial velocity using range and angle
    // Using simplified ballistic equation: range = (v^2 * sin(2*theta)) / g
    // Solving for v: v = sqrt((range * g) / sin(2*theta))
    const g = 9.81; // gravity
    const angleRad = elevationRad;
    
    // More accurate calculation considering time of flight
    // horizontal distance = v * cos(angle) * time
    const horizontalVelocity = rangeMeters / (timeOfFlightS * Math.cos(angleRad));
    const initialVelocity = horizontalVelocity / Math.cos(angleRad);
    
    // Calculate trajectory points
    for (let i = 0; i <= numPoints; i++) {
      const t = (timeOfFlightS * i) / numPoints;
      
      // Horizontal position
      const x = initialVelocity * Math.cos(angleRad) * t;
      
      // Vertical position (projectile motion equation with drag approximation)
      const y = gunElevationM + 
                initialVelocity * Math.sin(angleRad) * t - 
                0.5 * g * t * t;
      
      points.push({ x, y, t });
    }
    
    return points;
  }, [rangeMeters, elevationMils, timeOfFlightS, gunElevationM]);
  
  // Find maximum height
  const maxHeight = useMemo(() => {
    return Math.max(...trajectoryData.map(p => p.y));
  }, [trajectoryData]);
  
  // Calculate chart dimensions and scaling
  const chartWidth = 800;
  const chartHeight = 400;
  const padding = { top: 40, right: 60, bottom: 60, left: 60 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  
  // Scale functions
  const xScale = (x: number) => padding.left + (x / rangeMeters) * plotWidth;
  const yScale = (y: number) => {
    const yRange = Math.max(maxHeight - Math.min(gunElevationM, targetElevationM), 100);
    const yMin = Math.min(gunElevationM, targetElevationM, 0);
    return chartHeight - padding.bottom - ((y - yMin) / yRange) * plotHeight;
  };
  
  // Create SVG path for trajectory
  const trajectoryPath = trajectoryData
    .map((point, i) => {
      const x = xScale(point.x);
      const y = yScale(point.y);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');
  
  // Calculate apex (highest point)
  const apexPoint = trajectoryData.reduce((max, point) => 
    point.y > max.y ? point : max
  , trajectoryData[0]);
  
  // Format numbers for display
  const formatDistance = (m: number) => m >= 1000 ? `${(m/1000).toFixed(1)}km` : `${Math.round(m)}m`;
  const formatHeight = (m: number) => `${Math.round(m)}m`;
  const formatTime = (s: number) => `${s.toFixed(1)}s`;
  
  return (
    <div className="bg-white rounded-lg border border-gray-300 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          <i className="fas fa-chart-line mr-2 text-blue-600"></i>
          Trajectory Profile
        </h3>
        <p className="text-sm text-gray-600">
          Projectile flight path from gun to target
        </p>
      </div>
      
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto"
        style={{ maxHeight: '400px' }}
      >
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect 
          x={padding.left} 
          y={padding.top} 
          width={plotWidth} 
          height={plotHeight} 
          fill="url(#grid)" 
        />
        
        {/* Ground level reference line */}
        <line
          x1={padding.left}
          y1={yScale(0)}
          x2={chartWidth - padding.right}
          y2={yScale(0)}
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        <text
          x={padding.left - 10}
          y={yScale(0)}
          textAnchor="end"
          alignmentBaseline="middle"
          className="text-xs fill-gray-500"
        >
          Sea Level
        </text>
        
        {/* Gun position marker */}
        <circle
          cx={xScale(0)}
          cy={yScale(gunElevationM)}
          r="8"
          fill="#10b981"
          stroke="#059669"
          strokeWidth="2"
        />
        <text
          x={xScale(0)}
          y={yScale(gunElevationM) - 15}
          textAnchor="middle"
          className="text-xs font-semibold fill-green-700"
        >
          Gun
        </text>
        {gunElevationM !== 0 && (
          <text
            x={xScale(0)}
            y={yScale(gunElevationM) + 25}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            {formatHeight(gunElevationM)}
          </text>
        )}
        
        {/* Target position marker */}
        <circle
          cx={xScale(rangeMeters)}
          cy={yScale(targetElevationM)}
          r="8"
          fill="#ef4444"
          stroke="#dc2626"
          strokeWidth="2"
        />
        <text
          x={xScale(rangeMeters)}
          y={yScale(targetElevationM) - 15}
          textAnchor="middle"
          className="text-xs font-semibold fill-red-700"
        >
          Target
        </text>
        {targetElevationM !== 0 && (
          <text
            x={xScale(rangeMeters)}
            y={yScale(targetElevationM) + 25}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            {formatHeight(targetElevationM)}
          </text>
        )}
        
        {/* Trajectory arc */}
        <path
          d={trajectoryPath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Apex marker */}
        <circle
          cx={xScale(apexPoint.x)}
          cy={yScale(apexPoint.y)}
          r="5"
          fill="#f59e0b"
          stroke="#d97706"
          strokeWidth="2"
        />
        <line
          x1={xScale(apexPoint.x)}
          y1={yScale(apexPoint.y)}
          x2={xScale(apexPoint.x)}
          y2={padding.top - 15}
          stroke="#f59e0b"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <text
          x={xScale(apexPoint.x)}
          y={padding.top - 20}
          textAnchor="middle"
          className="text-xs font-semibold fill-orange-600"
        >
          Peak: {formatHeight(apexPoint.y)}
        </text>
        
        {/* X-axis */}
        <line
          x1={padding.left}
          y1={chartHeight - padding.bottom}
          x2={chartWidth - padding.right}
          y2={chartHeight - padding.bottom}
          stroke="#374151"
          strokeWidth="2"
        />
        <text
          x={chartWidth / 2}
          y={chartHeight - 15}
          textAnchor="middle"
          className="text-sm font-medium fill-gray-700"
        >
          Range (meters)
        </text>
        
        {/* X-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(fraction => (
          <g key={fraction}>
            <line
              x1={xScale(rangeMeters * fraction)}
              y1={chartHeight - padding.bottom}
              x2={xScale(rangeMeters * fraction)}
              y2={chartHeight - padding.bottom + 5}
              stroke="#374151"
              strokeWidth="1"
            />
            <text
              x={xScale(rangeMeters * fraction)}
              y={chartHeight - padding.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {formatDistance(rangeMeters * fraction)}
            </text>
          </g>
        ))}
        
        {/* Y-axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={chartHeight - padding.bottom}
          stroke="#374151"
          strokeWidth="2"
        />
        <text
          x={20}
          y={chartHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90, 20, ${chartHeight / 2})`}
          className="text-sm font-medium fill-gray-700"
        >
          Altitude (meters)
        </text>
      </svg>
      
      {/* Legend and stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-600"></div>
          <span className="text-gray-700">Gun Position</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-600"></div>
          <span className="text-gray-700">Target</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-orange-600"></div>
          <span className="text-gray-700">Peak Height</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-0.5 bg-blue-500"></div>
          <span className="text-gray-700">Trajectory</span>
        </div>
      </div>
      
      {/* Flight statistics */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 rounded-lg p-3">
        <div>
          <div className="text-xs text-gray-500 uppercase">Range</div>
          <div className="text-lg font-semibold text-gray-900">{formatDistance(rangeMeters)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase">Time of Flight</div>
          <div className="text-lg font-semibold text-gray-900">{formatTime(timeOfFlightS)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase">Elevation</div>
          <div className="text-lg font-semibold text-gray-900">{elevationMils} mils</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase">Charge</div>
          <div className="text-lg font-semibold text-gray-900">{chargeLevel}</div>
        </div>
      </div>
      
      {/* Additional info */}
      {roundName && (
        <div className="mt-3 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">
          <i className="fas fa-info-circle mr-1 text-blue-600"></i>
          <strong>Round:</strong> {roundName} | 
          <strong className="ml-2">Note:</strong> Trajectory shown is approximate. Actual flight path may vary due to atmospheric conditions, propellant temperature, and round variation.
        </div>
      )}
    </div>
  );
}
