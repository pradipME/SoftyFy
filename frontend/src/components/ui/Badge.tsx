import type { ReactNode } from 'react'

type Tone = 'neutral' | 'accent' | 'success' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'bg-elevated text-muted border-line',
  accent: 'bg-accent/15 text-accent-strong border-accent/30',
  success: 'bg-success/15 text-success border-success/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
}

interface BadgeProps {
  tone?: Tone
  children: ReactNode
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  )
}
