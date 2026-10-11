import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  enabled?: boolean;
  align?: 'left' | 'center' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ children, text, enabled = true, align = 'center' }) => {
  if (!enabled) {
    return <>{children}</>;
  }

  const alignClasses = {
    left: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-0'
  };

  return (
    <div className="relative group">
      {children}
      <div className={`absolute bottom-full mb-2 w-max max-w-xs px-3 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 ${alignClasses[align]}`}>
        <div dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br />') }} />
        <div className={`absolute top-full border-4 border-transparent border-t-slate-900 dark:border-t-slate-800 ${align === 'center' ? 'left-1/2 -translate-x-1/2' : align === 'left' ? 'left-4' : 'right-4'}`}></div>
      </div>
    </div>
  );
};