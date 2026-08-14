import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  size?: 'sm' | 'md'
  children: ReactNode
}

export function IconButton({
  label,
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const sizes = size === 'sm' ? 'h-8 w-8' : 'h-11 w-11'
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40 ${sizes} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
