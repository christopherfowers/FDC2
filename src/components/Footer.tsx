import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Copyright */}
          <div className="text-center md:text-left">
            <p className="text-sm">
              © {new Date().getFullYear()} Vince Browning. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Arma Reforger Mortar Calculator & Fire Direction Center
            </p>
          </div>
          
          {/* Legal Links */}
          <div className="text-center">
            <div className="space-x-4 text-sm">
              <Link 
                to="/terms" 
                className="text-gray-300 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                to="/privacy" 
                className="text-gray-300 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/license" 
                className="text-gray-300 hover:text-white transition-colors"
              >
                License
              </Link>
            </div>
          </div>
          
          {/* Usage Notice */}
          <div className="text-center md:text-right">
            <p className="text-xs text-gray-300">
              Free to use. Not for redistribution.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              For Arma Reforger gameplay only
            </p>
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="border-t border-gray-700 mt-6 pt-6 text-center">
          <p className="text-xs text-gray-400">
            This software is provided for educational and training purposes only. 
            Users are responsible for verifying all calculations and data accuracy.
          </p>
        </div>
      </div>
    </footer>
  );
}
