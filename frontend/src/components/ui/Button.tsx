import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-strong active:bg-accent disabled:bg-accent/50',
  secondary:
    'border border-line bg-elevated text-fg hover:border-accent/40 hover:bg-elevated-hover disabled:opacity-50',
  ghost: 'text-muted hover:text-fg hover:bg-elevated disabled:opacity-50',
  danger:
    'border border-line bg-elevated text-danger hover:border-danger/50 hover:bg-danger/10 disabled:opacity-50',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    />
  )
}
