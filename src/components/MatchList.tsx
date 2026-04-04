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
      style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr 1fr 52px 90px',
        alignItems: 'center',
        gap: '1rem',
        padding: '.6rem 1rem',
        cursor: busy ? 'default' : 'pointer',
        opacity: busy && !isDownloading ? 0.4 : 1,
        transition: 'background .1s',
      }}
      onMouseEnter={(e) => {
        if (!busy) (e.currentTarget as HTMLElement).style.background = 'var(--surface)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = ''
      }}
    >
      <span
        className="font-mono"
        style={{
          fontSize: '.62rem',
          fontWeight: 700,
          letterSpacing: '.04em',
          color: won ? '#4ade80' : '#f87171',
          border: `1px solid ${won ? '#4ade80' : '#f87171'}`,
          padding: '1px 3px',
          textAlign: 'center',
        }}
      >
        {won ? 'W' : 'L'}
      </span>

      <span
        style={{
          fontSize: '.78rem',
          color: 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {match.mapName ?? '—'}
      </span>

      <span
        className="font-mono"
        style={{
          fontSize: '.7rem',
          color: 'var(--muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
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

      <span
        className="font-mono"
        style={{ fontSize: '.68rem', color: 'var(--muted)', textAlign: 'right' }}
      >
        {fmtDuration(match.durationInSeconds ?? 0)}
      </span>

      <span
        className="font-mono"
        style={{
          fontSize: '.68rem',
          color: isDownloading ? 'var(--accent)' : 'var(--muted)',
          textAlign: 'right',
          whiteSpace: 'nowrap',
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
      <div style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        {matches.map((match, i) => (
          <div key={match.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <button
            className="btn-flat"
            disabled={offset === 0 || fetching}
            onClick={() => onPageChange(offset - PAGE_SIZE)}
          >
            ← PREV
          </button>
          <span
            className="font-mono"
            style={{ fontSize: '.68rem', color: 'var(--muted)', flex: 1, textAlign: 'center' }}
          >
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
