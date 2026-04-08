import { useState, useEffect, useRef } from 'react'
import { Brain, FileSearch, UserCheck, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

const STAGES = [
  { id: 'reading', label: 'Reading document', icon: FileSearch, weight: 10 },
  { id: 'ocr', label: 'Extracting text (OCR)', icon: FileSearch, weight: 30 },
  { id: 'ai', label: 'AI medical analysis', icon: Brain, weight: 45 },
  { id: 'matching', label: 'Matching specialist', icon: UserCheck, weight: 15 },
]

const STAGE_ENDS = STAGES.reduce((acc, s, i) => {
  acc.push((i === 0 ? 0 : acc[i - 1]) + s.weight)
  return acc
}, [])

const TOTAL_MS = 30_000
const STALL_AT = 90
const TICK_MS = 400

const calcProgress = (elapsedMs) =>
  Math.min(Math.round((elapsedMs / TOTAL_MS) * 100 * 10) / 10, STALL_AT)

const calcStage = (pct) => {
  for (let i = 0; i < STAGE_ENDS.length; i++) {
    if (pct < STAGE_ENDS[i]) return i
  }
  return STAGES.length - 1
}


export default function AnalysisProgressCard({ status, uploadedAt }) {
  const getElapsed = () =>
    uploadedAt ? Date.now() - new Date(uploadedAt).getTime() : 0

  const [progress, setProgress] = useState(() => calcProgress(getElapsed()))
  const [stageIdx, setStageIdx] = useState(() => calcStage(calcProgress(getElapsed())))
  const [done, setDone] = useState(status === 'ANALYZED')
  const [failed, setFailed] = useState(status === 'FAILED')
  const timerRef = useRef(null)

  useEffect(() => {
    if (status === 'ANALYZED') {
      clearInterval(timerRef.current)
      timerRef.current = null
      setProgress(100)
      setStageIdx(STAGES.length - 1)
      setDone(true)
      return
    }

    if (status === 'FAILED') {
      clearInterval(timerRef.current)
      timerRef.current = null
      setFailed(true)
      return
    }

    if (timerRef.current) return

    timerRef.current = setInterval(() => {
      const p = calcProgress(getElapsed())
      setProgress(p)
      setStageIdx(calcStage(p))
    }, TICK_MS)

    return () => {
    }
  }, [status])

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  
  if (failed) {
    return (
      <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-800">Analysis failed</p>
          <p className="text-xs text-red-600 mt-0.5">
            We couldn't process this report. Please try re-uploading or contact support.
          </p>
        </div>
      </div>
    )
  }

  
  if (done) {
    return (
      <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-green-800">Analysis complete</p>
          <p className="text-xs text-green-600 mt-0.5">
            Your report has been fully analysed. View details below.
          </p>
        </div>
      </div>
    )
  }

  
  const currentStage = STAGES[stageIdx]
  const StageIcon = currentStage.icon
  const isStalled = progress >= STALL_AT

  return (
    <div className="mt-3 p-4 bg-blue-50/60 border border-blue-200/70 rounded-xl space-y-3">

      {}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          {isStalled
            ? <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            : <StageIcon className="w-4 h-4 text-blue-600 animate-pulse" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-blue-900 truncate">
            {isStalled ? 'Finalising results…' : `${currentStage.label}…`}
          </p>
          <p className="text-xs text-blue-500">
            {isStalled
              ? 'Almost done — page will update automatically'
              : 'AI analysis in progress — page updates automatically'}
          </p>
        </div>
        <span className="text-sm font-bold text-blue-700 tabular-nums shrink-0">
          {Math.round(progress)}%
        </span>
      </div>

      {}
      <div className="relative h-2.5 bg-blue-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
      </div>

      {}
      <div className="flex items-center justify-between gap-1 pt-1">
        {STAGES.map((s, i) => {
          const SIcon = s.icon
          const isActive = i === stageIdx && !isStalled
          const isDone = i < stageIdx || progress >= 100
          return (
            <div key={s.id} className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${isDone
                  ? 'bg-blue-500 text-white'
                  : isActive
                    ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-400 ring-offset-1'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                {isDone
                  ? <CheckCircle className="w-3.5 h-3.5" />
                  : <SIcon className={`w-3 h-3 ${isActive ? 'animate-pulse' : ''}`} />
                }
              </div>
              <span className={`text-[10px] text-center leading-tight hidden sm:block ${isActive ? 'text-blue-700 font-semibold'
                  : isDone ? 'text-blue-500'
                    : 'text-gray-400'
                }`}>
                {s.label.split(' ').slice(0, 2).join(' ')}
              </span>
            </div>
          )
        })}
      </div>



      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
