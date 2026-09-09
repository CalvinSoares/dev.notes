import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'default' | 'primary' | 'ghost';

interface RetroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

export function RetroButton({
  variant = 'default',
  icon,
  children,
  className = '',
  ...rest
}: RetroButtonProps) {
  const base = 'retro-btn';
  const variants: Record<Variant, string> = {
    default: 'retro-btn--default',
    primary: 'retro-btn--primary',
    ghost: 'retro-btn--ghost',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
