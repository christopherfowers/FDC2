import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { FireDirectionService } from '../services/fireDirectionService';
import type { FireMissionMethod } from '../services/fireDirectionService';
import { csvDataService } from '../services/csvDataService';
import { ServiceWorkerManager } from '../services/serviceWorkerManager';
import { missionService } from '../services/missionService';
import type { MortarSystem, MortarRound } from '../types/mortar';
import type { Mission, MissionSummary, CreateMissionData, CreateFPFTargetData, FPFTarget, MissionPhase } from '../types/mission';

interface CalculatorState {
  mortarGrid: string;
  observerGrid: string;
  foAzimuthMils: number;
  foDistanceMeters: number;
  targetGrid: string;
  selectedSystem: string;
  selectedRound: string;
  rangeAdjustmentM: number;
  directionAdjustmentMils: number;
  notes: string;
  fireMethod: FireMissionMethod;
  maxDispersion?: number;
}

interface AppContextType {
  // Services
  fdService: FireDirectionService;

  // Data state
  mortarSystems: MortarSystem[];
  mortarRounds: MortarRound[];
  isLoading: boolean;
  error: string | null;

  // PWA state
  isOffline: boolean;
  hasUpdate: boolean;

  // Calculator state (quick calculator with streamlined features)
  calculatorState: CalculatorState;
  setCalculatorState: (state: Partial<CalculatorState>) => void;
  resetCalculatorState: () => void;

  // Mission workflow state
  currentMission: Mission | null;
  missions: MissionSummary[];

  // Mission management actions
  createMission: (missionData: CreateMissionData) => Promise<string>;
  updateMission: (id: string, updates: Partial<Mission>) => Promise<void>;
  deleteMission: (id: string) => Promise<void>;
  setCurrentMission: (id: string | null) => Promise<void>;
  getMission: (id: string) => Promise<Mission | null>;
  
  // FPF target management
  addFPFTarget: (missionId: string, targetData: CreateFPFTargetData) => Promise<string>;
  updateFPFTarget: (missionId: string, targetId: string, updates: Partial<FPFTarget>) => Promise<void>;
  deleteFPFTarget: (missionId: string, targetId: string) => Promise<void>;

  // Mission phase management
  advancePhase: (missionId: string) => Promise<void>;
  setPhase: (missionId: string, phase: MissionPhase) => Promise<void>;

