import type { HTMLAttributes, ReactNode } from 'react';

interface RetroCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  icon?: ReactNode;
  right?: ReactNode;
  accent?: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'orange';
  decoration?: 'tape' | 'tack';
}

export function RetroCard({
  title,
  icon,
  right,
  accent,
  decoration,
  className = '',
  children,
  ...rest
}: RetroCardProps) {
  const accentMap = {
    green: 'border-t-retro-green',
    yellow: 'border-t-retro-yellow',
    red: 'border-t-retro-red',
    blue: 'border-t-retro-blue',
    purple: 'border-t-retro-purple',
    orange: 'border-t-retro-orange',
  } as const;
  return (
    <div
      className={`retro-card ${decoration ? `retro-card--${decoration}` : ''} border-t-[3px] ${accent ? accentMap[accent] : 'border-t-retro-border'} ${className}`}
      {...rest}
    >
      {(title || right) && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-retro-border/70">
          <div className="flex items-center gap-2">
            {icon && (
              <span className="text-retro-text-dim text-[15px]">{icon}</span>
            )}
            {title && (
              <h3 className="text-[13px] text-retro-text font-semibold tracking-wide">
                {title}
              </h3>
            )}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}
