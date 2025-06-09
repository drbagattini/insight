import Link from 'next/link';

interface InsightLogoProps {
  className?: string;
  withText?: boolean;
  textSize?: 'sm' | 'md' | 'lg';
}

export default function InsightLogo({ 
  className = '', 
  withText = true, 
  textSize = 'md' 
}: InsightLogoProps) {
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <Link href="/" className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">
          i
        </div>
        {withText && (
          <span className={`font-semibold text-gray-900 ${textSizeClasses[textSize]}`}>
            Insight
          </span>
        )}
    </Link>
  );
}
