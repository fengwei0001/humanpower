interface Props {
  data: number[]
  className?: string
}

const COLORS = [
  'bg-gray-100',         // 0 - no activity
  'bg-brand-green/20',   // 1 - low
  'bg-brand-green/40',   // 2 - medium
  'bg-brand-green/70',   // 3 - high
  'bg-brand-green',      // 4 - very high
]

export default function HeatMap({ data, className = '' }: Props) {
  // 52 weeks × 7 days grid
  const weeks = 52
  const days = 7

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="flex gap-[3px] overflow-x-auto">
        {Array.from({ length: weeks }, (_, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-[3px]">
            {Array.from({ length: days }, (_, dayIdx) => {
              const idx = weekIdx * 7 + dayIdx
              const level = data[idx] || 0
              return (
                <div
                  key={dayIdx}
                  className={`heatmap-cell ${COLORS[level]}`}
                  title={`第 ${weekIdx + 1} 周 · 活跃度 ${level}`}
                />
              )
            })}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[11px] text-text-tertiary">
        <span>少</span>
        {COLORS.map((color, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
        ))}
        <span>多</span>
      </div>
    </div>
  )
}
