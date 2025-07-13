// Mission-centric data models for FDC workflow

export type MissionStatus = 'prep' | 'active' | 'complete';
export type MissionPhase = 'prep' | 'calculate' | 'solution';
export type FPFPriority = 'primary' | 'alternate' | 'supplemental';
export type FireControl = 'fire_when_ready' | 'on_command';
export type TacticalOptimization = 'speed' | 'accuracy' | 'dispersion' | 'high_angle' | 'efficiency';
export type FireMissionStatus = 'planned' | 'fired' | 'adjusted' | 'complete';

// Multi-gun calculation types
export interface GunPosition {
  id: string;
  name: string;                    // "Gun 1", "Gun 2", etc.
  position: string;                // MGRS grid position
  azimuthOffset?: number;          // Azimuth offset from base gun in mils
  elevationOffset?: number;        // Elevation offset from base gun in mils
  status: 'active' | 'inactive' | 'maintenance';
  created: Date;
}

export interface MultiGunSpread {
  formation: 'line' | 'arc' | 'dispersed' | 'custom';
  spacing: number;                 // Meters between guns
  orientation: number;             // Mils, direction of gun line/arc
  totalSpread: number;             // Total width/arc of gun positions in meters
  gunPositions: GunPosition[];
}

export interface SynchronizedFireSolution {
  targetGrid: string;
  masterGunSolution: FireSolution;
  gunSolutions: Array<{
    gunId: string;
    gunName: string;
    position: string;
    fireSolution: FireSolution;
    azimuthCorrection: number;     // Mils correction from master gun
    elevationCorrection: number;   // Mils correction from master gun
    timeDelay: number;             // Seconds delay for simultaneous impact
  }>;
  simultaneousImpact: boolean;
  totalTimeOfFlight: number;       // Time for all rounds to impact
  spreadPattern: {
    width: number;                 // Meters
    depth: number;                 // Meters
    center: string;                // MGRS grid of impact center
  };
}

export interface LoadDistribution {
  totalRounds: number;
  distributionMethod: 'equal' | 'weighted' | 'priority' | 'custom';
  gunAssignments: Array<{
    gunId: string;
    gunName: string;
    assignedRounds: number;
    roundType: string;
    firingOrder: number;
    justification: string;
  }>;
  firingSequence: Array<{
    phase: number;
    guns: string[];               // Gun IDs firing in this phase
    roundsPerGun: number;
    interval: number;             // Seconds between phases
  }>;
}

// Advanced FPF Management Types
export interface FPFSector {
  id: string;
  name: string;                    // "Alpha", "Bravo", "Charlie", etc.
  azimuthStart: number;            // Starting azimuth in mils
  azimuthEnd: number;              // Ending azimuth in mils
  description?: string;
  priority: FPFPriority;
  assignedTargets: string[];       // Array of FPF target IDs
  coverageRadius?: number;         // Optional coverage radius in meters
  created: Date;
}

export interface FPFCoverageAnalysis {
  totalCoverageAngle: number;      // Total angular coverage in mils
  gapsInCoverage: Array<{
    startAzimuth: number;
    endAzimuth: number;
    gapSize: number;               // Size of gap in mils
  }>;
  overlappingAreas: Array<{
    sector1Id: string;
    sector2Id: string;
    overlapStartAzimuth: number;
    overlapEndAzimuth: number;
    overlapSize: number;           // Size of overlap in mils
  }>;
  recommendations: string[];       // Tactical recommendations
}

export interface FPFFireDistribution {
  targetId: string;
  recommendedTubes: number;        // Number of tubes to assign
  recommendedRounds: number;       // Rounds per tube
  firingOrder: number;             // Sequence in FPF execution
  justification: string;           // Reasoning for assignment
}

export interface FPFTarget {
  id: string;
  name: string;                    // "FPF Alpha", "FPF Bravo", etc.
  targetGrid: string;              // MGRS target location
  priority: FPFPriority;
  sector?: string;                 // Assigned sector if applicable
  preplannedSolution?: {
    azimuthMils: number;
    elevationMils: number;
    chargeLevel: string;
    timeOfFlight: number;
    rangeMeters: number;
  };
  notes?: string;
  created: Date;
  lastCalculated?: Date;
}

export interface FireSolution {
  azimuthMils: number;
  elevationMils: number;
  chargeLevel: string;
  timeOfFlight: number;
  rangeMeters: number;
}

export interface FireMissionCorrection {
  id: string;
  timestamp: Date;
  rangeCorrection: number;       // meters (+ add, - drop)
  directionCorrection: number;   // mils (+ right, - left)
  adjustedSolution: FireSolution;
  notes?: string;
}

export interface FireMissionRecord {
  id: string;
  missionId: string;               // Parent mission ID
  timestamp: Date;
  
  // Call for Fire Details
  targetGrid: string;
  foPosition: string;              // FO position for this specific fire mission
  fireControl: FireControl;
  roundType: string;               // Shell type for this mission (mortar round ID)
  numberOfRounds: number;
  specialInstructions?: string;
  
  // Tactical Optimization
  optimization: TacticalOptimization;
  
  // Fire Solution
  fireSolution: FireSolution;
  
  // Command Script
  generatedCommand: string;
  
  // Corrections (if any)
  corrections: FireMissionCorrection[];
  
  // Status
  status: FireMissionStatus;
  notes?: string;
}

export interface Mission {
  id: string;
  name: string;                    // "Operation Thunder", "Training Exercise Alpha"
  description?: string;
  status: MissionStatus;
  currentPhase: MissionPhase;
  
  // Mission Prep Data
  mortarPosition: string;          // MGRS grid (base gun position)
  numberOfGuns: number;            // Number of mortar tubes
  selectedSystem: string;          // Mortar system ID
  availableRounds: string[];       // Available ammunition types (mortar round IDs)
  initialFOPosition?: string;      // Forward observer initial position
  fpfTargets: FPFTarget[];        // Pre-planned final protective fire targets
  
  // Multi-gun Configuration (optional, for numberOfGuns > 1)
  gunSpread?: MultiGunSpread;      // Gun positioning and formation
  enableMultiGunCalculations?: boolean; // Whether to use synchronized firing
  
  // Fire Mission Data (populated during calculate phase)
  fireMissions: FireMissionRecord[];
  
  // Metadata
  created: Date;
  lastModified: Date;
  createdBy?: string;
}

// Utility types for mission operations
export interface MissionSummary {
  id: string;
  name: string;
  status: MissionStatus;
  currentPhase: MissionPhase;
  numberOfFPFTargets: number;
  numberOfFireMissions: number;
  lastModified: Date;
}

export interface MissionTemplate {
  id: string;
  name: string;
  description?: string;
  mortarPosition?: string;
  numberOfGuns: number;
  selectedSystem: string;
  availableRounds: string[];
  fpfTargets: Omit<FPFTarget, 'id' | 'created' | 'lastCalculated'>[];
  created: Date;
  createdBy?: string;
}

// Mission creation helpers
export type CreateMissionData = Omit<Mission, 'id' | 'created' | 'lastModified' | 'fireMissions' | 'status' | 'currentPhase'>;
export type CreateFPFTargetData = Omit<FPFTarget, 'id' | 'created' | 'lastCalculated'>;
export type CreateFireMissionData = Omit<FireMissionRecord, 'id' | 'timestamp' | 'corrections' | 'status' | 'generatedCommand'>;
