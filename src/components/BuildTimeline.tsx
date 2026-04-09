import type { ParserOutput } from 'w3gjs/dist/types/types'
import { formatGameTime } from '../format'
import { collectRows } from '../timingUtils'

type Player = ParserOutput['players'][number]

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

const TIER_COLOR: Record<string, string> = {
  Adept: '#7dd3fc',
  Master: 'var(--accent)',
}

function EventIcon({
  id,
  detail,
  kind,
}: {
  id: string
  detail: string
  kind: 'building' | 'upgrade'
}) {
  if (kind === 'building') {
    return (
      <img
        src={`${BASE}/buildings/${id}.png`}
        width={16}
        height={16}
        style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
      />
    )
  }
  const suffix = detail ? `_${detail}` : ''
  return (
    <img
      src={`${BASE}/upgrades/${id}${suffix}.png`}
      width={16}
      height={16}
      style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
    />
  )
}

interface Props {
  players: Player[]
}

export default function BuildTimeline({ players }: Props) {
  const rows = collectRows(players)
  if (rows.length === 0) return null

  return (
    <div className="overflow-y-auto max-h-[500px] border border-border bg-surface">
      <table
        className="w-full border-collapse wc3-table"
        style={{ fontSize: '.72rem', fontFamily: "'JetBrains Mono', monospace" }}
      >
        <thead className="sticky top-0 bg-surface z-[1]">
          <tr>
            {([' ', 'Time', 'Player', 'Event', 'Tier'] as const).map((col) => (
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
          {rows.map((row, i) => (
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
                {row.label}
              </td>
              <td
                className="align-middle whitespace-nowrap"
                style={{
                  padding: '.28rem .6rem',
                  color: TIER_COLOR[row.detail] ?? undefined,
                }}
              >
                {row.detail}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
