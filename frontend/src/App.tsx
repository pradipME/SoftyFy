function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
      <section className="max-w-md px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">SoftyFy</h1>
        <p className="mt-3 text-zinc-400">
          Your private personal music streaming app.
        </p>
        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm">
          <p className="text-zinc-300">Frontend foundation is running.</p>
          <p className="mt-1 break-all font-mono text-xs text-zinc-500">
            API base: {apiBaseUrl}
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
