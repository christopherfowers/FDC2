import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { FireDirectionService } from '../services/fireDirectionService';
import { csvDataService } from '../services/csvDataService';
import { ServiceWorkerManager } from '../services/serviceWorkerManager';
import type { MortarSystem, MortarRound } from '../types/mortar';

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
  
  // Calculator state
  calculatorState: CalculatorState;
  setCalculatorState: (state: Partial<CalculatorState>) => void;
  resetCalculatorState: () => void;
  
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
    notes: ''
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

      // Load data
      await loadData();

      // Prefetch additional data in background
      await swManager.prefetchData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize app');
    } finally {
      setIsLoading(false);
    }
  }, [loadData]);

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
    refreshData,
    updateApp,
    clearCache
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
