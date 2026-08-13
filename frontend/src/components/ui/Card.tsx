import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className = '', ...rest }: CardProps) {
  return <div className={`surface-card ${className}`} {...rest} />
}
