import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadWorkouts, buildTimeline, formatTime } from '../utils/storage'

const TYPE_COLORS = {
  prepare: 'bg-warning',
  work: 'bg-work',
  rest: 'bg-success',
  'rest-sets': 'bg-rest-sets',
}

const TYPE_BG = {
  prepare: 'from-amber-900/80 to-amber-950/90',
  work: 'from-red-900/80 to-red-950/90',
  rest: 'from-green-900/80 to-green-950/90',
  'rest-sets': 'from-violet-900/80 to-violet-950/90',
}

// beep using Web Audio API
function playBeep(frequency = 800, duration = 150, count = 1) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = frequency
      osc.type = 'square'
      gain.gain.value = 0.3
      const start = ctx.currentTime + i * 0.2
      osc.start(start)
      osc.stop(start + duration / 1000)
    }
  } catch {
    // silently fail if audio not available
  }
}

export default function Timer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [stepIndex, setStepIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef(null)
  const wakeLockRef = useRef(null)

  useEffect(() => {
    const workouts = loadWorkouts()
    const found = workouts.find((w) => w.id === id)
    if (!found) {
      navigate('/')
      return
    }
    setWorkout(found)
    const tl = buildTimeline(found)
    setTimeline(tl)
    if (tl.length > 0) {
      setTimeLeft(tl[0].duration)
    }
  }, [id, navigate])

  // Wake lock
  useEffect(() => {
    async function acquireWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        }
      } catch {}
    }
    acquireWakeLock()
    return () => {
      wakeLockRef.current?.release()
    }
  }, [])

  const goToStep = useCallback(
    (index) => {
      if (index < 0 || index >= timeline.length) return
      setStepIndex(index)
      setTimeLeft(timeline[index].duration)
      setFinished(false)
    },
    [timeline],
  )

  const nextStep = useCallback(() => {
    if (stepIndex < timeline.length - 1) {
      goToStep(stepIndex + 1)
      playBeep(900, 150, 2)
    } else {
      setRunning(false)
      setFinished(true)
      playBeep(600, 300, 3)
    }
  }, [stepIndex, timeline.length, goToStep])

  const prevStep = useCallback(() => {
    goToStep(stepIndex - 1)
  }, [stepIndex, goToStep])

  // Timer tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            nextStep()
            return 0
          }
          if (t <= 4) {
            playBeep(600, 80, 1)
          }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, nextStep])

  function toggleRunning() {
    if (finished) {
      // restart
      goToStep(0)
      setRunning(true)
      return
    }
    setRunning((r) => !r)
  }

  function handleClose() {
    setRunning(false)
    navigate('/')
  }

  if (!workout || timeline.length === 0) return null

  const step = timeline[stepIndex]
  const totalElapsed = timeline.slice(0, stepIndex).reduce((a, s) => a + s.duration, 0) + (step.duration - timeLeft)
  const totalDuration = timeline.reduce((a, s) => a + s.duration, 0)
  const progress = totalDuration > 0 ? totalElapsed / totalDuration : 0

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b ${TYPE_BG[step.type]} transition-all duration-500`}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3">
        <button onClick={handleClose} className="text-white/70 hover:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-white/60 text-sm font-medium">{workout.name}</span>
        <span className="text-white/60 text-sm font-mono">{formatTime(totalDuration - totalElapsed)}</span>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-white/10 mx-4 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/60 transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Main display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4">
        {/* Step type label */}
        <div className={`px-4 py-1 rounded-full text-sm font-semibold uppercase tracking-wider ${TYPE_COLORS[step.type]} text-white`}>
          {step.label}
          {step.cycle && ` (${step.cycle}/${step.totalCycles})`}
        </div>

        {/* Countdown */}
        <div className={`text-[8rem] leading-none font-black font-mono tabular-nums ${running ? '' : 'animate-pulse-glow'}`}>
          {timeLeft}
        </div>

        {/* Time in mm:ss */}
        <div className="text-white/50 text-lg font-mono">{formatTime(timeLeft)}</div>
      </div>

      {/* Upcoming steps */}
      <div className="px-4 pb-2 space-y-1 max-h-40 overflow-y-auto">
        {timeline.slice(stepIndex + 1, stepIndex + 5).map((s, i) => (
          <div
            key={stepIndex + 1 + i}
            className="flex items-center gap-2 text-white/40 text-sm py-1"
            style={{ opacity: 1 - i * 0.2 }}
          >
            <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[s.type]}`} />
            <span className="flex-1 truncate">
              {stepIndex + 2 + i}. {s.label}
              {s.cycle && ` (${s.cycle}/${s.totalCycles})`}
            </span>
            <span className="font-mono">{s.duration}s</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-6 py-5 bg-black/20">
        <button
          onClick={prevStep}
          disabled={stepIndex === 0}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30 hover:bg-white/20 active:scale-90 transition"
        >
          <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        <button
          onClick={toggleRunning}
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          {finished ? (
            <svg className="w-8 h-8 text-background" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          ) : running ? (
            <svg className="w-8 h-8 text-background" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-background ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={nextStep}
          disabled={stepIndex >= timeline.length - 1}
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30 hover:bg-white/20 active:scale-90 transition"
        >
          <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>

      {/* Step counter */}
      <div className="text-center pb-4 text-white/40 text-sm">
        {stepIndex + 1} / {timeline.length}
      </div>
    </div>
  )
}
