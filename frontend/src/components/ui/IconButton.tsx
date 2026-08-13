import type { ReactNode } from 'react'
import { Button, type ButtonVariant } from './Button'

interface IconButtonProps {
  label: string
  onClick?: () => void
  variant?: ButtonVariant
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
  children: ReactNode
}

export function IconButton({
  label,
  onClick,
  variant = 'ghost',
  disabled,
  size = 'md',
  className = '',
  children,
}: IconButtonProps) {
  const padding = size === 'sm' ? 'p-1.5' : 'p-2'
  return (
    <Button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      variant={variant}
      disabled={disabled}
      className={`rounded-full ${padding} ${className}`}
    >
      {children}
    </Button>
  )
}
