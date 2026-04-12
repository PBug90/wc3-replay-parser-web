import { useState, useMemo } from 'react'
import type { ParserOutput } from 'w3gjs'
import { formatGameTime } from '../format'
import { collectRows, rowIdentityKey, TIER_COLOR, type TimingRow } from '../timingUtils'
import Heatmap, { type PositionedAction, type PositionedBuilding } from '../Heatmap'
import TimingFilter from './TimingFilter'
import { EventIcon } from './EventIcon'

type Player = ParserOutput['players'][number]

const EMPTY_SET = new Set<string>()

type SidedRow = Omit<TimingRow, 'player'> & { originalKey: string }

// Filter out hidden rows then renumber #N details so they stay contiguous.
// originalKey preserves the pre-filter identity so dismiss keys remain stable.
function filterAndRenumber(player: Player, hiddenKeys: Set<string>): SidedRow[] {
  const raw = collectRows([player])
  const filtered = raw.filter((r) => !hiddenKeys.has(rowIdentityKey(r)))
  const counter: Record<string, number> = {}
  return filtered.map((row) => {
    const originalKey = rowIdentityKey(row)
    if (row.detail === 'Adept' || row.detail === 'Master') {
      return {
        ms: row.ms,
        id: row.id,
        label: row.label,
        detail: row.detail,
        kind: row.kind,
        originalKey,
      }
    }
    const groupKey = row.id
    counter[groupKey] = (counter[groupKey] ?? 0) + 1
    return {
      ms: row.ms,
      id: row.id,
      label: row.label,
      detail: `#${counter[groupKey]}`,
      kind: row.kind,
      originalKey,
    }
  })
}

type MergedRow = {
  key: string
  id: string
  label: string
  detail: string
  kind: 'building' | 'upgrade'
  msA: number | null
  msB: number | null
  originalKeyA: string | null
  originalKeyB: string | null
}

type DisplayMergedRow = MergedRow & { displayDetail: string }

function mergeTimings(
  playerA: Player,
  playerB: Player,
  hiddenKeysA: Set<string>,
  hiddenKeysB: Set<string>,
): MergedRow[] {
  const rowsA = filterAndRenumber(playerA, hiddenKeysA)
  const rowsB = filterAndRenumber(playerB, hiddenKeysB)
  const map = new Map<string, MergedRow>()

  for (const r of rowsA) {
    const key = `${r.label}·${r.detail}`
    map.set(key, {
      key,
      id: r.id,
      label: r.label,
      detail: r.detail,
      kind: r.kind,
      msA: r.ms,
      msB: null,
      originalKeyA: r.originalKey,
      originalKeyB: null,
    })
  }
  for (const r of rowsB) {
    const key = `${r.label}·${r.detail}`
    const existing = map.get(key)
    if (existing) {
      existing.msB = r.ms
      existing.originalKeyB = r.originalKey
    } else {
      map.set(key, {
        key,
        id: r.id,
        label: r.label,
        detail: r.detail,
        kind: r.kind,
        msA: null,
        msB: r.ms,
        originalKeyA: null,
        originalKeyB: r.originalKey,
      })
    }
  }

  return [...map.values()].sort((a, b) => {
    const tA = Math.min(a.msA ?? Infinity, a.msB ?? Infinity)
    const tB = Math.min(b.msA ?? Infinity, b.msB ?? Infinity)
    return tA - tB
  })
}

function fmtDelta(msA: number, msB: number): { text: string; faster: 'A' | 'B' | 'tie' } {
  if (msA === msB) return { text: '0:00', faster: 'tie' }
  const diff = msA - msB
  const abs = Math.abs(diff)
  const m = Math.floor(abs / 60000)
  const s = Math.floor((abs % 60000) / 1000)
  return {
    text: `${diff < 0 ? '−' : '+'}${m}:${String(s).padStart(2, '0')}`,
    faster: diff < 0 ? 'A' : 'B',
  }
}

const thStyle: React.CSSProperties = {
  padding: '.3rem .6rem',
  fontSize: '.6rem',
  letterSpacing: '.08em',
}

const tdStyle: React.CSSProperties = { padding: '.28rem .6rem' }

