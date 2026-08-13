import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from './Button'

export interface DropdownItem {
  key: string
  label: string
  onSelect: () => void
  destructive?: boolean
}

interface DropdownProps {
  trigger: ReactNode
  triggerLabel: string
  items: DropdownItem[]
  align?: 'left' | 'right'
}

export function Dropdown({ trigger, triggerLabel, items, align = 'right' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex"
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          className={`absolute z-40 mt-1 min-w-40 rounded-xl border border-line bg-surface p-1 shadow-2xl ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-elevated-hover ${
                item.destructive ? 'text-danger' : 'text-fg'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function DropdownButton({ children }: { children: ReactNode }) {
  return <Button variant="secondary">{children}</Button>
}
