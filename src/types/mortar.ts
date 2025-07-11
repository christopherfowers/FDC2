/* ---------- Mortar CSV Data ⇢ TypeScript ---------- */

/** mortar_system */
export interface MortarSystem {
  id: number;               // PRIMARY KEY
  name: string;             // e.g. "M252"
  caliberMm: number;        // bore diameter
  nationality?: string | null;
}

/** mortar_round */
export interface MortarRound {
  id: number;
  name: string;             // e.g. "M931 HE"
  roundType: string;        // HE | Smoke | Illum | ...
  caliberMm: number;
  nationality?: string | null;
}

/** mortar_round_data */
export interface MortarRoundData {
  id: number;
  mortarSystemId: number;   // FK → MortarSystem.id
  mortarRoundId: number;    // FK → MortarRound.id
  chargeLevel: number;      // charge level (0, 1, 2, etc.)
  avgDispersionM: number;   // mean radial error at that range
  rangeM: number;           // horizontal distance
  elevationMils: number;    // tube quadrant elevation
  timeOfFlightS: number;    // seconds
  dElevPer100mMils?: number | null;
  dTofPer100mS?: number | null;
}

// Combined view for API responses
export interface MortarBallisticData extends MortarRoundData {
  mortarSystemName: string;
  mortarRoundName: string;
  mortarRoundType: string;
}

// API request/response types
export interface BallisticQueryParams {
  mortarSystemId?: number;
  mortarRoundId?: number;
  rangeMin?: number;
  rangeMax?: number;
}

export interface FireSolutionRequest {
  mortarSystemId: number;
  mortarRoundId: number;
  rangeM: number;
}

export interface FireSolutionResponse {
  rangeM: number;
  elevationMils: number;
  timeOfFlightS: number;
  avgDispersionM: number;
  interpolated: boolean;
  interpolationMethod?: 'exact' | 'derivative' | 'linear';
  derivativeAccuracy?: {
    elevationUsesDerivative: boolean;
    tofUsesDerivative: boolean;
  };
}

// Observer adjustment types
export interface ObserverAdjustment {
  range: number;        // meters, positive = add range, negative = drop range
  direction: number;    // mils, relative to observer's line of sight (left/right)
}

export interface AdjustedTarget {
  originalGrid: string;
  adjustedGrid: string;
  adjustmentApplied: ObserverAdjustment;
  observerAzimuthToTarget: number; // mils
}
