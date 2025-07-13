import { useState, useEffect, useRef } from 'react';
import { MGRSService } from '../services/mgrsService';

interface MGRSInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

interface ValidationState {
  isValid: boolean | null;
  error?: string;
  hint?: string;
  progress?: number; // 0-100 for completion progress
  precision?: string;
}

export function MGRSInput({
  value,
  onChange,
  placeholder = "e.g., 1000010000 or 32UPU1000010000",
  label,
  icon,
  disabled = false,
  className = ""
}: MGRSInputProps) {
  const [validation, setValidation] = useState<ValidationState>({ isValid: null });
  const [showHelp, setShowHelp] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Real-time validation with detailed feedback
  useEffect(() => {
    if (!value.trim()) {
      setValidation({ isValid: null });
      return;
    }

    const validationResult = validateMGRSProgressively(value);
    setValidation(validationResult);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.toUpperCase();
    
    // Remove any characters that aren't numbers or letters
    inputValue = inputValue.replace(/[^0-9A-Z]/g, '');
    
    // Smart formatting assistance
    if (inputValue.length > 0) {
      // If user is typing what looks like coordinates only, help with spacing
      if (/^\d+$/.test(inputValue) && inputValue.length >= 6 && inputValue.length <= 10 && inputValue.length % 2 === 0) {
        // This is valid coordinate-only format, no changes needed
      }
      // If user starts typing full MGRS, validate zone/band/square pattern
      else if (/^\d{1,2}[A-Z]/.test(inputValue)) {
        // Check for valid band letter (C-X, excluding I and O)
        const bandMatch = inputValue.match(/^\d{1,2}([A-Z])/);
        if (bandMatch && ['I', 'O'].includes(bandMatch[1])) {
          // Don't update if they're typing an invalid band letter
          return;
        }
      }
    }
    
    // Limit length to reasonable MGRS size (max 15 chars for full format like 32UPU1234567890)
    if (inputValue.length > 15) {
      inputValue = inputValue.substring(0, 15);
    }

    onChange(inputValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const clearInput = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const getValidationIcon = () => {
    if (validation.isValid === null) return null;
    if (validation.isValid) {
      return <i className="fas fa-check-circle text-green-500"></i>;
    }
    return <i className="fas fa-exclamation-triangle text-red-500"></i>;
  };

  const getInputClasses = () => {
    let classes = "w-full px-3 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-mono text-sm text-gray-900 ";
    
    if (disabled) {
      classes += "bg-gray-100 cursor-not-allowed ";
    } else if (validation.isValid === true) {
      classes += "border-green-300 focus:border-green-500 bg-green-50 ";
    } else if (validation.isValid === false) {
      classes += "border-red-300 focus:border-red-500 bg-red-50 ";
    } else if (isFocused) {
      classes += "border-blue-300 focus:border-blue-500 bg-blue-50 ";
    } else {
      classes += "border-gray-300 focus:border-blue-500 ";
    }
    
    return classes;
  };

  // Progressive validation helper
  const validateMGRSProgressively = (input: string): ValidationState => {
    if (!input.trim()) {
      return { isValid: null };
    }

    const cleanInput = input.replace(/\s/g, '').toUpperCase();
    
    // Stage 1: Character validation
    if (!/^[0-9A-Z]*$/.test(cleanInput)) {
      return {
        isValid: false,
        error: 'Only numbers and letters allowed',
        progress: 10
      };
    }

    // Stage 2: Length checks
    if (cleanInput.length < 6) {
      const progress = Math.min((cleanInput.length / 6) * 40, 40);
      let hint = `Need ${6 - cleanInput.length} more characters (minimum 6 digits)`;
      
      // Provide context-specific hints
      if (cleanInput.length === 1) {
        hint = 'Keep typing... MGRS needs 6-10 digits or full format';
      } else if (cleanInput.length <= 2 && /^\d+$/.test(cleanInput)) {
        hint = 'Good start! Continue with easting coordinates...';
      } else if (cleanInput.length === 3 && /^\d+$/.test(cleanInput)) {
        hint = 'Halfway there! Add northing coordinates...';
      }
      
      return {
        isValid: false,
        hint,
        progress
      };
    }

    // Stage 3: Format detection
    const isCoordOnly = /^\d+$/.test(cleanInput);
    const isFullMGRS = /^\d{1,2}[A-Z]{3}\d+$/.test(cleanInput);

    if (!isCoordOnly && !isFullMGRS) {
      // Try to provide helpful guidance
      if (/^\d+[A-Z]/.test(cleanInput)) {
        return {
          isValid: false,
          error: 'Invalid format - need zone + band + square (e.g., 32UPU) or numbers only',
          progress: 50
        };
      }
      return {
        isValid: false,
        error: 'Invalid format - use numbers only or full MGRS (e.g., 32UPU123456)',
        progress: 30
      };
    }

    // Stage 4: Coordinate validation
    if (isCoordOnly) {
      if (cleanInput.length % 2 !== 0) {
        return {
          isValid: false,
          error: 'Coordinate digits must be even (6, 8, or 10 digits)',
          progress: 60
        };
      }

      const coordLength = cleanInput.length / 2;
      if (coordLength < 3 || coordLength > 5) {
        return {
          isValid: false,
          error: 'Coordinates must be 6, 8, or 10 digits total',
          progress: 70
        };
      }

      // Determine precision
      let precision = '';
      if (coordLength === 3) precision = '100m precision';
      else if (coordLength === 4) precision = '10m precision';
      else if (coordLength === 5) precision = '1m precision';

      return {
        isValid: true,
        precision,
        progress: 100
      };
    }

    // Stage 5: Full MGRS validation
    try {
      MGRSService.normalizeGrid(cleanInput);
      return {
        isValid: true,
        precision: 'Full MGRS format',
        progress: 100
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid MGRS format',
        progress: 80
      };
    }
  };

  const formatDisplayValue = (val: string) => {
    if (!val) return val;
    
    // Add spaces for readability in coordinate-only format
    if (/^\d+$/.test(val) && val.length >= 6) {
      const halfLength = Math.floor(val.length / 2);
      return val.substring(0, halfLength) + ' ' + val.substring(halfLength);
    }
    
    // Add spaces for full MGRS format
    if (/^\d{1,2}[A-Z]{3}\d+$/.test(val)) {
      const match = val.match(/^(\d{1,2})([A-Z])([A-Z]{2})(\d+)$/);
      if (match) {
        const [, zone, band, square, coords] = match;
        if (coords.length >= 6) {
          const halfLength = Math.floor(coords.length / 2);
          const easting = coords.substring(0, halfLength);
          const northing = coords.substring(halfLength);
          return `${zone}${band} ${square} ${easting} ${northing}`;
        }
      }
    }
    
    return val;
  };

  const renderMGRSBreakdown = (input: string) => {
    if (!input) return null;
    
    const cleanInput = input.replace(/\s/g, '').toUpperCase();
    
    // For coordinate-only format
    if (/^\d+$/.test(cleanInput)) {
      if (cleanInput.length < 6) {
        return (
          <span>
            <span className="bg-blue-100 px-1 rounded">{cleanInput}</span>
            <span className="text-gray-400"> (need {6 - cleanInput.length} more)</span>
          </span>
        );
      }
      
      const halfLength = Math.floor(cleanInput.length / 2);
      const easting = cleanInput.substring(0, halfLength);
      const northing = cleanInput.substring(halfLength);
      
      return (
        <span>
          <span className="bg-green-100 px-1 rounded mr-1" title="Easting">{easting}</span>
          <span className="bg-blue-100 px-1 rounded" title="Northing">{northing}</span>
        </span>
      );
    }
    
    // For full MGRS format
    const match = cleanInput.match(/^(\d{1,2})([A-Z]?)([A-Z]{0,2})(\d*)$/);
    if (match) {
      const [, zone, band, square, coords] = match;
      
      return (
        <span>
          {zone && <span className="bg-purple-100 px-1 rounded mr-1" title="UTM Zone">{zone}</span>}
          {band && <span className="bg-orange-100 px-1 rounded mr-1" title="Latitude Band">{band}</span>}
          {square && <span className="bg-yellow-100 px-1 rounded mr-1" title="Grid Square">{square}</span>}
          {coords && coords.length > 0 && (
            <>
              {coords.length >= coords.length / 2 && (
                <span className="bg-green-100 px-1 rounded mr-1" title="Easting">
                  {coords.substring(0, Math.floor(coords.length / 2))}
                </span>
              )}
              {coords.length > coords.length / 2 && (
                <span className="bg-blue-100 px-1 rounded" title="Northing">
                  {coords.substring(Math.floor(coords.length / 2))}
                </span>
              )}
            </>
          )}
        </span>
      );
    }
    
    return <span className="text-red-400">{cleanInput} (unrecognized format)</span>;
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">
          {icon && <span className="mr-2">{icon}</span>}
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          <i className="fas fa-info-circle mr-1"></i>
          Help
        </button>
      </div>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={getInputClasses()}
          autoComplete="off"
          spellCheck={false}
        />
        
        {/* Right side icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={clearInput}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear input"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          )}
          {getValidationIcon()}
        </div>
      </div>

      {/* Progress indicator */}
      {validation.progress !== undefined && validation.progress > 0 && (
        <div className="mt-1">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  validation.isValid ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${validation.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{validation.progress}%</span>
          </div>
        </div>
      )}

      {/* Visual breakdown for learning */}
      {value && isFocused && !validation.isValid && (
        <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
          <div className="font-medium text-gray-700 mb-1">Format Breakdown:</div>
          <div className="font-mono text-gray-600">
            {renderMGRSBreakdown(value)}
          </div>
        </div>
      )}

      {/* Formatted display */}
      {value && validation.isValid && (
        <div className="mt-1 text-xs text-gray-600">
          <span className="font-medium">Formatted:</span> {formatDisplayValue(value)}
          {validation.precision && (
            <span className="ml-2 text-green-600">({validation.precision})</span>
          )}
        </div>
      )}

      {/* Error/hint message */}
      {(validation.error || validation.hint) && (
        <div className={`mt-1 text-xs ${validation.error ? 'text-red-600' : 'text-blue-600'}`}>
          <i className={`fas ${validation.error ? 'fa-exclamation-triangle' : 'fa-info-circle'} mr-1`}></i>
          {validation.error || validation.hint}
        </div>
      )}

      {/* Help text with examples */}
      {showHelp && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
          <div className="font-medium text-blue-800 mb-2">MGRS Format Examples:</div>
          <div className="space-y-1 text-blue-700">
            <div><strong>6-digit:</strong> 123456 (100m precision)</div>
            <div><strong>8-digit:</strong> 12345678 (10m precision)</div>
            <div><strong>10-digit:</strong> 1234567890 (1m precision)</div>
            <div><strong>Full format:</strong> 32UPU1234567890</div>
          </div>
          <div className="mt-2 text-blue-600">
            <strong>Tip:</strong> For this app, coordinate-only format (numbers only) works best.
          </div>
          
          {/* Quick example buttons */}
          <div className="mt-3 border-t border-blue-200 pt-2">
            <div className="text-blue-800 font-medium mb-1">Try these examples:</div>
            <div className="flex flex-wrap gap-1">
              {[
                { label: '6-digit', value: '123456' },
                { label: '8-digit', value: '12345678' },
                { label: '10-digit', value: '1234567890' },
                { label: 'Full MGRS', value: '32UPU1234567890' }
              ].map((example) => (
                <button
                  key={example.value}
                  type="button"
                  onClick={() => {
                    onChange(example.value);
                    inputRef.current?.focus();
                  }}
                  className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs transition-colors"
                  disabled={disabled}
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced validation helper for external use
export function validateMGRSInput(value: string): { isValid: boolean; error?: string; precision?: string } {
  if (!value.trim()) {
    return { isValid: false, error: 'MGRS coordinate is required' };
  }

  try {
    MGRSService.normalizeGrid(value);
    
    // Determine precision
    let precision = '';
    const cleanValue = value.replace(/\s/g, '').toUpperCase();
    
    if (/^\d+$/.test(cleanValue)) {
      const coordLength = cleanValue.length / 2;
      if (coordLength === 3) precision = '100m precision';
      else if (coordLength === 4) precision = '10m precision';
      else if (coordLength === 5) precision = '1m precision';
    } else {
      precision = 'Full MGRS format';
    }
    
    return { isValid: true, precision };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Invalid MGRS format' 
    };
  }
}
