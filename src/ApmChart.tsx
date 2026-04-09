const MARGIN = { top: 16, right: 16, bottom: 28, left: 40 }
const W = 640
const H = 220
const INNER_W = W - MARGIN.left - MARGIN.right
const INNER_H = H - MARGIN.top - MARGIN.bottom

interface ApmChartProps {
  players: Array<{
    id: number
    name: string
    color: string
    actions: { timed: number[] }
  }>
  /** Tracking interval in ms (default 60 000). */
  trackingInterval: number
}

export default function ApmChart({ players, trackingInterval }: ApmChartProps) {
  const active = players.filter((p) => p.actions.timed.length > 0)
  if (active.length === 0) return null

  const minutes = trackingInterval / 60_000
  const maxLen = Math.max(...active.map((p) => p.actions.timed.length))
  const rawMax = Math.max(...active.flatMap((p) => p.actions.timed), 1)
  const yMax = Math.ceil(rawMax / 50) * 50

  // x: minute index 0‥maxLen-1 → 0‥INNER_W
  const xOf = (i: number) => (maxLen < 2 ? INNER_W / 2 : (i / (maxLen - 1)) * INNER_W)

  // y: APM 0‥yMax → INNER_H‥0 (top = high APM)
  const yOf = (apm: number) => INNER_H - (apm / yMax) * INNER_H

  const linePath = (timed: number[]) =>
    timed.map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ')

  // Y ticks: 0, 50, 100 … yMax
  const yTicks: number[] = []
  for (let v = 0; v <= yMax; v += 50) yTicks.push(v)

  // X ticks: every minute, but at most ~10 labels
  const xStep = Math.ceil(maxLen / 10) || 1
  const xTicks: number[] = []
  for (let i = 0; i < maxLen; i += xStep) xTicks.push(i)

  return (
    <div className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ maxWidth: W }}
        className="overflow-visible"
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Grid + Y labels */}
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={0} y1={yOf(v)} x2={INNER_W} y2={yOf(v)} stroke="#1e1e26" strokeWidth={1} />
              <text
                x={-6}
                y={yOf(v)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fill="#46464f"
                fontFamily="'JetBrains Mono', monospace"
              >
                {v}
              </text>
            </g>
          ))}

          {/* Y-axis label */}
          <text
            x={-28}
            y={INNER_H / 2}
            textAnchor="middle"
            fontSize={9}
            fill="#46464f"
            fontFamily="'JetBrains Mono', monospace"
            letterSpacing="2"
            transform={`rotate(-90, -28, ${INNER_H / 2})`}
          >
            APM
          </text>

          {/* X labels */}
          {xTicks.map((i) => (
            <text
              key={i}
              x={xOf(i)}
              y={INNER_H + 16}
              textAnchor="middle"
              fontSize={10}
              fill="#46464f"
              fontFamily="'JetBrains Mono', monospace"
            >
              {((i + 1) * minutes).toFixed(0)}m
            </text>
          ))}

          {/* Player lines */}
          {active.map((p) => (
            <path
              key={p.id}
              d={linePath(p.actions.timed)}
              fill="none"
              stroke={p.color}
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-5">
        {active.map((p) => (
          <span
            key={p.id}
            className="flex items-center gap-2 text-zinc-400"
            style={{ fontSize: '.7rem', fontFamily: "'Outfit', sans-serif" }}
          >
            <svg width={16} height={2} className="flex-shrink-0">
              <line x1={0} y1={1} x2={16} y2={1} stroke={p.color} strokeWidth={2} />
            </svg>
            {p.name}
          </span>
        ))}
      </div>
    </div>
  )
}
