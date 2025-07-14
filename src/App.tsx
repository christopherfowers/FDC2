import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import { AppProvider } from './contexts/AppContext';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import './App.css';

// Lazy load components for better performance
const LandingPage = lazy(() => import('./components/LandingPage'));
const MissionDashboard = lazy(() => import('./components/MissionDashboard').then(module => ({ default: module.MissionDashboard })));
const CalculatorPage = lazy(() => import('./components/CalculatorPage').then(module => ({ default: module.CalculatorPage })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(module => ({ default: module.SettingsPage })));
const EnhancedHistoryPage = lazy(() => import('./components/EnhancedHistoryPage').then(module => ({ default: module.EnhancedHistoryPage })));
const ResultsPage = lazy(() => import('./components/ResultsPage').then(module => ({ default: module.ResultsPage })));
const MissionPrepPage = lazy(() => import('./components/MissionPrepPage').then(module => ({ default: module.MissionPrepPage })));
const FireMissionPage = lazy(() => import('./components/FireMissionPage').then(module => ({ default: module.FireMissionPage })));
const FireSolutionPage = lazy(() => import('./components/FireSolutionPage').then(module => ({ default: module.FireSolutionPage })));
const BallisticTablesPage = lazy(() => import('./components/BallisticTablesPage').then(module => ({ default: module.BallisticTablesPage })));

// Lightweight components can be imported normally
import { NotFoundPage } from './components/NotFoundPage';
import { TermsOfServicePage } from './components/TermsOfServicePage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { LicensePage } from './components/LicensePage';

// Loading fallback component with CSS-only spinner to avoid FontAwesome dependency
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

// Enhanced Suspense wrapper that ensures FontAwesome is ready
const SuspenseWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <Navigation />
          
          <main className="flex-grow">
            <SuspenseWrapper>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<MissionDashboard />} />
                <Route path="/calculator" element={<CalculatorPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/history" element={<EnhancedHistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/mission/prep" element={<MissionPrepPage />} />
                <Route path="/mission/calculate" element={<FireMissionPage />} />
                <Route path="/mission/solution" element={<FireSolutionPage />} />
                <Route path="/ballistic-tables" element={<BallisticTablesPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/license" element={<LicensePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </SuspenseWrapper>
          </main>
          
          <Footer />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
