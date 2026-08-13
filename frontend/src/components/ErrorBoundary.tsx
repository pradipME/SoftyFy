import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './ui/Button'

interface ErrorBoundaryProps {
  children: ReactNode
  resetKey?: string
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('SoftyFy render error:', error, info.componentStack)
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  override render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <p className="text-6xl font-bold text-accent-strong">Oops</p>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted">
          An unexpected error interrupted this view. Your music is safe — reload the page to get
          back to it.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Link to="/">
            <Button variant="secondary">Go home</Button>
          </Link>
        </div>
      </div>
    )
  }
}
