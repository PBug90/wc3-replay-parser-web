import { useState, useRef } from 'react'
import { WORKERS, HERO_ICON, HERO_OBSERVER, UNIT_SUPPLY, UNIT_ICON_ID } from '../wc3data'

const HERO_OBSERVER_NAMES = new Set(Object.keys(HERO_OBSERVER))

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')
const PLAYER_COLORS = ['#58a6ff', '#ff7b72', '#3fb950', '#d2a8ff', '#ffa657']
const UNIT_COLORS = [
  '#58a6ff',
  '#3fb950',
  '#d4a843',
  '#d2a8ff',
  '#ffa657',
  '#ff7b72',
  '#79c0ff',
  '#56d364',
  '#f0c040',
  '#bc8cff',
  '#ff9bce',
  '#87d96c',
  '#ffb77e',
  '#a5d6ff',
  '#c9e0a0',
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HeroSample {
  name: string
  level: number
  xp: number
  hp: number
  hp_max: number
  mp: number
  mp_max: number
  damage_dealt: number
  damage_received: number
  healing_done: number
  deaths: number
  kills: number
  hero_kills: number
  building_kills: number
}
interface UnitSnapshot {
  name: string
  alive: number
  trained: number
}
interface Sample {
  time_ms: number
  gold: number
  gold_mined: number
  gold_upkeep_lost: number
  lumber: number
  lumber_mined: number
  lumber_upkeep_lost: number
  food_used: number
  food_cap: number
  apm: number
  heroes: HeroSample[]
  units: UnitSnapshot[]
}
interface HeroFinal {
  name: string
  level: number
  xp: number
  deaths: number
  total_kills: number
  hero_kills: number
  building_kills: number
  damage_dealt: number
  damage_received: number
  healing_done: number
  time_alive_ms: number
}
interface UnitSummary {
  name: string
  trained: number
  alive: number
  damage_dealt: number
  damage_received: number
  healing_done: number
}
interface PlayerSummary {
  heroes: HeroFinal[]
  units: UnitSummary[]
}
interface PlayerRecord {
  name: string
  race: string
  team: number
  result: string
  time_in_upkeep_ms: number[]
  samples: Sample[]
  summary: PlayerSummary
}
interface GameRecord {
  map: string
  game: string
  duration_ms: number
  players: PlayerRecord[]
}
type ChartPlayer = PlayerRecord & { color: string }

// ---------------------------------------------------------------------------
// Chart layout constants — match ApmChart.tsx
// ---------------------------------------------------------------------------

const CM = { top: 16, right: 16, bottom: 28, left: 52 }
const W = 640
const H = 200
const IW = W - CM.left - CM.right
const IH = H - CM.top - CM.bottom

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function niceMax(val: number, step: number) {
  return Math.ceil(Math.max(val, step) / step) * step
}

function timeTicks(maxSec: number): number[] {
  const step = maxSec > 1800 ? 600 : maxSec > 600 ? 300 : 120
  const ticks: number[] = []
  for (let t = 0; t <= maxSec; t += step) ticks.push(t)
  return ticks
}

function nearestSample(samples: Sample[], targetSec: number): Sample | null {
  if (samples.length === 0) return null
  const ms = targetSec * 1000
  return samples.reduce((best, s) =>
    Math.abs(s.time_ms - ms) < Math.abs(best.time_ms - ms) ? s : best,
  )
}

function nearestSampleIdx(samples: Sample[], targetSec: number): number {
  const ms = targetSec * 1000
  return samples.reduce(
    (best, s, i) => (Math.abs(s.time_ms - ms) < Math.abs(samples[best].time_ms - ms) ? i : best),
    0,
  )
}

/** Build sorted layer order: workers first (closest to axis), then others by peak supply desc. */
const heroSupply = (n: string) => (HERO_OBSERVER_NAMES.has(n) ? 5 : (UNIT_SUPPLY[n] ?? 1))

function buildLayers(samples: Sample[]) {
  const unitNames = [
    ...new Set(samples.flatMap((s) => s.units.filter((u) => u.alive > 0).map((u) => u.name))),
  ]
  const heroNames = [
    ...new Set(samples.flatMap((s) => s.heroes.filter((h) => h.hp > 0).map((h) => h.name))),
  ]
  const allNames = [...new Set([...unitNames, ...heroNames])]
  const peakSupply = Object.fromEntries(
    allNames.map((n) => [
      n,
      Math.max(
        ...samples.map((s) => {
          if (HERO_OBSERVER_NAMES.has(n))
            return s.heroes.some((h) => h.name === n && h.hp > 0) ? 5 : 0
          return (s.units.find((u) => u.name === n)?.alive ?? 0) * heroSupply(n)
        }),
      ),
    ]),
  )
  const workers = allNames
    .filter((n) => WORKERS.has(n))
    .sort((a, b) => peakSupply[b] - peakSupply[a])
  const heroes = allNames
    .filter((n) => HERO_OBSERVER_NAMES.has(n))
    .sort((a, b) => peakSupply[b] - peakSupply[a])
  const others = allNames
    .filter((n) => !WORKERS.has(n) && !HERO_OBSERVER_NAMES.has(n))
    .sort((a, b) => peakSupply[b] - peakSupply[a])
  return [...workers, ...others, ...heroes] // heroes always on top of stack
}

/** Precompute {name -> alive/present} maps per sample, including alive heroes. */
function buildByTime(samples: Sample[]) {
  return samples.map((s) => {
    const map: Record<string, number> = Object.fromEntries(s.units.map((u) => [u.name, u.alive]))
    for (const h of s.heroes) if (h.hp > 0) map[h.name] = (map[h.name] ?? 0) + 1
    return map
  })
}

/** Compute stacked SVG paths (closed areas) for a set of layers + samples.
 *  `weight` maps unit name → supply cost; defaults to 1 if omitted.
 *  `colorOf` maps unit name → fill color; defaults to cycling UNIT_COLORS by index. */
function buildAreas(
  samples: Sample[],
  layers: string[],
  byTime: Record<string, number>[],
  xOf: (t: number) => number,
  yOf: (v: number) => number,
  weight: (name: string) => number = () => 1,
  colorOf: (name: string, idx: number) => string = (_, i) => UNIT_COLORS[i % UNIT_COLORS.length],
) {
  return layers.map((name, li) => {
    const topPts = samples.map((_, si) => {
      const cum = layers
        .slice(0, li + 1)
        .reduce((sum, n) => sum + (byTime[si][n] ?? 0) * weight(n), 0)
      return [xOf(samples[si].time_ms / 1000), yOf(cum)] as [number, number]
    })
    const botPts = samples.map((_, si) => {
      const cum = layers.slice(0, li).reduce((sum, n) => sum + (byTime[si][n] ?? 0) * weight(n), 0)
      return [xOf(samples[si].time_ms / 1000), yOf(cum)] as [number, number]
    })
    const fwd = topPts
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ')
    const bwd = [...botPts]
      .reverse()
      .map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ')
    return { name, d: `${fwd} ${bwd} Z`, fill: colorOf(name, li) }
  })
}

// ---------------------------------------------------------------------------
// Hover hook
// ---------------------------------------------------------------------------

interface HoverState {
  fraction: number
  sx: number
  sy: number
  wrapW: number
}

function useChartHover() {
  const [hover, setHover] = useState<HoverState | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  function onSvgMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svgRect = e.currentTarget.getBoundingClientRect()
    const wrapRect = wrapRef.current!.getBoundingClientRect()
    const svgX = (e.clientX - svgRect.left) * (W / svgRect.width)
    const innerX = svgX - CM.left
    const fraction = Math.max(0, Math.min(1, innerX / IW))
    setHover({
      fraction,
      sx: e.clientX - wrapRect.left,
      sy: e.clientY - wrapRect.top,
      wrapW: wrapRect.width,
    })
  }

  return { hover, wrapRef, onSvgMouseMove, onSvgMouseLeave: () => setHover(null) }
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({
  hover,
  minWidth = 130,
  children,
}: {
  hover: HoverState
  minWidth?: number
  children: React.ReactNode
}) {
  const toLeft = hover.sx > hover.wrapW * 0.58
  return (
    <div
      style={{
        position: 'absolute',
        left: toLeft ? hover.sx - 8 : hover.sx + 12,
        top: hover.sy,
        transform: toLeft ? 'translate(-100%, -50%)' : 'translateY(-50%)',
        background: 'var(--surface)',
        border: '1px solid var(--border-hi)',
        padding: '7px 10px',
        pointerEvents: 'none',
        zIndex: 10,
        minWidth,
        maxWidth: 320,
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      }}
    >
      {children}
    </div>
  )
}

// Shared time header for tooltips
function TooltipTime({ sec }: { sec: number }) {
  return (
    <div
      className="font-mono text-muted"
      style={{ fontSize: '.58rem', marginBottom: 5, letterSpacing: '.05em' }}
    >
      {fmtTime(sec)}
    </div>
  )
}

// Unit icon tile: colored square as background, unit image overlaid if available
function UnitIcon({ name, fill, size = 22 }: { name: string; fill: string; size?: number }) {
  const hero = HERO_OBSERVER[name]
  const unitId = UNIT_ICON_ID[name]
  const src = hero
    ? `${BASE}/heroes/${hero.icon}.png`
    : unitId
      ? `${BASE}/units/${unitId}.png`
      : null
  return (
    <div
      style={{
        width: size,
        height: size,
        background: fill,
        opacity: 0.9,
        flexShrink: 0,
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
      }}
      title={hero?.display ?? name}
    >
      {src && (
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          style={{ display: 'block', imageRendering: 'pixelated', width: '100%', height: '100%' }}
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      )}
    </div>
  )
}

// Unit row inside tooltip: icon + name + count + supply total
function UnitIconRow({ fill, name, count }: { fill: string; name: string; count: number }) {
  const sup = heroSupply(name)
  const displayName = HERO_OBSERVER[name]?.display ?? name
  return (
    <div className="flex items-center gap-1.5" style={{ marginBottom: 2 }}>
      <UnitIcon name={name} fill={fill} size={14} />
      <span
        style={{ fontSize: '.6rem', color: '#8b8b99', fontFamily: "'Outfit', sans-serif", flex: 1 }}
      >
        {displayName}
      </span>
      <span className="font-mono text-foreground" style={{ fontSize: '.6rem' }}>
        ×{count}
      </span>
      <span className="font-mono text-muted" style={{ fontSize: '.55rem' }}>
        {count * sup}f
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Economy chart
// ---------------------------------------------------------------------------

interface ResourceSeries {
  mined: (s: Sample) => number
  upkeep: (s: Sample) => number
  netLabel: string
  minedLabel: string
  upkeepLabel: string
}

function ResourceChart({
  players,
  title,
  series,
  yStep,
  singleLine = false,
}: {
  players: ChartPlayer[]
  title: string
  series: ResourceSeries
  yStep: number
  singleLine?: boolean
}) {
  const { hover, wrapRef, onSvgMouseMove, onSvgMouseLeave } = useChartHover()

  if (players.every((p) => p.samples.length === 0)) return null
  const maxTime = Math.max(...players.flatMap((p) => p.samples.map((s) => s.time_ms))) / 1000
  const rawMax = Math.max(...players.flatMap((p) => p.samples.map((s) => series.mined(s))), 1)
  const yMax = niceMax(rawMax, yStep)

  const xOf = (t: number) => (t / maxTime) * IW
  const yOf = (v: number) => IH - (v / yMax) * IH

  const yTicks: number[] = []
  for (let v = 0; v <= yMax; v += yStep) yTicks.push(v)

  const path = (pts: Array<[number, number]>) =>
    pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  const hoverSec = hover ? hover.fraction * maxTime : null

  return (
    <div ref={wrapRef} className="flex flex-col gap-3" style={{ position: 'relative' }}>
      <span className="section-label">{title}</span>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="overflow-visible"
        onMouseMove={onSvgMouseMove}
        onMouseLeave={onSvgMouseLeave}
        style={{ cursor: 'crosshair' }}
      >
        <g transform={`translate(${CM.left},${CM.top})`}>
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={0} y1={yOf(v)} x2={IW} y2={yOf(v)} stroke="#1e1e26" strokeWidth={1} />
              <text
                x={-6}
                y={yOf(v)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={9}
                fill="#46464f"
                fontFamily="'JetBrains Mono', monospace"
              >
                {v >= 1000 ? `${v / 1000}k` : v}
              </text>
            </g>
          ))}
          {timeTicks(maxTime).map((t) => (
            <text
              key={t}
              x={xOf(t)}
              y={IH + 16}
              textAnchor="middle"
              fontSize={9}
              fill="#46464f"
              fontFamily="'JetBrains Mono', monospace"
            >
              {Math.floor(t / 60)}m
            </text>
          ))}
          {players.map(({ color, samples }) => {
            const mp = samples.map(
              (s) => [xOf(s.time_ms / 1000), yOf(series.mined(s))] as [number, number],
            )
            const up = singleLine
              ? null
              : samples.map(
                  (s) => [xOf(s.time_ms / 1000), yOf(series.upkeep(s))] as [number, number],
                )
            const np = singleLine
              ? null
              : samples.map(
                  (s) =>
                    [
                      xOf(s.time_ms / 1000),
                      yOf(Math.max(0, series.mined(s) - series.upkeep(s))),
                    ] as [number, number],
                )
            return (
              <g key={color}>
                <path
                  d={path(mp)}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
                {up && (
                  <path
                    d={path(up)}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="6 3"
                    strokeLinejoin="round"
                    opacity={0.7}
                  />
                )}
                {np && (
                  <path
                    d={path(np)}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    strokeLinejoin="round"
                    opacity={0.85}
                  />
                )}
              </g>
            )
          })}
          {hover && (
            <line
              x1={hover.fraction * IW}
              y1={0}
              x2={hover.fraction * IW}
              y2={IH}
              stroke="rgba(200,160,80,0.4)"
              strokeWidth={1}
              pointerEvents="none"
            />
          )}
          <rect x={0} y={0} width={IW} height={IH} fill="transparent" />
        </g>
      </svg>

      {hover && hoverSec !== null && (
        <ChartTooltip hover={hover}>
          <TooltipTime sec={hoverSec} />
          {players.map((p) => {
            const s = nearestSample(p.samples, hoverSec)
            if (!s) return null
            const mined = series.mined(s)
            const upkeep = series.upkeep(s)
            return (
              <div key={p.name} style={{ marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: '.62rem',
                    color: p.color,
                    fontFamily: "'Outfit', sans-serif",
                    display: 'block',
                    marginBottom: 2,
                  }}
                >
                  {p.name}
                </span>
                {(singleLine
                  ? ([[series.minedLabel, mined]] as [string, number][])
                  : ([
                      [series.minedLabel, mined],
                      [series.upkeepLabel, upkeep],
                      [series.netLabel, mined - upkeep],
                    ] as [string, number][])
                ).map(([label, val]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 font-mono"
                    style={{ fontSize: '.58rem' }}
                  >
                    <span style={{ color: '#46464f' }}>{label}</span>
                    <span className="text-foreground">{val.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </ChartTooltip>
      )}

      <div className="flex flex-wrap gap-6">
        {players.map(({ name, color }) => (
          <span key={name} className="flex flex-col gap-0.5">
            <span
              className="text-zinc-400"
              style={{ fontSize: '.65rem', fontFamily: "'Outfit', sans-serif" }}
            >
              {name}
            </span>
            {(singleLine
              ? ([{ label: series.minedLabel, dash: undefined }] as {
                  label: string
                  dash?: string
                }[])
              : ([
                  { label: series.minedLabel, dash: undefined },
                  { label: series.upkeepLabel, dash: '6 3' },
                  { label: series.netLabel, dash: '2 2' },
                ] as { label: string; dash?: string }[])
            ).map(({ label, dash }) => (
              <span
                key={label}
                className="flex items-center gap-2 text-zinc-500"
                style={{ fontSize: '.6rem', fontFamily: "'Outfit', sans-serif" }}
              >
                <svg width={16} height={2} className="flex-shrink-0">
                  <line
                    x1={0}
                    y1={1}
                    x2={16}
                    y2={1}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray={dash}
                  />
                </svg>
                {label}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

function EconomyChart({ players }: { players: ChartPlayer[] }) {
  const rawMax = Math.max(...players.flatMap((p) => p.samples.map((s) => s.gold_mined)), 1)
  const step = rawMax > 10000 ? 5000 : rawMax > 4000 ? 2000 : 1000
  return (
    <ResourceChart
      players={players}
      title="Economy — Gold"
      yStep={step}
      series={{
        mined: (s) => s.gold_mined,
        upkeep: (s) => s.gold_upkeep_lost,
        minedLabel: 'mined',
        upkeepLabel: 'upkeep',
        netLabel: 'net gold',
      }}
    />
  )
}

function LumberChart({ players }: { players: ChartPlayer[] }) {
  const rawMax = Math.max(...players.flatMap((p) => p.samples.map((s) => s.lumber_mined)), 1)
  const step = rawMax > 5000 ? 2000 : rawMax > 2000 ? 1000 : 500
  return (
    <ResourceChart
      players={players}
      title="Economy — Lumber"
      yStep={step}
      singleLine
      series={{
        mined: (s) => s.lumber_mined,
        upkeep: () => 0,
        minedLabel: 'mined',
        upkeepLabel: '',
        netLabel: '',
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Food chart
// ---------------------------------------------------------------------------

function FoodChart({ players }: { players: ChartPlayer[] }) {
  const { hover, wrapRef, onSvgMouseMove, onSvgMouseLeave } = useChartHover()

  if (players.every((p) => p.samples.length === 0)) return null
  const maxTime = Math.max(...players.flatMap((p) => p.samples.map((s) => s.time_ms))) / 1000
  const rawMax = Math.max(...players.flatMap((p) => p.samples.map((s) => s.food_cap)), 1)
  const yMax = niceMax(rawMax, 20)

  const xOf = (t: number) => (t / maxTime) * IW
  const yOf = (v: number) => IH - (v / yMax) * IH

  const yTicks: number[] = []
  for (let v = 0; v <= yMax; v += 20) yTicks.push(v)

  const hoverSec = hover ? hover.fraction * maxTime : null

  return (
    <div ref={wrapRef} className="flex flex-col gap-3" style={{ position: 'relative' }}>
      <span className="section-label">Food</span>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="overflow-visible"
        onMouseMove={onSvgMouseMove}
        onMouseLeave={onSvgMouseLeave}
        style={{ cursor: 'crosshair' }}
      >
        <g transform={`translate(${CM.left},${CM.top})`}>
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={0} y1={yOf(v)} x2={IW} y2={yOf(v)} stroke="#1e1e26" strokeWidth={1} />
              <text
                x={-6}
                y={yOf(v)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={9}
                fill="#46464f"
                fontFamily="'JetBrains Mono', monospace"
              >
                {v}
              </text>
            </g>
          ))}
          {timeTicks(maxTime).map((t) => (
            <text
              key={t}
              x={xOf(t)}
              y={IH + 16}
              textAnchor="middle"
              fontSize={9}
              fill="#46464f"
              fontFamily="'JetBrains Mono', monospace"
            >
              {Math.floor(t / 60)}m
            </text>
          ))}
          {players.map(({ color, samples }) => (
            <g key={color}>
              <path
                d={samples
                  .map(
                    (s, i) =>
                      `${i === 0 ? 'M' : 'L'}${xOf(s.time_ms / 1000).toFixed(1)},${yOf(s.food_used).toFixed(1)}`,
                  )
                  .join(' ')}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
              <path
                d={samples
                  .map(
                    (s, i) =>
                      `${i === 0 ? 'M' : 'L'}${xOf(s.time_ms / 1000).toFixed(1)},${yOf(s.food_cap).toFixed(1)}`,
                  )
                  .join(' ')}
                fill="none"
                stroke={color}
                strokeWidth={1}
                strokeDasharray="4 2"
                strokeLinejoin="round"
                opacity={0.45}
              />
            </g>
          ))}
          {hover && (
            <line
              x1={hover.fraction * IW}
              y1={0}
              x2={hover.fraction * IW}
              y2={IH}
              stroke="rgba(200,160,80,0.4)"
              strokeWidth={1}
              pointerEvents="none"
            />
          )}
          <rect x={0} y={0} width={IW} height={IH} fill="transparent" />
        </g>
      </svg>

      {hover && hoverSec !== null && (
        <ChartTooltip hover={hover}>
          <TooltipTime sec={hoverSec} />
          {players.map((p) => {
            const s = nearestSample(p.samples, hoverSec)
            if (!s) return null
            return (
              <div key={p.name} style={{ marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: '.62rem',
                    color: p.color,
                    fontFamily: "'Outfit', sans-serif",
                    display: 'block',
                    marginBottom: 1,
                  }}
                >
                  {p.name}
                </span>
                {(
                  [
                    ['used', s.food_used],
                    ['cap', s.food_cap],
                  ] as [string, number][]
                ).map(([label, val]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 font-mono"
                    style={{ fontSize: '.58rem' }}
                  >
                    <span style={{ color: '#46464f' }}>{label}</span>
                    <span className="text-foreground">{val}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </ChartTooltip>
      )}

      <div className="flex flex-wrap gap-6">
        {players.map(({ name, color }) => (
          <span key={name} className="flex flex-col gap-0.5">
            <span
              className="text-zinc-400"
              style={{ fontSize: '.65rem', fontFamily: "'Outfit', sans-serif" }}
            >
              {name}
            </span>
            {(
              [
                { label: 'used', dash: undefined },
                { label: 'cap', dash: '4 2' },
              ] as { label: string; dash?: string }[]
            ).map(({ label, dash }) => (
              <span
                key={label}
                className="flex items-center gap-2 text-zinc-500"
                style={{ fontSize: '.6rem', fontFamily: "'Outfit', sans-serif" }}
              >
                <svg width={16} height={2} className="flex-shrink-0">
                  <line
                    x1={0}
                    y1={1}
                    x2={16}
                    y2={1}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray={dash}
                  />
                </svg>
                {label}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Combined army composition chart (mirrored / butterfly)
// Player 1 stacks upward, Player 2 stacks downward from the center axis
// ---------------------------------------------------------------------------

const CH = 280 // taller to accommodate both sides
const CIH = CH - CM.top - CM.bottom

function CombinedArmyChart({ players }: { players: ChartPlayer[] }) {
  const { hover, wrapRef, onSvgMouseMove, onSvgMouseLeave } = useChartHover()

  if (players.length < 2) return null

  const p1 = players[0]
  const p2 = players[1]
  const allSamples = [...p1.samples, ...p2.samples]
  if (allSamples.length === 0) return null

  const maxTime = Math.max(...allSamples.map((s) => s.time_ms)) / 1000
  const center = CIH / 2

  const layers1 = buildLayers(p1.samples)
  const layers2 = buildLayers(p2.samples)
  const byTime1 = buildByTime(p1.samples)
  const byTime2 = buildByTime(p2.samples)

  const supply = heroSupply

  const maxStack1 = Math.max(
    ...p1.samples.map((_, si) =>
      layers1.reduce((sum, n) => sum + (byTime1[si][n] ?? 0) * supply(n), 0),
    ),
    1,
  )
  const maxStack2 = Math.max(
    ...p2.samples.map((_, si) =>
      layers2.reduce((sum, n) => sum + (byTime2[si][n] ?? 0) * supply(n), 0),
    ),
    1,
  )
  const maxStack = Math.max(maxStack1, maxStack2)

  const yStep = maxStack > 60 ? 20 : maxStack > 30 ? 10 : 5
  const yMax = niceMax(maxStack, yStep)

  const xOf = (t: number) => (t / maxTime) * IW
  const yOf_up = (v: number) => center - (v / yMax) * center
  const yOf_dn = (v: number) => center + (v / yMax) * center

  const allUnitNames = [...new Set([...layers1, ...layers2])]
  const sharedColorMap = Object.fromEntries(
    allUnitNames.map((name, i) => [name, UNIT_COLORS[i % UNIT_COLORS.length]]),
  )
  const colorOf = (name: string) => sharedColorMap[name] ?? UNIT_COLORS[0]

  const areas1 = buildAreas(p1.samples, layers1, byTime1, xOf, yOf_up, supply, colorOf)
  const areas2 = buildAreas(p2.samples, layers2, byTime2, xOf, yOf_dn, supply, colorOf)

  const yTicks: number[] = []
  for (let v = yStep; v <= yMax; v += yStep) yTicks.push(v)

  const hoverSec = hover ? hover.fraction * maxTime : null
  const hi1 = hoverSec !== null && p1.samples.length ? nearestSampleIdx(p1.samples, hoverSec) : null
  const hi2 = hoverSec !== null && p2.samples.length ? nearestSampleIdx(p2.samples, hoverSec) : null

  return (
    <div ref={wrapRef} className="flex flex-col gap-3" style={{ position: 'relative' }}>
      <span className="section-label">Army Comparison</span>
      <svg
        viewBox={`0 0 ${W} ${CH}`}
        width="100%"
        className="overflow-visible"
        onMouseMove={onSvgMouseMove}
        onMouseLeave={onSvgMouseLeave}
        style={{ cursor: 'crosshair' }}
      >
        <g transform={`translate(${CM.left},${CM.top})`}>
          {/* Grid ticks — mirrored above and below center */}
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={0} y1={yOf_up(v)} x2={IW} y2={yOf_up(v)} stroke="#1e1e26" strokeWidth={1} />
              <line x1={0} y1={yOf_dn(v)} x2={IW} y2={yOf_dn(v)} stroke="#1e1e26" strokeWidth={1} />
              <text
                x={-6}
                y={yOf_up(v)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={9}
                fill="#46464f"
                fontFamily="'JetBrains Mono', monospace"
              >
                {v}
              </text>
              <text
                x={-6}
                y={yOf_dn(v)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={9}
                fill="#46464f"
                fontFamily="'JetBrains Mono', monospace"
              >
                {v}
              </text>
            </g>
          ))}

          {/* Center axis */}
          <line
            x1={0}
            y1={center}
            x2={IW}
            y2={center}
            stroke="rgba(200,160,80,0.25)"
            strokeWidth={1}
          />

          {/* Player name labels pinned to top/bottom edges */}
          <text
            x={4}
            y={6}
            fontSize={9}
            fill={p1.color}
            fontFamily="'JetBrains Mono', monospace"
            dominantBaseline="hanging"
          >
            {p1.name}
          </text>
          <text
            x={4}
            y={CIH - 6}
            fontSize={9}
            fill={p2.color}
            fontFamily="'JetBrains Mono', monospace"
            dominantBaseline="auto"
          >
            {p2.name}
          </text>

          {/* Time labels */}
          {timeTicks(maxTime).map((t) => (
            <text
              key={t}
              x={xOf(t)}
              y={CIH + 16}
              textAnchor="middle"
              fontSize={9}
              fill="#46464f"
              fontFamily="'JetBrains Mono', monospace"
            >
              {Math.floor(t / 60)}m
            </text>
          ))}

          {/* Stacked areas */}
          {areas1.map(({ name, d, fill }) => (
            <path
              key={`a-${name}`}
              d={d}
              fill={fill}
              opacity={0.75}
              stroke={fill}
              strokeWidth={0.5}
            />
          ))}
          {areas2.map(({ name, d, fill }) => (
            <path
              key={`b-${name}`}
              d={d}
              fill={fill}
              opacity={0.75}
              stroke={fill}
              strokeWidth={0.5}
            />
          ))}

          {/* Crosshair */}
          {hover && (
            <line
              x1={hover.fraction * IW}
              y1={0}
              x2={hover.fraction * IW}
              y2={CIH}
              stroke="rgba(200,160,80,0.5)"
              strokeWidth={1}
              pointerEvents="none"
            />
          )}

          {/* Mouse overlay — must be last */}
          <rect x={0} y={0} width={IW} height={CIH} fill="transparent" />
        </g>
      </svg>

      {/* Hover tooltip with unit icons */}
      {hover && hoverSec !== null && (
        <ChartTooltip hover={hover} minWidth={200}>
          <TooltipTime sec={hoverSec} />

          {/* Player 1 unit icons */}
          {hi1 !== null &&
            (() => {
              const units = areas1
                .map(({ name, fill }) => ({ name, fill, count: byTime1[hi1][name] ?? 0 }))
                .filter((u) => u.count > 0)
                .reverse()
              if (units.length === 0) return null
              return (
                <div style={{ marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: '.62rem',
                      color: p1.color,
                      fontFamily: "'Outfit', sans-serif",
                      display: 'block',
                      marginBottom: 5,
                    }}
                  >
                    {p1.name}
                  </span>
                  {/* Icon grid */}
                  <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 4 }}>
                    {units.map(({ name, fill, count }) => (
                      <div key={name} className="flex flex-col items-center gap-0.5">
                        <UnitIcon name={name} fill={fill} size={22} />
                        <span className="font-mono" style={{ fontSize: '.5rem', color: '#8b8b99' }}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Detailed rows */}
                  {units.map(({ name, fill, count }) => (
                    <UnitIconRow key={name} fill={fill} name={name} count={count} />
                  ))}
                  <div
                    className="flex justify-between font-mono"
                    style={{
                      fontSize: '.6rem',
                      marginTop: 4,
                      paddingTop: 4,
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ color: '#46464f' }}>total food</span>
                    <span className="text-foreground">
                      {units.reduce((s, { name, count }) => s + count * heroSupply(name), 0)}
                    </span>
                  </div>
                </div>
              )
            })()}

          {/* Divider */}
          {hi1 !== null && hi2 !== null && (
            <div style={{ borderTop: '1px solid var(--border)', marginBottom: 8 }} />
          )}

          {/* Player 2 unit icons */}
          {hi2 !== null &&
            (() => {
              const units = areas2
                .map(({ name, fill }) => ({ name, fill, count: byTime2[hi2][name] ?? 0 }))
                .filter((u) => u.count > 0)
                .reverse()
              if (units.length === 0) return null
              return (
                <div>
                  <span
                    style={{
                      fontSize: '.62rem',
                      color: p2.color,
                      fontFamily: "'Outfit', sans-serif",
                      display: 'block',
                      marginBottom: 5,
                    }}
                  >
                    {p2.name}
                  </span>
                  <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 4 }}>
                    {units.map(({ name, fill, count }) => (
                      <div key={name} className="flex flex-col items-center gap-0.5">
                        <UnitIcon name={name} fill={fill} size={22} />
                        <span className="font-mono" style={{ fontSize: '.5rem', color: '#8b8b99' }}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                  {units.map(({ name, fill, count }) => (
                    <UnitIconRow key={name} fill={fill} name={name} count={count} />
                  ))}
                  <div
                    className="flex justify-between font-mono"
                    style={{
                      fontSize: '.6rem',
                      marginTop: 4,
                      paddingTop: 4,
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ color: '#46464f' }}>total food</span>
                    <span className="text-foreground">
                      {units.reduce((s, { name, count }) => s + count * heroSupply(name), 0)}
                    </span>
                  </div>
                </div>
              )
            })()}
        </ChartTooltip>
      )}

      {/* Legend — two columns */}
      <div className="flex gap-8 flex-wrap">
        {[
          { player: p1, areas: areas1 },
          { player: p2, areas: areas2 },
        ].map(({ player, areas }) => (
          <div key={player.name} className="flex flex-col gap-1">
            <span
              style={{
                fontSize: '.65rem',
                color: player.color,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {player.name}
            </span>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {[...areas].reverse().map(({ name, fill }) => (
                <span
                  key={name}
                  className="flex items-center gap-1.5"
                  style={{
                    fontSize: '.6rem',
                    fontFamily: "'Outfit', sans-serif",
                    color: '#8b8b99',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: fill,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  {name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hero icon
// ---------------------------------------------------------------------------

function resolveHeroIconId(name: string): string | null {
  return HERO_ICON[name] ?? HERO_OBSERVER[name.toLowerCase().replace(/\s+/g, '')]?.icon ?? null
}

function resolveHeroDisplayName(name: string): string {
  return HERO_OBSERVER[name.toLowerCase().replace(/\s+/g, '')]?.display ?? name
}

function HeroIcon({ name, size = 36 }: { name: string; size?: number }) {
  const id = resolveHeroIconId(name)
  if (!id) {
    return (
      <div
        className="border border-border flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size, background: 'var(--surface-hi)' }}
        title={name}
      >
        <span style={{ fontSize: 8, color: 'var(--muted)' }}>?</span>
      </div>
    )
  }
  return (
    <div
      className="border border-border overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <img
        src={`${BASE}/heroes/${id}.png`}
        alt={name}
        title={name}
        width={size}
        height={size}
        style={{ display: 'block', imageRendering: 'pixelated', width: '100%', height: '100%' }}
        onError={(e) => {
          ;(e.currentTarget as HTMLImageElement).style.display = 'none'
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Drop zone
// ---------------------------------------------------------------------------

function DropZoneEmpty({ onFile, error }: { onFile: (f: File) => void; error: string | null }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex flex-col items-center justify-center gap-3 cursor-pointer"
        style={{
          minHeight: 200,
          border: dragging ? '2px dashed rgba(200,160,80,0.6)' : '2px dashed var(--border-hi)',
          background: dragging ? 'rgba(200,160,80,0.04)' : 'var(--surface)',
          transition: 'border-color .15s, background .15s',
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const f = e.dataTransfer.files[0]
          if (f) onFile(f)
        }}
        onClick={() => inputRef.current?.click()}
      >
        <span
          className="font-display text-muted"
          style={{ fontSize: '.75rem', letterSpacing: '.2em' }}
        >
          DROP LIVE STATS JSON
        </span>
        <span className="font-mono text-muted" style={{ fontSize: '.6rem' }}>
          click to browse
        </span>
        <span className="font-mono text-muted" style={{ fontSize: '.6rem', marginTop: '0.5rem' }}>
          generate JSON with{' '}
          <a
            href="https://github.com/PBug90/magic-sentry"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#58a6ff', textDecoration: 'underline' }}
            onClick={(e) => e.stopPropagation()}
          >
            Magic Sentry
          </a>{' '}
          via the Warcraft 3 Observer API
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
          }}
        />
      </div>
      {error && (
        <div
          className="font-mono text-red-400 px-4 py-3"
          style={{
            fontSize: '.72rem',
            border: '1px solid rgba(184,48,48,0.4)',
            background: 'rgba(184,48,48,0.08)',
          }}
        >
          ⚠ {error}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

type ChartKey = 'economy' | 'lumber' | 'food' | 'army'

const CHART_LABELS: Record<ChartKey, string> = {
  economy: 'Gold',
  lumber: 'Lumber',
  food: 'Food',
  army: 'Army',
}

export default function MemoryGameView() {
  const [game, setGame] = useState<GameRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [visibleCharts, setVisibleCharts] = useState<Set<ChartKey>>(
    new Set(['economy', 'lumber', 'food', 'army']),
  )

  function toggleChart(key: ChartKey) {
    setVisibleCharts((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function loadFile(file: File) {
    setError(null)
    file.text().then((text) => {
      try {
        const data = JSON.parse(text) as GameRecord
        if (!Array.isArray(data.players) || typeof data.map !== 'string') {
          throw new Error('Not a valid wc3-memory-test JSON file')
        }
        setGame(data)
      } catch (e) {
        setError(String(e))
        setGame(null)
      }
    })
  }

  if (!game) return <DropZoneEmpty onFile={loadFile} error={error} />

  const playerData: ChartPlayer[] = game.players.map((p, i) => ({
    ...p,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
  }))

  const teams = [...new Set(playerData.map((p) => p.team))].sort((a, b) => a - b)

  return (
    <div className="flex flex-col gap-8 fade-up">
      {/* Back + meta */}
      <div className="flex items-center gap-3">
        <button className="btn-flat flex items-center gap-2" onClick={() => setGame(null)}>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          New File
        </button>
        <div
          className="flex-1 h-px"
          style={{ background: 'linear-gradient(to right, rgba(200,160,80,0.2), transparent)' }}
        />
        <span
          className="font-mono text-muted"
          style={{ fontSize: '.6rem', letterSpacing: '.06em' }}
        >
          {game.map} · {formatDuration(game.duration_ms)}
        </span>
      </div>

      {/* Heroes */}
      {playerData.some((p) => p.summary.heroes.length > 0) && (
        <div className="flex flex-col gap-4">
          {playerData.map(
            (player) =>
              player.summary.heroes.length > 0 && (
                <div key={player.name} className="flex flex-col gap-2">
                  <span className="section-label" style={{ color: player.color }}>
                    {player.name}
                  </span>
                  {[...player.summary.heroes].reverse().map((hero, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-center px-3 py-2.5"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border-hi)',
                        borderLeft: `3px solid ${player.color}`,
                      }}
                    >
                      <div className="relative flex-shrink-0">
                        <HeroIcon name={hero.name} size={52} />
                        <span
                          className="font-mono absolute bottom-0 right-0"
                          style={{
                            fontSize: '.48rem',
                            background: 'rgba(0,0,0,0.78)',
                            color: 'var(--gold)',
                            padding: '1px 4px',
                            letterSpacing: '.06em',
                          }}
                        >
                          {i + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <div className="flex items-baseline gap-2">
                          <span
                            className="font-display text-foreground"
                            style={{ fontSize: '.82rem', letterSpacing: '.03em' }}
                          >
                            {resolveHeroDisplayName(hero.name)}
                          </span>
                          <span
                            className="font-mono"
                            style={{ fontSize: '.65rem', color: 'var(--gold)', opacity: 0.85 }}
                          >
                            Lv.{hero.level}
                          </span>
                          <span className="font-mono text-muted" style={{ fontSize: '.6rem' }}>
                            {hero.xp.toLocaleString()} xp
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1">
                          {(
                            [
                              ['Deaths', hero.deaths],
                              ['Dmg dealt', hero.damage_dealt.toLocaleString()],
                              ['Dmg recv', hero.damage_received.toLocaleString()],
                              ['Healing', hero.healing_done.toLocaleString()],
                            ] as Array<[string, string | number]>
                          ).map(([label, val]) => (
                            <span key={label} className="flex flex-col gap-0.5">
                              <span
                                className="text-muted"
                                style={{ fontSize: '.53rem', letterSpacing: '.06em' }}
                              >
                                {label}
                              </span>
                              <span
                                className="font-mono text-foreground"
                                style={{ fontSize: '.68rem' }}
                              >
                                {val}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ),
          )}
        </div>
      )}

      {/* Teams */}
      <div className="flex gap-3 flex-wrap">
        {teams.map((team, ti) => {
          const tp = playerData.filter((p) => p.team === team)
          const won = tp.some((p) => p.result === 'Victory')
          return (
            <div
              key={team}
              className="flex items-center gap-2 px-3 py-2"
              style={{
                background: 'var(--surface)',
                border: won ? '1px solid rgba(200,160,80,0.4)' : '1px solid var(--border)',
              }}
            >
              <span
                className="font-display text-muted"
                style={{ fontSize: '.55rem', letterSpacing: '.15em' }}
              >
                TEAM {ti + 1}
              </span>
              {tp.map((p) => (
                <span key={p.name} className="flex items-center gap-1.5">
                  <span
                    className="rounded-full"
                    style={{ width: 6, height: 6, display: 'inline-block', background: p.color }}
                  />
                  <span className="font-display text-foreground" style={{ fontSize: '.7rem' }}>
                    {p.name}
                  </span>
                </span>
              ))}
              {won && (
                <span
                  className="font-display"
                  style={{ fontSize: '.5rem', letterSpacing: '.15em', color: 'var(--gold)' }}
                >
                  VICTOR
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Chart toggles */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CHART_LABELS) as ChartKey[]).map((key) => {
          const active = visibleCharts.has(key)
          return (
            <button
              key={key}
              onClick={() => toggleChart(key)}
              className="font-display"
              style={{
                fontSize: '.6rem',
                letterSpacing: '.12em',
                padding: '4px 10px',
                border: active ? '1px solid rgba(200,160,80,0.55)' : '1px solid var(--border)',
                background: active ? 'rgba(200,160,80,0.1)' : 'var(--surface)',
                color: active ? 'var(--gold)' : 'var(--muted)',
                cursor: 'pointer',
                transition: 'border-color .15s, background .15s, color .15s',
              }}
            >
              {CHART_LABELS[key]}
            </button>
          )
        })}
      </div>

      {/* Global charts */}
      <div className="flex flex-col gap-8">
        {visibleCharts.has('economy') && <EconomyChart players={playerData} />}
        {visibleCharts.has('lumber') && <LumberChart players={playerData} />}
        {visibleCharts.has('food') && <FoodChart players={playerData} />}
        {visibleCharts.has('army') && <CombinedArmyChart players={playerData} />}
      </div>
    </div>
  )
}
