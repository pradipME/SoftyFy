import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  size?: 'sm' | 'md'
  /** Lights the button up in the accent green to show an active toggle state. */
  active?: boolean
  children: ReactNode
}

export function IconButton({
  label,
  size = 'md',
  active = false,
  className = '',
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const sizes = size === 'sm' ? 'h-8 w-8' : 'h-11 w-11'
  const stateClass = active
    ? 'bg-accent/15 text-accent ring-1 ring-accent/30 shadow-[0_0_14px_rgba(29,185,84,0.35)] hover:bg-accent/25 hover:text-accent'
    : 'hover:text-fg'
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40 ${stateClass} ${sizes} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
