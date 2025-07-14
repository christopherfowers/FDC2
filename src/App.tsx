import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import './App.css';

// Import components directly (no lazy loading for now)
import LandingPage from './components/LandingPage';
import { MissionDashboard } from './components/MissionDashboard';
import { CalculatorPage } from './components/CalculatorPage';
import { SettingsPage } from './components/SettingsPage';
import { EnhancedHistoryPage } from './components/EnhancedHistoryPage';
import { ResultsPage } from './components/ResultsPage';
import { MissionPrepPage } from './components/MissionPrepPage';
import { FireMissionPage } from './components/FireMissionPage';
import { FireSolutionPage } from './components/FireSolutionPage';
import { BallisticTablesPage } from './components/BallisticTablesPage';
import { NotFoundPage } from './components/NotFoundPage';
import { TermsOfServicePage } from './components/TermsOfServicePage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { LicensePage } from './components/LicensePage';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <Navigation />
          
          <main className="flex-grow">
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
          </main>
          
          <Footer />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
