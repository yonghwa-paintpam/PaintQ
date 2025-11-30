'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  }[size];

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses} border-gray-200 border-t-blue-600 rounded-full animate-spin`}
      />
      {text && <p className={`text-gray-700 font-medium ${textSizeClasses}`}>{text}</p>}
    </div>
  );
}

