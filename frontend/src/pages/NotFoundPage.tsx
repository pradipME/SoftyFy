import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-6xl font-bold text-accent-strong">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted">The page you are looking for does not exist.</p>
      <Link to="/">
        <Button variant="secondary" className="mt-2">
          Go home
        </Button>
      </Link>
    </div>
  )
}
