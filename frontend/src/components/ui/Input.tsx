import { forwardRef, type InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = '', id, ...rest },
  ref,
) {
  const inputId = id ?? (label ? `input-${label}` : undefined)
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-muted">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-lg border bg-elevated px-3 py-2 text-sm text-fg placeholder:text-dim focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${error ? 'border-danger' : 'border-line'} ${className}`}
        {...rest}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  )
})
