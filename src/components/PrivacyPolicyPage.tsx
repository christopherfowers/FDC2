import { Link } from 'react-router-dom';

export function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-green-800 mb-2">Simple Truth: We Collect No Data</h2>
            <p className="text-green-700">
              This Fire Direction Calculator (FDC2) application does not collect, store, transmit, or share any personal data. 
              Your privacy is completely protected because we simply don't collect any information about you.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">What We Don't Collect</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Personal information (names, emails, addresses)</li>
              <li>Usage analytics or tracking data</li>
              <li>Device information or fingerprints</li>
              <li>Location data</li>
              <li>Cookies for tracking purposes</li>
              <li>Fire mission calculations or inputs</li>
              <li>User preferences or settings (beyond local storage)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Local Storage Only</h2>
            <p className="text-gray-700 mb-4">
              Any data you enter (calculations, history, settings) is stored locally on your device only. This data:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Never leaves your device</li>
              <li>Is not transmitted to any servers</li>
              <li>Can be cleared by you at any time</li>
              <li>Is automatically removed if you uninstall the application</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Application Purpose</h2>
            <p className="text-gray-700 mb-4">
              This Fire Direction Calculator is designed specifically for Arma Reforger gameplay enhancement. 
              It provides ballistic calculations and mortar firing solutions for gaming purposes only.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">No Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              This application does not integrate with any third-party analytics, advertising, or tracking services. 
              There are no external scripts, trackers, or data collection mechanisms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Server Logs</h2>
            <p className="text-gray-700 mb-4">
              Our web servers may temporarily log basic technical information (IP addresses, browser types) for 
              operational purposes only. These logs are not analyzed for user behavior and are automatically 
              purged on a regular basis.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cache and Data Management</h2>
            <p className="text-gray-700 mb-4">
              You may need to occasionally clear your browser cache and reload the application. This is acceptable 
              and expected behavior. Any local data lost during this process can be re-entered as needed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              Since we don't collect data, this policy is unlikely to change. Any updates will be posted here 
              and will maintain our commitment to not collecting user data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this privacy policy, please note that since we collect no data, 
              there is no personal information to inquire about or request deletion of.
            </p>
          </section>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <p className="text-blue-800 text-sm">
              <strong>Bottom Line:</strong> Your privacy is 100% protected because we simply don't collect any data about you. 
              Everything stays on your device, under your control.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Back to Calculator
          </Link>
        </div>
      </div>
    </div>
  );
}