  // Actions
  refreshData: () => Promise<void>;
  updateApp: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [fdService] = useState(() => new FireDirectionService());
  const [mortarSystems, setMortarSystems] = useState<MortarSystem[]>([]);
  const [mortarRounds, setMortarRounds] = useState<MortarRound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasUpdate, setHasUpdate] = useState(false);

  // Mission state
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [missions, setMissions] = useState<MissionSummary[]>([]);

  // Default calculator state
  const defaultCalculatorState: CalculatorState = {
    mortarGrid: '',
    observerGrid: '',
    foAzimuthMils: 0,
    foDistanceMeters: 0,
    targetGrid: '',
    selectedSystem: '',
    selectedRound: '',
    rangeAdjustmentM: 0,
    directionAdjustmentMils: 0,
    notes: '',
    fireMethod: 'standard'
  };

  // Calculator state with persistence
  const [calculatorState, setCalculatorStateInternal] = useState<CalculatorState>(() => {
    try {
      const saved = localStorage.getItem('fdc-calculator-state');
      return saved ? { ...defaultCalculatorState, ...JSON.parse(saved) } : defaultCalculatorState;
    } catch {
      return defaultCalculatorState;
    }
  });

  // Save calculator state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('fdc-calculator-state', JSON.stringify(calculatorState));
    } catch (error) {
      console.warn('Failed to save calculator state:', error);
    }
  }, [calculatorState]);

  const setCalculatorState = (partialState: Partial<CalculatorState>) => {
    setCalculatorStateInternal(prev => ({ ...prev, ...partialState }));
  };

  const resetCalculatorState = () => {
    setCalculatorStateInternal(defaultCalculatorState);
    localStorage.removeItem('fdc-calculator-state');
  };

  // Mission management functions
  const loadMissionData = useCallback(async () => {
    try {
      const missionSummaries = await missionService.getMissionSummaries();
      setMissions(missionSummaries);

      // Load current mission if one is set
      const currentMissionId = missionService.getCurrentMissionId();
      if (currentMissionId) {
        const mission = await missionService.getMission(currentMissionId);
        setCurrentMission(mission);
      }
    } catch (err) {
      console.warn('Failed to load mission data:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      // Initialize CSV data service
      await csvDataService.initialize();

      // Get data from CSV service
      const systems = await csvDataService.getAllMortarSystems();
      const rounds = await csvDataService.getAllMortarRounds();
      const ballisticData = await csvDataService.getAllMortarRoundData();

      // Initialize fire direction service with CSV data
      await fdService.initialize(systems, rounds, ballisticData);

      setMortarSystems(systems);
      setMortarRounds(rounds);

    } catch (err) {
      throw new Error(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [fdService]);

  const initializeApp = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize service worker
      const swManager = ServiceWorkerManager.getInstance();
      await swManager.initialize();

      // Subscribe to service worker state changes
      swManager.onStateChange((state) => {
        setHasUpdate(state.isWaitingForUpdate);
        setIsOffline(state.isOffline);
      });

      // Load ballistic data
      await loadData();

      // Load mission data
      await loadMissionData();

      // Prefetch additional data in background
      await swManager.prefetchData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize app');
    } finally {
      setIsLoading(false);
    }
  }, [loadData, loadMissionData]);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Force refresh CSV data
      await csvDataService.initialize(true); // Force refresh

      // Get fresh data from CSV service
      const systems = await csvDataService.getAllMortarSystems();
      const rounds = await csvDataService.getAllMortarRounds();
      const ballisticData = await csvDataService.getAllMortarRoundData();

      await fdService.initialize(systems, rounds, ballisticData);

      setMortarSystems(systems);
      setMortarRounds(rounds);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateApp = async () => {
    try {
      const swManager = ServiceWorkerManager.getInstance();
      await swManager.updateToNewVersion();
      // App will reload automatically after update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update app');
    }
  };

  const clearCache = async () => {
    try {
      const swManager = ServiceWorkerManager.getInstance();

      await Promise.all([
        swManager.clearCaches(),
        csvDataService.clearCache()
      ]);

      // Reload to get fresh data
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    }
  };

  const createMission = async (missionData: CreateMissionData): Promise<string> => {
    try {
      const missionId = await missionService.createMission(missionData);
      await loadMissionData(); // Refresh mission list
      return missionId;
    } catch (err) {
      throw new Error(`Failed to create mission: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const updateMission = async (id: string, updates: Partial<Mission>): Promise<void> => {
    try {
      await missionService.updateMission(id, updates);
      await loadMissionData(); // Refresh mission list
      
      // Update current mission if it's the one being updated
      if (currentMission?.id === id) {
        const updatedMission = await missionService.getMission(id);
        setCurrentMission(updatedMission);
      }
    } catch (err) {
      throw new Error(`Failed to update mission: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const deleteMission = async (id: string): Promise<void> => {
    try {
      await missionService.deleteMission(id);
      await loadMissionData(); // Refresh mission list
      
      // Clear current mission if it was deleted
      if (currentMission?.id === id) {
        setCurrentMission(null);
      }
    } catch (err) {
      throw new Error(`Failed to delete mission: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const setCurrentMissionById = async (id: string | null): Promise<void> => {
    try {
      missionService.setCurrentMissionId(id);
      
      if (id) {
        const mission = await missionService.getMission(id);
        setCurrentMission(mission);
      } else {
        setCurrentMission(null);
      }
    } catch (err) {
      throw new Error(`Failed to set current mission: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getMission = async (id: string): Promise<Mission | null> => {
    try {
      return await missionService.getMission(id);
    } catch (err) {
      throw new Error(`Failed to get mission: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const addFPFTarget = async (missionId: string, targetData: CreateFPFTargetData): Promise<string> => {
    try {
      const targetId = await missionService.addFPFTarget(missionId, targetData);
      await loadMissionData(); // Refresh mission list
      
      // Update current mission if it's the one being updated
      if (currentMission?.id === missionId) {
        const updatedMission = await missionService.getMission(missionId);
        setCurrentMission(updatedMission);
      }
      
      return targetId;
    } catch (err) {
      throw new Error(`Failed to add FPF target: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const updateFPFTarget = async (missionId: string, targetId: string, updates: Partial<FPFTarget>): Promise<void> => {
    try {
      await missionService.updateFPFTarget(missionId, targetId, updates);
      await loadMissionData(); // Refresh mission list
      
      // Update current mission if it's the one being updated
      if (currentMission?.id === missionId) {
        const updatedMission = await missionService.getMission(missionId);
        setCurrentMission(updatedMission);
      }
    } catch (err) {
      throw new Error(`Failed to update FPF target: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const deleteFPFTarget = async (missionId: string, targetId: string): Promise<void> => {
    try {
      await missionService.deleteFPFTarget(missionId, targetId);
      await loadMissionData(); // Refresh mission list
      
      // Update current mission if it's the one being updated
      if (currentMission?.id === missionId) {
        const updatedMission = await missionService.getMission(missionId);
        setCurrentMission(updatedMission);
      }
    } catch (err) {
      throw new Error(`Failed to delete FPF target: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const advancePhase = async (missionId: string): Promise<void> => {
    try {
      await missionService.advancePhase(missionId);
      await loadMissionData(); // Refresh mission list
      
      // Update current mission if it's the one being updated
      if (currentMission?.id === missionId) {
        const updatedMission = await missionService.getMission(missionId);
        setCurrentMission(updatedMission);
      }
    } catch (err) {
      throw new Error(`Failed to advance phase: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const setPhase = async (missionId: string, phase: MissionPhase): Promise<void> => {
    try {
      await missionService.setPhase(missionId, phase);
      await loadMissionData(); // Refresh mission list
      
      // Update current mission if it's the one being updated
      if (currentMission?.id === missionId) {
        const updatedMission = await missionService.getMission(missionId);
        setCurrentMission(updatedMission);
      }
    } catch (err) {
      throw new Error(`Failed to set phase: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const value: AppContextType = {
    fdService,
    mortarSystems,
    mortarRounds,
    isLoading,
    error,
    isOffline,
    hasUpdate,
    calculatorState,
    setCalculatorState,
    resetCalculatorState,
    currentMission,
    missions,
    refreshData,
    updateApp,
    clearCache,
    createMission,
    updateMission,
    deleteMission,
    setCurrentMission: setCurrentMissionById,
    getMission,
    addFPFTarget,
    updateFPFTarget,
    deleteFPFTarget,
    advancePhase,
    setPhase
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
