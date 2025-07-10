interface FDCLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FDCLogo({ 
  size = 24, 
  className = '', 
  showText = true, 
  textSize = 'md' 
}: FDCLogoProps) {
  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg', 
    xl: 'text-xl'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* FDC Crosshair Icon */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Background */}
        <rect width="32" height="32" fill="#2563eb" rx="4"/>
        
        {/* Simplified crosshairs for small size */}
        <circle cx="16" cy="16" r="12" stroke="white" strokeWidth="1.5" fill="none"/>
        <circle cx="16" cy="16" r="6" stroke="white" strokeWidth="1" fill="none"/>
        
        {/* Center dot */}
        <circle cx="16" cy="16" r="1.5" fill="white"/>
        
        {/* Crosshair lines */}
        <line x1="16" y1="2" x2="16" y2="10" stroke="white" strokeWidth="1"/>
        <line x1="16" y1="22" x2="16" y2="30" stroke="white" strokeWidth="1"/>
        <line x1="2" y1="16" x2="10" y2="16" stroke="white" strokeWidth="1"/>
        <line x1="22" y1="16" x2="30" y2="16" stroke="white" strokeWidth="1"/>
      </svg>
      
      {/* Text */}
      {showText && (
        <span className={`font-bold text-gray-900 ${textClasses[textSize]}`}>
          Fire Direction Center
        </span>
      )}
    </div>
  );
}

export function FDCIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return <FDCLogo size={size} className={className} showText={false} />;
}
