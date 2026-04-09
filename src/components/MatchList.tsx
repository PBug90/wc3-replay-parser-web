import { Match, RACE_LABELS, PAGE_SIZE } from '../api/w3c'

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface MatchRowProps {
  match: Match
  tagLower: string
  isDownloading: boolean
  busy: boolean
  onSelect: (match: Match) => void
}

function MatchRow({ match, tagLower, isDownloading, busy, onSelect }: MatchRowProps) {
  const allPlayers = match.teams?.flatMap((t) => t.players) ?? []
  const me = allPlayers.find((p) => p.battleTag.toLowerCase() === tagLower)
  const opponents = allPlayers.filter((p) => p.battleTag.toLowerCase() !== tagLower)
  const won = me?.won ?? false

  return (
    <div
      onClick={() => !busy && onSelect(match)}
      className="grid items-center gap-4 transition-[background] duration-100"
      style={{
        gridTemplateColumns: '28px 1fr 1fr 52px 90px',
        padding: '.6rem 1rem',
        cursor: busy ? 'default' : 'pointer',
        opacity: busy && !isDownloading ? 0.4 : 1,
      }}
      onMouseEnter={(e) => {
        if (!busy) (e.currentTarget as HTMLElement).style.background = 'var(--surface)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = ''
      }}
    >
      <span
        className="font-mono text-center"
        style={{
          fontSize: '.62rem',
          fontWeight: 700,
          letterSpacing: '.04em',
          color: won ? '#4ade80' : '#f87171',
          border: `1px solid ${won ? '#4ade80' : '#f87171'}`,
          padding: '1px 3px',
        }}
      >
        {won ? 'W' : 'L'}
      </span>

      <span
        className="text-foreground overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ fontSize: '.78rem' }}
      >
        {match.mapName ?? '—'}
      </span>

      <span
        className="font-mono text-muted overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ fontSize: '.7rem' }}
      >
        vs{' '}
        {opponents
          .map((p) => {
            const name = p.battleTag.split('#')[0]
            const race = RACE_LABELS[p.race]
            return race ? `${name} (${race})` : name
          })
          .join(', ')}
      </span>

      <span className="font-mono text-muted text-right" style={{ fontSize: '.68rem' }}>
        {fmtDuration(match.durationInSeconds ?? 0)}
      </span>

      <span
        className="font-mono text-right whitespace-nowrap"
        style={{
          fontSize: '.68rem',
          color: isDownloading ? 'var(--accent)' : 'var(--muted)',
        }}
      >
        {isDownloading ? 'Downloading…' : fmtDate(match.endTime)}
      </span>
    </div>
  )
}

interface MatchListProps {
  matches: Match[]
  tagLower: string
  downloadingId: string | null
  loading: boolean
  fetching: boolean
  count: number
  offset: number
  onSelectMatch: (match: Match) => void
  onPageChange: (offset: number) => void
}

export default function MatchList({
  matches,
  tagLower,
  downloadingId,
  loading,
  fetching,
  count,
  offset,
  onSelectMatch,
  onPageChange,
}: MatchListProps) {
  const busy = loading || !!downloadingId

  return (
    <>
      <div className="border border-border flex flex-col">
        {matches.map((match, i) => (
          <div key={match.id} className={i > 0 ? 'border-t border-border' : ''}>
            <MatchRow
              match={match}
              tagLower={tagLower}
              isDownloading={downloadingId === match.id}
              busy={busy}
              onSelect={onSelectMatch}
            />
          </div>
        ))}
      </div>

      {count > PAGE_SIZE && (
        <div className="flex items-center gap-3">
          <button
            className="btn-flat"
            disabled={offset === 0 || fetching}
            onClick={() => onPageChange(offset - PAGE_SIZE)}
          >
            ← PREV
          </button>
          <span className="font-mono text-muted flex-1 text-center" style={{ fontSize: '.68rem' }}>
            {offset + 1}–{Math.min(offset + PAGE_SIZE, count)} of {count}
          </span>
          <button
            className="btn-flat"
            disabled={offset + PAGE_SIZE >= count || fetching}
            onClick={() => onPageChange(offset + PAGE_SIZE)}
          >
            NEXT →
          </button>
        </div>
      )}
    </>
  )
}
