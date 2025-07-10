import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { CalculatorPage } from './components/CalculatorPage';
import { SettingsPage } from './components/SettingsPage';
import { HistoryPage } from './components/HistoryPage';
import { ResultsPage } from './components/ResultsPage';
import { NotFoundPage } from './components/NotFoundPage';
import { TermsOfServicePage } from './components/TermsOfServicePage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { LicensePage } from './components/LicensePage';
import { BallisticTablesPage } from './components/BallisticTablesPage';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <Navigation />
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<CalculatorPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/license" element={<LicensePage />} />
              <Route path="/ballistic-tables" element={<BallisticTablesPage />} />
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
