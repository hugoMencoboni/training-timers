import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadWorkouts, saveWorkouts, createDefaultWorkout, generateId, computeWorkoutStats, formatTime } from '../utils/storage'
import NumberInput from '../components/NumberInput'

export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState(null)

  useEffect(() => {
    if (id) {
      const workouts = loadWorkouts()
      const found = workouts.find((w) => w.id === id)
      if (found) {
        setWorkout(found)
      } else {
        navigate('/')
      }
    } else {
      setWorkout(createDefaultWorkout())
    }
  }, [id, navigate])

  if (!workout) return null

  function save() {
    const workouts = loadWorkouts()
    const idx = workouts.findIndex((w) => w.id === workout.id)
    if (idx >= 0) {
      workouts[idx] = workout
    } else {
      workouts.push(workout)
    }
    saveWorkouts(workouts)
    navigate('/')
  }

  function update(patch) {
    setWorkout((w) => ({ ...w, ...patch }))
  }

  function updateSet(setIndex, patch) {
    setWorkout((w) => {
      const sets = [...w.sets]
      sets[setIndex] = { ...sets[setIndex], ...patch }
      return { ...w, sets }
    })
  }

  function updateExercise(setIndex, exIndex, patch) {
    setWorkout((w) => {
      const sets = [...w.sets]
      const exercises = [...sets[setIndex].exercises]
      exercises[exIndex] = { ...exercises[exIndex], ...patch }
      sets[setIndex] = { ...sets[setIndex], exercises }
      return { ...w, sets }
    })
  }

  function addExercise(setIndex) {
    setWorkout((w) => {
      const sets = [...w.sets]
      const exercises = [...sets[setIndex].exercises]
      const last = exercises[exercises.length - 1]
      exercises.push({ id: generateId(), name: '', work: last.work, rest: last.rest })
      sets[setIndex] = { ...sets[setIndex], exercises }
      return { ...w, sets }
    })
  }

  function removeExercise(setIndex, exIndex) {
    setWorkout((w) => {
      const sets = [...w.sets]
      const exercises = sets[setIndex].exercises.filter((_, i) => i !== exIndex)
      if (exercises.length === 0) return w
      sets[setIndex] = { ...sets[setIndex], exercises }
      return { ...w, sets }
    })
  }

  function addSet() {
    setWorkout((w) => ({
      ...w,
      sets: [
        ...w.sets,
        {
          id: generateId(),
          exercises: [{ id: generateId(), name: 'Exercise', work: 20, rest: 10 }],
          cycles: 8,
        },
      ],
    }))
  }

  function removeSet(setIndex) {
    setWorkout((w) => {
      if (w.sets.length <= 1) return w
      return { ...w, sets: w.sets.filter((_, i) => i !== setIndex) }
    })
  }

  const stats = computeWorkoutStats(workout)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-surface-light">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold flex-1">{id ? 'Edit' : 'New'} Workout</h1>
        <span className="text-xs text-slate-400">
          {formatTime(stats.totalTime)} &middot; {stats.totalIntervals} intervals
        </span>
      </header>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Workout name */}
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Workout name</label>
          <input
            type="text"
            value={workout.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Morning HIIT"
            className="w-full bg-surface border border-surface-light rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Prepare */}
        <NumberInput
          label="Prepare"
          value={workout.prepare}
          onChange={(v) => update({ prepare: v })}
          unit="sec"
          color="text-warning"
        />

        {/* Sets */}
        {workout.sets.map((set, si) => (
          <div key={set.id} className="bg-surface rounded-xl p-4 border border-surface-light space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-300">
                {workout.sets.length > 1 ? `Set ${si + 1}` : 'Exercises'}
              </h3>
              {workout.sets.length > 1 && (
                <button onClick={() => removeSet(si)} className="text-xs text-danger hover:text-red-300">
                  Remove set
                </button>
              )}
            </div>

            {/* Exercises in this set */}
            {set.exercises.map((ex, ei) => (
              <div key={ex.id} className="space-y-3 pb-3 border-b border-surface-light last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ex.name}
                    onChange={(e) => updateExercise(si, ei, { name: e.target.value })}
                    placeholder="Exercise name"
                    className="flex-1 bg-transparent border border-surface-light rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary"
                  />
                  {set.exercises.length > 1 && (
                    <button
                      onClick={() => removeExercise(si, ei)}
                      className="text-slate-500 hover:text-danger shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-work/10 border border-work/20 rounded-lg px-3 py-2">
                    <NumberInput
                      label="Work"
                      value={ex.work}
                      onChange={(v) => updateExercise(si, ei, { work: v })}
                      unit="sec"
                      min={1}
                      color="text-work"
                      compact
                    />
                  </div>
                  <div className="flex-1 bg-success/10 border border-success/20 rounded-lg px-3 py-2">
                    <NumberInput
                      label="Rest"
                      value={ex.rest}
                      onChange={(v) => updateExercise(si, ei, { rest: v })}
                      unit="sec"
                      color="text-rest"
                      compact
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => addExercise(si)}
              className="w-full py-1.5 text-sm text-primary hover:text-primary-dark border border-dashed border-surface-light rounded-lg"
            >
              + Add exercise
            </button>

            {/* Cycles */}
            <NumberInput
              label="Cycles"
              value={set.cycles}
              onChange={(v) => updateSet(si, { cycles: v })}
              min={1}
              step={1}
              compact
            />
          </div>
        ))}

        <button
          onClick={addSet}
          className="w-full py-2 text-sm text-primary hover:text-primary-dark border border-dashed border-surface-light rounded-xl"
        >
          + Add set
        </button>

        {/* Rest between sets */}
        {workout.sets.length > 1 && (
          <NumberInput
            label="Rest between sets"
            value={workout.restBetweenSets}
            onChange={(v) => update({ restBetweenSets: v })}
            unit="sec"
            color="text-rest-sets"
          />
        )}

        {/* Cool down */}
        <NumberInput
          label="Cool down"
          value={workout.coolDown}
          onChange={(v) => update({ coolDown: v })}
          unit="sec"
          color="text-prepare"
        />
      </div>

      {/* Save button */}
      <div className="p-4 bg-surface border-t border-surface-light">
        <button
          onClick={save}
          className="w-full py-3 bg-primary hover:bg-primary-dark rounded-xl font-semibold text-lg transition-colors"
        >
          Save Workout
        </button>
      </div>
    </div>
  )
}
