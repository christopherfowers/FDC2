import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { FDCLogo } from './FDCLogo';
import { useApp } from '../contexts/AppContext';
import '../navigation.css';

export function Navigation() {
  const location = useLocation();
  const { currentMission } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Close mobile menu when clicking outside or on escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getMissionPhase = () => {
    if (!currentMission) return null;
    
    if (location.pathname === '/mission/prep') return 'prep';
    if (location.pathname === '/mission/calculate') return 'calculate';
    if (location.pathname === '/mission/solution') return 'solution';
    return null;
  };

  const currentPhase = getMissionPhase();

  const navigationItems = [
    { path: '/', icon: 'fas fa-home', label: 'Dashboard', title: 'Mission Dashboard' },
    { path: '/calculator', icon: 'fas fa-calculator', label: 'Calculator', title: 'Quick Calculator' },
    { path: '/history', icon: 'fas fa-history', label: 'History', title: 'Mission History' },
    { path: '/ballistic-tables', icon: 'fas fa-table', label: 'Tables', title: 'Ballistic Tables' },
    { path: '/settings', icon: 'fas fa-cog', label: 'Settings', title: 'Application Settings' }
  ];

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-40" ref={navRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Always Visible */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
              title="Fire Direction Center - Home"
            >
              <FDCLogo size={28} textSize="xl" />
            </Link>
          </div>

          {/* Desktop Navigation - ONLY visible on medium screens and above */}
          <div className="desktop-nav items-center space-x-4">
            {/* New Mission Button */}
            <Link
              to="/mission/prep"
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              title="Start a new fire mission"
            >
              <i className="fas fa-plus"></i>
              <span>New Mission</span>
            </Link>
            
            {/* Mission Progress Indicator */}
            {currentMission && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-md text-sm">
                <i className="fas fa-bullseye"></i>
                <span>{currentMission.name}</span>
                <span className="text-xs">
                  {currentPhase === 'prep' && '(1/3)'}
                  {currentPhase === 'calculate' && '(2/3)'}
                  {currentPhase === 'solution' && '(3/3)'}
                </span>
              </div>
            )}

            {/* Navigation Items */}
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                title={item.title}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path) 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile Controls - ONLY visible on small screens, HIDDEN on medium and above */}
          <div className="mobile-nav items-center space-x-2">
            {/* Current Mission Indicator - Mobile */}
            {currentMission && (
              <div className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                <i className="fas fa-bullseye mr-1"></i>
                <span className="max-w-20 truncate">{currentMission.name}</span>
              </div>
            )}
            
            {/* Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
              title={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <span className="sr-only">{isMobileMenuOpen ? "Close" : "Open"} main menu</span>
              {!isMobileMenuOpen ? (
                <i className="fas fa-bars text-lg" aria-hidden="true"></i>
              ) : (
                <i className="fas fa-times text-lg" aria-hidden="true"></i>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu - Show when open and on sm screens only */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
            {/* New Mission Button - Mobile */}
            <Link
              to="/mission/prep"
              className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors w-full"
              title="Start a new fire mission"
            >
              <i className="fas fa-plus w-5 text-center" aria-hidden="true"></i>
              <span>New Mission</span>
            </Link>

            {/* Navigation Items - Mobile */}
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                title={item.title}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors w-full ${
                  isActive(item.path) 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className={`${item.icon} w-5 text-center`} aria-hidden="true"></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
