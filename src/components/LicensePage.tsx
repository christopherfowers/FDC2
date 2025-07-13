import { Link } from 'react-router-dom';
import { useSEO, SEOConfig } from '../hooks/useSEO';

export function LicensePage() {
  useSEO(SEOConfig.license);
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Software License</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-amber-800 mb-2">Proprietary License</h2>
            <p className="text-amber-700">
              This Fire Direction Calculator (FDC2) software is the exclusive property of Vince Browning. 
              All rights reserved under copyright law.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Copyright Notice</h2>
            <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mb-4">
              <p className="font-mono text-sm text-gray-800">
                Copyright © {new Date().getFullYear()} Vince Browning. All rights reserved.<br/>
                Fire Direction Calculator (FDC2)<br/>
                Website, Application, Source Code, and Docker Implementation
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Grant of Rights</h2>
            <div className="text-gray-700 space-y-4">
              <p><strong>✅ You are granted permission to:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Use this software for personal, educational, and training purposes</li>
                <li>Access all features and functionality provided</li>
                <li>Run the application in web browsers and compatible environments</li>
                <li>Use the software for legitimate military/tactical training</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Restrictions</h2>
            <div className="text-gray-700 space-y-4">
              <p><strong>❌ You are expressly prohibited from:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Copying the source code, website, or application</li>
                <li>Modifying, adapting, or creating derivative works</li>
                <li>Distributing, sharing, or redistributing the software</li>
                <li>Reverse engineering or decompiling the application</li>
                <li>Commercial use without explicit written permission</li>
                <li>Removing or altering copyright notices</li>
                <li>Hosting or deploying your own instance of the software</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Scope of License</h2>
            <p className="text-gray-700 mb-4">
              This license applies to all components of the FDC2 system including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Web application and user interface</li>
              <li>Backend server and API</li>
              <li>Database schema and ballistic data</li>
              <li>Docker containers and deployment configurations</li>
              <li>Documentation and related materials</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              All intellectual property rights in and to the software, including but not limited to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Source code and algorithms</li>
              <li>User interface design and layout</li>
              <li>Ballistic calculation methods</li>
              <li>Database structures and data</li>
              <li>Documentation and help materials</li>
            </ul>
            <p className="text-gray-700 mt-4">
              remain the exclusive property of Vince Browning.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Termination</h2>
            <p className="text-gray-700 mb-4">
              This license is effective until terminated. Your rights under this license will terminate 
              automatically if you fail to comply with any of the terms. Upon termination, you must 
              cease all use of the software.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Disclaimer</h2>
            <p className="text-gray-700 mb-4">
              This software is provided "as is" without warranty of any kind. The author disclaims all 
              warranties, express or implied, including but not limited to the warranties of merchantability, 
              fitness for a particular purpose, and non-infringement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Enforcement</h2>
            <p className="text-gray-700 mb-4">
              Unauthorized use, copying, distribution, or modification of this software may result in 
              severe civil and criminal penalties, and will be prosecuted to the maximum extent possible 
              under the law.
            </p>
          </section>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-8">
            <p className="text-red-800 text-sm">
              <strong>Important:</strong> This is proprietary software. While free to use, it is not open source. 
              All rights are reserved by the copyright holder.
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
