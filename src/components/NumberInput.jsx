export default function NumberInput({ label, value, onChange, unit, min = 0, step = 5, color = 'text-white', compact = false }) {
  function decrement() {
    onChange(Math.max(min, value - step))
  }
  function increment() {
    onChange(value + step)
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${color}`}>{label}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={decrement}
            className="w-7 h-7 rounded-full bg-surface-light flex items-center justify-center text-slate-300 hover:bg-slate-600 active:scale-90 transition"
          >
            -
          </button>
          <span className="w-12 text-center text-sm font-mono font-semibold">
            {value}
            {unit && <span className="text-xs text-slate-500 ml-0.5">{unit}</span>}
          </span>
          <button
            onClick={increment}
            className="w-7 h-7 rounded-full bg-surface-light flex items-center justify-center text-slate-300 hover:bg-slate-600 active:scale-90 transition"
          >
            +
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm font-medium ${color}`}>{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={decrement}
          className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-slate-300 border border-surface-light hover:bg-surface-light active:scale-90 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
          </svg>
        </button>
        <span className="w-16 text-center text-lg font-mono font-bold">
          {value}
          {unit && <span className="text-sm text-slate-500 ml-1">{unit}</span>}
        </span>
        <button
          onClick={increment}
          className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-slate-300 border border-surface-light hover:bg-surface-light active:scale-90 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}
