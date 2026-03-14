const STORAGE_KEY = 'training-timers-workouts'

export function loadWorkouts() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveWorkouts(workouts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function createDefaultWorkout() {
  return {
    id: generateId(),
    name: '',
    prepare: 10,
    sets: [
      {
        id: generateId(),
        exercises: [
          { id: generateId(), name: 'Exercise', work: 20, rest: 10 },
        ],
        cycles: 8,
      },
    ],
    restBetweenSets: 60,
    coolDown: 0,
  }
}

export function computeWorkoutStats(workout) {
  let totalTime = workout.prepare
  let totalIntervals = 1 // prepare

  for (let si = 0; si < workout.sets.length; si++) {
    const set = workout.sets[si]
    for (let c = 0; c < set.cycles; c++) {
      for (let ei = 0; ei < set.exercises.length; ei++) {
        const ex = set.exercises[ei]
        totalTime += ex.work
        totalIntervals++
        // rest after exercise, except after last exercise of last cycle
        const isLastExOfLastCycle = c === set.cycles - 1 && ei === set.exercises.length - 1
        if (!isLastExOfLastCycle) {
          totalTime += ex.rest
          totalIntervals++
        }
      }
    }
    // rest between sets (not after last set)
    if (si < workout.sets.length - 1) {
      totalTime += workout.restBetweenSets
      totalIntervals++
    }
  }

  if (workout.coolDown > 0) {
    totalTime += workout.coolDown
    totalIntervals++
  }

  return { totalTime, totalIntervals }
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function buildTimeline(workout) {
  const steps = []

  if (workout.prepare > 0) {
    steps.push({ type: 'prepare', label: 'Prepare', duration: workout.prepare })
  }

  for (let si = 0; si < workout.sets.length; si++) {
    const set = workout.sets[si]
    for (let c = 0; c < set.cycles; c++) {
      for (let ei = 0; ei < set.exercises.length; ei++) {
        const ex = set.exercises[ei]
        steps.push({
          type: 'work',
          label: ex.name || 'Work',
          duration: ex.work,
          set: si + 1,
          cycle: c + 1,
          totalCycles: set.cycles,
        })
        const isLastExOfLastCycle = c === set.cycles - 1 && ei === set.exercises.length - 1
        if (!isLastExOfLastCycle && ex.rest > 0) {
          steps.push({
            type: 'rest',
            label: 'Rest',
            duration: ex.rest,
            set: si + 1,
            cycle: c + 1,
            totalCycles: set.cycles,
          })
        }
      }
    }
    if (si < workout.sets.length - 1 && workout.restBetweenSets > 0) {
      steps.push({
        type: 'rest-sets',
        label: 'Rest between sets',
        duration: workout.restBetweenSets,
      })
    }
  }

  if (workout.coolDown > 0) {
    steps.push({ type: 'prepare', label: 'Cool down', duration: workout.coolDown })
  }

  return steps
}
