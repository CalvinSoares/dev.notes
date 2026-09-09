import type { HTMLAttributes, ReactNode } from 'react';

type Tone = 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'orange' | 'default';

interface RetroBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: ReactNode;
  children?: ReactNode;
}

export function RetroBadge({
  tone = 'default',
  icon,
  children,
  className = '',
  ...rest
}: RetroBadgeProps) {
  const tones: Record<Tone, string> = {
    green: 'retro-badge-green',
    yellow: 'retro-badge-yellow',
    red: 'retro-badge-red',
    blue: 'retro-badge-blue',
    purple: 'retro-badge-purple',
    orange: 'retro-badge-orange',
    default: 'bg-retro-panel border-retro-border text-retro-text-dim',
  };
  return (
    <span className={`retro-badge ${tones[tone]} ${className}`} {...rest}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
}
