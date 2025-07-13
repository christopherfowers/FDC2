import { Link } from 'react-router-dom';
import { useSEO, SEOConfig } from '../hooks/useSEO';

export function TermsOfServicePage() {
  useSEO(SEOConfig.terms);
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using the Fire Direction Calculator (FDC2) application, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use this application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Permitted Use</h2>
            <div className="text-gray-700 space-y-3">
              <p><strong>✅ You MAY:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Use this application for Arma Reforger gameplay enhancement</li>
                <li>Use this application for gaming and simulation purposes</li>
                <li>Access and use all features provided in the application</li>
                <li>Clear cache and reload the application as needed (infrequent use acceptable)</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Prohibited Activities</h2>
            <div className="text-gray-700 space-y-3">
              <p><strong>❌ You MAY NOT:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Copy, modify, or distribute the source code</li>
                <li>Reverse engineer the application</li>
                <li>Use this application for commercial purposes without permission</li>
                <li>Abuse the service through excessive automated requests</li>
                <li>Share, sell, or redistribute this application</li>
                <li>Remove or modify copyright notices</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Educational Use Only</h2>
            <p className="text-gray-700 mb-4">
              This application is provided for educational and training purposes only. All ballistic calculations 
              should be verified through official sources before any practical application. The software is not 
              intended for operational military use without proper verification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Gaming Disclaimer</h2>
            <p className="text-gray-700 mb-4">
              This application is designed specifically for Arma Reforger gameplay and is provided "as is" without warranty of any kind. 
              Users are responsible for verifying all calculations within the game context. The author assumes no responsibility for 
              errors or inaccuracies in the gaming calculations provided.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              This application is the intellectual property of Vince Browning. All rights reserved. 
              Unauthorized copying, modification, or distribution is strictly prohibited.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              These terms may be updated periodically. Continued use of the application constitutes 
              acceptance of any changes to these terms.
            </p>
          </section>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <p className="text-blue-800 text-sm">
              <strong>Questions?</strong> These terms are designed to be permissive for legitimate educational use 
              while protecting the intellectual property rights of the creator.
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
