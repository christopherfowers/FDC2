import { useState } from 'react';

export interface ElevationInputProps {
  value: number | undefined;
  onChange: (elevation: number | undefined) => void;
  label: string;
  placeholder?: string;
  icon?: string;
  helpText?: string;
  disabled?: boolean;
  className?: string;
}

export function ElevationInput({
  value,
  onChange,
  label,
  placeholder = "e.g., 150 (meters)",
  icon = "fa-mountain",
  helpText,
  disabled = false,
  className = ""
}: ElevationInputProps) {
  const [showHelp, setShowHelp] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val === '') {
      onChange(undefined);
      return;
    }

    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleClear = () => {
    onChange(undefined);
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {icon && <i className={`fas ${icon} mr-2 text-gray-600`}></i>}
        {label}
        {helpText && (
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="ml-2 text-blue-600 hover:text-blue-800"
          >
            <i className="fas fa-info-circle text-sm"></i>
          </button>
        )}
      </label>

      {showHelp && helpText && (
        <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-gray-700">
          <i className="fas fa-info-circle text-blue-600 mr-2"></i>
          {helpText}
        </div>
      )}

      <div className="relative">
        <input
          type="number"
          value={value ?? ''}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          step="1"
          min="-500"
          max="9000"
          className={`
            w-full px-4 py-2 pr-20
            border border-gray-300 rounded-md
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            text-gray-900
            ${value !== undefined ? 'bg-blue-50' : ''}
          `}
        />
        
        {/* Units label */}
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
          meters
        </div>

        {/* Clear button */}
        {value !== undefined && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Clear elevation"
          >
            <i className="fas fa-times-circle"></i>
          </button>
        )}
      </div>

      {value !== undefined && (
        <div className="mt-1 text-xs text-gray-600">
          <i className="fas fa-mountain text-green-600 mr-1"></i>
          Elevation: {value}m above sea level
          {value < 0 && ' (below sea level)'}
        </div>
      )}

      {!value && (
        <div className="mt-1 text-xs text-gray-500">
          <i className="fas fa-info-circle mr-1"></i>
          Optional: Leave blank for flat terrain
        </div>
      )}
    </div>
  );
}