interface Props {
  replayA: ParserOutput
  replayB: ParserOutput
  fileNameA: string | null
  fileNameB: string | null
  actionsA: PositionedAction[]
  buildingsA: PositionedBuilding[]
  actionsB: PositionedAction[]
  buildingsB: PositionedBuilding[]
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function CompareView({
  replayA,
  replayB,
  fileNameA,
  fileNameB,
  actionsA,
  buildingsA,
  actionsB,
  buildingsB,
}: Props) {
  const playersA = replayA.players ?? []
  const playersB = replayB.players ?? []
  const [idxA, setIdxA] = useState(0)
  const [idxB, setIdxB] = useState(0)

  // Shared heatmap controls
  const maxSecA = useMemo(
    () => (actionsA.length > 0 ? Math.ceil(Math.max(...actionsA.map((a) => a.time)) / 1000) : 600),
    [actionsA],
  )
  const maxSecB = useMemo(
    () => (actionsB.length > 0 ? Math.ceil(Math.max(...actionsB.map((a) => a.time)) / 1000) : 600),
    [actionsB],
  )
  const maxSec = Math.max(maxSecA, maxSecB)
  const [playhead, setPlayhead] = useState(60)
  const [windowSec, setWindowSec] = useState(60)
  const [showBuildings, setShowBuildings] = useState(true)

  const startSec = Math.max(0, Math.min(playhead, maxSec) - windowSec)
  const endSec = Math.min(playhead, maxSec)

  const playerIdColorMapA = useMemo(() => {
    const m: Record<number, string> = {}
    for (const p of replayA.players ?? []) m[p.id] = p.color
    return m
  }, [replayA])

  const playerIdColorMapB = useMemo(() => {
    const m: Record<number, string> = {}
    for (const p of replayB.players ?? []) m[p.id] = p.color
    return m
  }, [replayB])

  const mapFileA = replayA.map?.path ?? ''
  const mapFileB = replayB.map?.path ?? ''

  const showHeatmaps = actionsA.length > 0 || actionsB.length > 0

  // Scope hidden keys to the current player pair so they auto-clear on selection change
  const [hiddenState, setHiddenState] = useState<{
    scopeA: number
    scopeB: number
    keysA: Set<string>
    keysB: Set<string>
  }>({ scopeA: 0, scopeB: 0, keysA: new Set(), keysB: new Set() })
  const scopeMatches = hiddenState.scopeA === idxA && hiddenState.scopeB === idxB
  const hiddenKeysA = scopeMatches ? hiddenState.keysA : EMPTY_SET
  const hiddenKeysB = scopeMatches ? hiddenState.keysB : EMPTY_SET

  const [inactiveIds, setInactiveIds] = useState<Set<string>>(new Set())

  const playerA = playersA[idxA]
  const playerB = playersB[idxB]
  const allMergedRows =
    playerA && playerB ? mergeTimings(playerA, playerB, EMPTY_SET, EMPTY_SET) : []
  const rows: DisplayMergedRow[] = (
    playerA && playerB ? mergeTimings(playerA, playerB, hiddenKeysA, hiddenKeysB) : []
  )
    .filter((r) => !inactiveIds.has(r.id))
    .map((row) => ({ ...row, displayDetail: row.detail }))

  const hideA = (key: string) =>
    setHiddenState({
      scopeA: idxA,
      scopeB: idxB,
      keysA: new Set([...hiddenKeysA, key]),
      keysB: hiddenKeysB,
    })
  const hideB = (key: string) =>
    setHiddenState({
      scopeA: idxA,
      scopeB: idxB,
      keysA: hiddenKeysA,
      keysB: new Set([...hiddenKeysB, key]),
    })
  const resetHidden = () =>
    setHiddenState({ scopeA: idxA, scopeB: idxB, keysA: new Set(), keysB: new Set() })

  const toggleId = (id: string) =>
    setInactiveIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleGroup = (ids: string[], allActive: boolean) =>
    setInactiveIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (allActive ? next.add(id) : next.delete(id)))
      return next
    })

  return (
    <div className="flex flex-col gap-6">
      {/* Player selectors */}
      <div className="flex gap-8">
        {(
          [
            {
              label: 'Replay A',
              players: playersA,
              idx: idxA,
              setIdx: setIdxA,
              fileName: fileNameA,
              player: playerA,
            },
            {
              label: 'Replay B',
              players: playersB,
              idx: idxB,
              setIdx: setIdxB,
              fileName: fileNameB,
              player: playerB,
            },
          ] as const
        ).map(({ label, players, idx, setIdx, fileName, player }) => (
          <div key={label} className="flex flex-col gap-1.5 flex-1 min-w-0">
            <span className="section-label">{label}</span>
            <span className="text-muted truncate" style={{ fontSize: '.68rem' }}>
              {fileName ?? '—'}
            </span>
            <div className="flex items-center gap-2">
              {player && (
                <span
                  className="rounded-full shrink-0"
                  style={{ width: 7, height: 7, background: player.color }}
                />
              )}
              <select
                value={idx}
                onChange={(e) => setIdx(Number(e.target.value))}
                className="flex-1 min-w-0 bg-surface border border-border-hi text-foreground outline-none cursor-pointer"
                style={{ padding: '.3rem .5rem', fontSize: '.75rem' }}
              >
                {players.map((p, i) => (
                  <option key={i} value={i}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Side-by-side heatmaps with shared slider */}
      {showHeatmaps && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <Heatmap
                actions={actionsA}
                buildings={buildingsA}
                mapFile={mapFileA}
                playerIdColorMap={playerIdColorMapA}
                width={500}
                height={500}
                playhead={playhead}
                onPlayheadChange={setPlayhead}
                windowSec={windowSec}
                showBuildings={showBuildings}
                hideControls
              />
            </div>
            <div className="flex-1 min-w-0">
              <Heatmap
                actions={actionsB}
                buildings={buildingsB}
                mapFile={mapFileB}
                playerIdColorMap={playerIdColorMapB}
                width={500}
                height={500}
                playhead={playhead}
                onPlayheadChange={setPlayhead}
                windowSec={windowSec}
                showBuildings={showBuildings}
                hideControls
              />
            </div>
          </div>

          {/* Shared controls */}
          <div className="flex flex-col gap-1.5">
            <input
              type="range"
              min={0}
              max={maxSec}
              step={1}
              value={playhead}
              onChange={(e) => setPlayhead(Number(e.target.value))}
              className="w-full accent-zinc-400 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-zinc-500 select-none">
              <span>{fmt(startSec)}</span>
              <span>{fmt(endSec)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="section-label">Window</span>
              <div className="flex">
                {[10, 30, 45, 60].map((s, i) => (
                  <button
                    key={s}
                    onClick={() => setWindowSec(s)}
                    className="btn-flat"
                    style={{
                      borderRight: i < 3 ? 'none' : undefined,
                      color: windowSec === s ? 'var(--gold)' : undefined,
                      background: windowSec === s ? 'rgba(240,192,48,0.1)' : undefined,
                      borderColor: windowSec === s ? 'rgba(240,192,48,0.6)' : undefined,
                    }}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>
            {(buildingsA.length > 0 || buildingsB.length > 0) && (
              <div className="flex items-center gap-2">
                <span className="section-label">Show</span>
                <button
                  onClick={() => setShowBuildings(!showBuildings)}
                  className="btn-flat"
                  style={{
                    color: showBuildings ? 'var(--gold)' : undefined,
                    background: showBuildings ? 'rgba(240,192,48,0.1)' : undefined,
                    borderColor: showBuildings ? 'rgba(240,192,48,0.6)' : undefined,
                  }}
                >
                  Buildings
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timing filter */}
      <TimingFilter inactiveIds={inactiveIds} onToggle={toggleId} onToggleGroup={toggleGroup} />

      {/* Comparison table */}
      {allMergedRows.length === 0 ? (
        <p className="text-xs text-muted">No key timings found for the selected players.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {hiddenKeysA.size + hiddenKeysB.size > 0 && (
            <div className="text-right" style={{ fontSize: '.65rem' }}>
              <span className="text-muted">{hiddenKeysA.size + hiddenKeysB.size} hidden</span>
              <button
                onClick={resetHidden}
                className="ml-2 text-accent underline"
                style={{
                  font: 'inherit',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                reset
              </button>
            </div>
          )}
          <div className="border border-border bg-surface overflow-x-auto">
            <table
              className="w-full border-collapse wc3-table"
              style={{ fontSize: '.72rem', fontFamily: "'JetBrains Mono', monospace" }}
            >
              <thead className="sticky top-0 bg-surface z-[1]">
                <tr>
                  <th
                    className="text-left text-muted border-b border-border-hi font-normal whitespace-nowrap"
                    style={{ ...thStyle, padding: '.3rem .5rem .3rem .6rem' }}
                  />
                  <th
                    className="text-left text-muted border-b border-border-hi font-normal whitespace-nowrap"
                    style={thStyle}
                  >
                    Event
                  </th>
                  <th
                    className="text-left text-muted border-b border-border-hi font-normal whitespace-nowrap"
                    style={thStyle}
                  >
                    {playerA?.name ?? 'A'}
                  </th>
                  <th
                    className="text-left text-muted border-b border-border-hi font-normal whitespace-nowrap"
                    style={thStyle}
                  >
                    {playerB?.name ?? 'B'}
                  </th>
                  <th
                    className="text-left text-muted border-b border-border-hi font-normal whitespace-nowrap"
                    style={thStyle}
                  >
                    Δ
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const hasBoth = row.msA !== null && row.msB !== null
                  const delta = hasBoth ? fmtDelta(row.msA!, row.msB!) : null
                  const aColor = hasBoth
                    ? delta!.faster === 'A'
                      ? '#4ade80'
                      : delta!.faster === 'tie'
                        ? 'var(--muted)'
                        : '#f87171'
                    : 'var(--muted)'
                  const bColor = hasBoth
                    ? delta!.faster === 'B'
                      ? '#4ade80'
                      : delta!.faster === 'tie'
                        ? 'var(--muted)'
                        : '#f87171'
                    : 'var(--muted)'
                  const deltaColor = delta
                    ? delta.faster === 'A'
                      ? '#4ade80'
                      : delta.faster === 'B'
                        ? '#f87171'
                        : 'var(--muted)'
                    : 'var(--muted)'

                  return (
                    <tr key={i} className="border-b border-border">
                      <td className="align-middle" style={{ padding: '.28rem .4rem .28rem .6rem' }}>
                        <div className="flex items-center justify-center" style={{ width: 16 }}>
                          <EventIcon id={row.id} detail={row.detail} kind={row.kind} />
                        </div>
                      </td>
                      <td className="align-middle whitespace-nowrap" style={tdStyle}>
                        <span className="text-foreground">
                          {TIER_COLOR[row.displayDetail]
                            ? row.label
                            : `${row.label}${row.displayDetail ? ` ${row.displayDetail}` : ''}`}
                        </span>
                        {TIER_COLOR[row.displayDetail] && (
                          <span
                            className="ml-1.5"
                            style={{ color: TIER_COLOR[row.displayDetail], fontSize: '.6rem' }}
                          >
                            {row.displayDetail}
                          </span>
                        )}
                      </td>
                      <td
                        className="align-middle whitespace-nowrap font-mono"
                        style={{ ...tdStyle, color: aColor }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {row.msA !== null ? formatGameTime(row.msA) : '—'}
                          {row.msA !== null && row.originalKeyA && (
                            <button
                              onClick={() => hideA(row.originalKeyA!)}
                              title="Remove this timing for player A"
                              style={{
                                font: 'inherit',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                lineHeight: 1,
                                color: 'var(--muted)',
                                fontSize: '.55rem',
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      </td>
                      <td
                        className="align-middle whitespace-nowrap font-mono"
                        style={{ ...tdStyle, color: bColor }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {row.msB !== null ? formatGameTime(row.msB) : '—'}
                          {row.msB !== null && row.originalKeyB && (
                            <button
                              onClick={() => hideB(row.originalKeyB!)}
                              title="Remove this timing for player B"
                              style={{
                                font: 'inherit',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                lineHeight: 1,
                                color: 'var(--muted)',
                                fontSize: '.55rem',
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      </td>
                      <td
                        className="align-middle whitespace-nowrap font-mono"
                        style={{ ...tdStyle, color: deltaColor }}
                      >
                        {delta ? delta.text : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
