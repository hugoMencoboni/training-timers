import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadWorkouts, saveWorkouts, computeWorkoutStats, formatTime } from '../utils/storage'

export default function Home() {
  const [workouts, setWorkouts] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    setWorkouts(loadWorkouts())
  }, [])

  function handleDelete(id) {
    if (!confirm('Delete this workout?')) return
    const updated = workouts.filter((w) => w.id !== id)
    saveWorkouts(updated)
    setWorkouts(updated)
  }

  function handleDuplicate(workout) {
    const copy = {
      ...JSON.parse(JSON.stringify(workout)),
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name: workout.name + ' (copy)',
    }
    const updated = [...workouts, copy]
    saveWorkouts(updated)
    setWorkouts(updated)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-surface border-b border-surface-light">
        <h1 className="text-xl font-bold tracking-tight">Training Timers</h1>
        <span className="text-sm text-slate-400">{workouts.length} workout{workouts.length !== 1 ? 's' : ''}</span>
      </header>

      {/* Workout list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {workouts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <svg className="w-16 h-16 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
            <p className="text-lg">No workouts yet</p>
            <p className="text-sm">Tap + to create your first timer</p>
          </div>
        )}

        {workouts.map((workout) => {
          const stats = computeWorkoutStats(workout)
          return (
            <div
              key={workout.id}
              className="bg-surface rounded-xl p-4 border border-surface-light active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0" onClick={() => navigate(`/edit/${workout.id}`)}>
                  <h2 className="font-semibold text-lg truncate">{workout.name || 'Untitled'}</h2>
                  <div className="flex gap-3 mt-1 text-sm text-slate-400">
                    <span>{formatTime(stats.totalTime)}</span>
                    <span>{stats.totalIntervals} intervals</span>
                    <span>
                      {workout.sets.length} set{workout.sets.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                    {workout.sets.map((set, i) => (
                      <div key={set.id}>
                        {workout.sets.length > 1 && <span>Set {i + 1}: </span>}
                        {set.exercises.map((ex) => ex.name || 'Exercise').join(', ')}
                        {' '}&middot; {set.cycles} cycle{set.cycles !== 1 ? 's' : ''}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => navigate(`/timer/${workout.id}`)}
                    className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary-dark transition-colors"
                    aria-label="Start"
                  >
                    <svg className="w-5 h-5 ml-0.5" fill="white" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDuplicate(workout)}
                      className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-300"
                      aria-label="Duplicate"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(workout.id)}
                      className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-danger"
                      aria-label="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* FAB */}
      <div className="p-4">
        <button
          onClick={() => navigate('/edit')}
          className="w-full py-3 bg-primary hover:bg-primary-dark rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Workout
        </button>
      </div>
    </div>
  )
}
