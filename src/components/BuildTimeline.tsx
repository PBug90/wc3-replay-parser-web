import { useState } from 'react'
import type { ParserOutput } from 'w3gjs/dist/types/types'
import { formatGameTime } from '../format'
import { collectRows, rowIdentityKey, TIER_COLOR, type TimingRow } from '../timingUtils'
import TimingFilter from './TimingFilter'
import { EventIcon } from './EventIcon'

type Player = ParserOutput['players'][number]

type DisplayRow = TimingRow & { displayDetail: string; originalKey: string }

function removeHiddenRowsByKeys(rows: TimingRow[], hiddenKeys: Set<string>): DisplayRow[] {
  const filtered = rows.filter((r) => !hiddenKeys.has(rowIdentityKey(r)))
  const counter: Record<string, number> = {}
  return filtered.map((row) => {
    const originalKey = rowIdentityKey(row)
    if (row.detail === 'Adept' || row.detail === 'Master')
      return { ...row, displayDetail: row.detail, originalKey }
    const groupKey = `${row.player.name}:${row.id}`
    counter[groupKey] = (counter[groupKey] ?? 0) + 1
    return { ...row, displayDetail: `#${counter[groupKey]}`, originalKey }
  })
}

interface Props {
  players: Player[]
}

export default function BuildTimeline({ players }: Props) {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set())
  const [inactiveIds, setInactiveIds] = useState<Set<string>>(new Set())

  const allRows = collectRows(players)
  if (allRows.length === 0) return null

  const typeFiltered = allRows.filter((r) => !inactiveIds.has(r.id))
  const displayRows = removeHiddenRowsByKeys(typeFiltered, hiddenKeys)

  const hide = (originalKey: string) => setHiddenKeys((prev) => new Set([...prev, originalKey]))
  const reset = () => setHiddenKeys(new Set())

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
    <div className="flex flex-col gap-1">
      <TimingFilter inactiveIds={inactiveIds} onToggle={toggleId} onToggleGroup={toggleGroup} />
      {hiddenKeys.size > 0 && (
        <div className="text-right" style={{ fontSize: '.65rem' }}>
          <span className="text-muted">{hiddenKeys.size} hidden</span>
          <button
            onClick={reset}
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
      <div className="overflow-y-auto max-h-[500px] border border-border bg-surface">
        <table
          className="w-full border-collapse wc3-table"
          style={{ fontSize: '.72rem', fontFamily: "'JetBrains Mono', monospace" }}
        >
          <thead className="sticky top-0 bg-surface z-[1]">
            <tr>
              {([' ', 'Time', 'Player', 'Event', 'Tier', ''] as const).map((col) => (
                <th
                  key={col}
                  className="text-left text-muted border-b border-border-hi font-normal whitespace-nowrap"
                  style={{ padding: '.3rem .6rem', fontSize: '.6rem', letterSpacing: '.08em' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={i} className="border-b border-border">
                <td className="align-middle" style={{ padding: '.28rem .6rem .28rem .5rem' }}>
                  <div className="flex items-center justify-center" style={{ width: 16 }}>
                    <EventIcon id={row.id} detail={row.detail} kind={row.kind} />
                  </div>
                </td>
                <td
                  className="text-accent align-middle whitespace-nowrap"
                  style={{ padding: '.28rem .6rem' }}
                >
                  {formatGameTime(row.ms)}
                </td>
                <td className="align-middle whitespace-nowrap" style={{ padding: '.28rem .6rem' }}>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="rounded-full flex-shrink-0"
                      style={{ width: 6, height: 6, background: row.player.color }}
                    />
                    <span
                      className="text-foreground overflow-hidden text-ellipsis"
                      style={{ maxWidth: 100 }}
                    >
                      {row.player.name}
                    </span>
                  </span>
                </td>
                <td
                  className="text-foreground align-middle whitespace-nowrap"
                  style={{ padding: '.28rem .6rem' }}
                >
                  {TIER_COLOR[row.displayDetail]
                    ? row.label
                    : `${row.label}${row.displayDetail ? ` ${row.displayDetail}` : ''}`}
                </td>
                <td
                  className="align-middle whitespace-nowrap"
                  style={{
                    padding: '.28rem .6rem',
                    color: TIER_COLOR[row.displayDetail] ?? undefined,
                  }}
                >
                  {TIER_COLOR[row.displayDetail] ? row.displayDetail : null}
                </td>
                <td className="align-middle" style={{ padding: '.28rem .4rem' }}>
                  <button
                    onClick={() => hide(row.originalKey)}
                    title="Remove from timings"
                    style={{
                      font: 'inherit',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0 .2rem',
                      lineHeight: 1,
                      color: 'var(--muted)',
                    }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
