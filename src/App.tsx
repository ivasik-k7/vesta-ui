const PROGRAMS = [
  {
    name: 'vesta_core',
    id: 'Am2X4B1SCnJKXL8Yir2j6yGpHAKrmwcf2E5aKnA9BZV',
  },
  {
    name: 'argus',
    id: 'CrzLCMSQ1pWTuLXBomoLn6eAB1c1gLsw5x9sBeuyBNKt',
  },
]

function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 p-8 text-stone-100">
      <div className="max-w-xl space-y-6 text-center">
        <div className="text-6xl" role="img" aria-label="flame">
          🔥
        </div>
        <h1 className="text-5xl font-bold tracking-tight">VESTA</h1>
        <p className="text-lg text-stone-400">
          Living loyalty on Solana — points that stay alive while customers keep the flame
          burning. Customer app and merchant dashboard are on the way.
        </p>
        <ul className="space-y-2 text-sm text-stone-500">
          {PROGRAMS.map((p) => (
            <li key={p.id}>
              <a
                className="underline decoration-stone-700 underline-offset-4 hover:text-stone-300"
                href={`https://explorer.solana.com/address/${p.id}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
              >
                {p.name} · devnet
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

export default App
