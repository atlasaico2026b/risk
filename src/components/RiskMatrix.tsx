import { cn } from '@/lib/cn'
import { levelKey, LEVELS, type RiskReport } from '@/lib/risk'

const CELL_BG: Record<string, string> = {
  low: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900',
  medium: 'bg-amber-100 hover:bg-amber-200 text-amber-900',
  high: 'bg-orange-200 hover:bg-orange-300 text-orange-900',
  critical: 'bg-red-300 hover:bg-red-400 text-red-950',
}

export function RiskMatrix({
  reports,
  onSelectCell,
  activeCell,
}: {
  reports: RiskReport[]
  onSelectCell?: (cell: { probability: number; impact: number } | null) => void
  activeCell?: { probability: number; impact: number } | null
}) {
  const counts = new Map<string, number>()
  for (const r of reports) {
    const key = `${r.probability}-${r.impact}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex w-5 items-center justify-center">
          <span className="rotate-180 text-[10px] font-medium text-slate-500 [writing-mode:vertical-rl]">
            شدت پیامد
          </span>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((impact) => (
            <div key={impact} className="flex items-center gap-1">
              <span className="w-4 text-center text-[10px] font-semibold text-slate-400">{impact}</span>
              <div className="grid flex-1 grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((probability) => {
                  const score = probability * impact
                  const key = levelKey(score)
                  const count = counts.get(`${probability}-${impact}`) ?? 0
                  const active =
                    activeCell?.probability === probability && activeCell?.impact === impact
                  return (
                    <button
                      key={probability}
                      type="button"
                      onClick={() =>
                        onSelectCell?.(active ? null : { probability, impact })
                      }
                      title={`احتمال ${probability} × شدت ${impact} = ${score} (${LEVELS[key].label})`}
                      className={cn(
                        'flex h-9 items-center justify-center rounded-md text-xs font-bold transition-all',
                        CELL_BG[key],
                        count === 0 && 'opacity-45',
                        active && 'ring-2 ring-slate-900 ring-offset-1',
                      )}
                    >
                      {count > 0 ? count : ''}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-1 pt-1">
            <span className="w-4" />
            <div className="grid flex-1 grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map((p) => (
                <span key={p} className="text-center text-[10px] font-semibold text-slate-400">
                  {p}
                </span>
              ))}
            </div>
          </div>
          <p className="pt-1 text-center text-[10px] font-medium text-slate-500">احتمال وقوع</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        {(['low', 'medium', 'high', 'critical'] as const).map((k) => (
          <span key={k} className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className={cn('h-2.5 w-2.5 rounded-sm', LEVELS[k].solid)} />
            {LEVELS[k].label}
          </span>
        ))}
      </div>
    </div>
  )
}
