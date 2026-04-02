import { useState, useCallback } from 'react'

const API_BASE = 'https://website-backend.w3champions.com/api'
const PAGE_SIZE = 10

const RACE_LABELS: Record<number, string> = {
  1: 'HU',
  2: 'OC',
  4: 'NE',
  8: 'UD',
  16: 'RN',
}

interface Player {
  battleTag: string
  race: number
  won: boolean
  currentMmr?: number
  mmrGain?: number
}

interface Match {
  id: string
  mapName: string
  teams: Array<{ players: Player[] }>
  endTime: string
  gameMode: number
  durationInSeconds: number
}

interface Props {
  loading: boolean
  onBuffer: (buffer: ArrayBuffer, name: string) => void
}

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

const GATEWAYS = [
  { label: 'Europe', value: '20' },
  { label: 'Americas', value: '10' },
  { label: 'Asia', value: '30' },
]

export default function W3CMatchBrowser({ loading, onBuffer }: Props) {
  const [tag, setTag] = useState('')
  const [season, setSeason] = useState('24')
  const [gateway, setGateway] = useState('20')
  const [matches, setMatches] = useState<Match[]>([])
  const [count, setCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const search = useCallback(
    async (newOffset = 0) => {
      const trimmed = tag.trim()
      if (!trimmed) return
      setFetching(true)
      setFetchError(null)
      try {
        const params = new URLSearchParams({
          playerId: trimmed,
          gateway,
          season,
          offset: String(newOffset),
          pageSize: String(PAGE_SIZE),
        })
        const res = await fetch(`${API_BASE}/matches/search?${params}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setMatches(data.matches ?? [])
        setCount(data.count ?? 0)
        setOffset(newOffset)
      } catch (e) {
        setFetchError(e instanceof Error ? e.message : 'Request failed')
        setMatches([])
      } finally {
        setFetching(false)
      }
    },
    [tag, season, gateway],
  )

  const parseReplay = useCallback(
    async (match: Match) => {
      setDownloadingId(match.id)
      setFetchError(null)
      try {
        const res = await fetch(`${API_BASE}/replays/${match.id}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buffer = await res.arrayBuffer()
        onBuffer(buffer, `${match.id}.w3g`)
      } catch (e) {
        setFetchError(e instanceof Error ? e.message : 'Failed to download replay')
      } finally {
        setDownloadingId(null)
      }
    },
    [onBuffer],
  )

  const tagLower = tag.trim().toLowerCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Search bar */}
      <div style={{ display: 'flex', gap: '.5rem' }}>
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search(0)}
          placeholder="BattleTag — e.g. Grubby#2759"
          disabled={fetching || loading}
          className="font-mono"
          style={{
            flex: 1,
            background: 'var(--surface)',
            border: '1px solid var(--border-hi)',
            color: 'var(--text)',
            padding: '.5rem .75rem',
            fontSize: '.78rem',
            letterSpacing: '.03em',
            outline: 'none',
          }}
        />
        <button
          className="btn-flat"
          onClick={() => search(0)}
          disabled={fetching || loading || !tag.trim()}
        >
          {fetching ? 'SEARCHING…' : 'SEARCH'}
        </button>
      </div>

      {/* Season + Gateway */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span
            className="font-mono"
            style={{ fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.06em' }}
          >
            SEASON
          </span>
          <input
            type="number"
            value={season}
            min={1}
            onChange={(e) => setSeason(e.target.value)}
            className="font-mono"
            style={{
              width: 52,
              background: 'var(--surface)',
              border: '1px solid var(--border-hi)',
              color: 'var(--text)',
              padding: '.3rem .5rem',
              fontSize: '.75rem',
              textAlign: 'center',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span
            className="font-mono"
            style={{ fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.06em' }}
          >
            GATEWAY
          </span>
          <div style={{ display: 'flex', gap: '.35rem' }}>
            {GATEWAYS.map((gw) => (
              <button
                key={gw.value}
                className="btn-flat"
                onClick={() => setGateway(gw.value)}
                style={{
                  fontSize: '.65rem',
                  padding: '.25rem .6rem',
                  borderColor: gateway === gw.value ? 'var(--accent)' : undefined,
                  color: gateway === gw.value ? 'var(--accent)' : undefined,
                }}
              >
                {gw.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {fetchError && (
        <span className="font-mono" style={{ fontSize: '.72rem', color: '#fca5a5' }}>
          {fetchError}
        </span>
      )}

      {/* Empty hint */}
      {!fetching && !fetchError && matches.length === 0 && (
        <p
          style={{
            fontSize: '.75rem',
            color: 'var(--muted)',
            textAlign: 'center',
            padding: '2rem 0',
            margin: 0,
          }}
        >
          Enter a BattleTag to browse recent W3Champions matches
        </p>
      )}

      {/* Match list */}
      {matches.length > 0 && (
        <div
          style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}
        >
          {matches.map((match, i) => {
            const allPlayers = match.teams?.flatMap((t) => t.players) ?? []
            const me = allPlayers.find((p) => p.battleTag.toLowerCase() === tagLower)
            const opponents = allPlayers.filter((p) => p.battleTag.toLowerCase() !== tagLower)
            const won = me?.won ?? false
            const isLoading = downloadingId === match.id

            return (
              <div
                key={match.id}
                onClick={() => !loading && !downloadingId && parseReplay(match)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr 1fr 52px 90px',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '.6rem 1rem',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  cursor: loading || !!downloadingId ? 'default' : 'pointer',
                  opacity: !!downloadingId && !isLoading ? 0.4 : 1,
                  transition: 'background .1s',
                }}
                onMouseEnter={(e) => {
                  if (!loading && !downloadingId)
                    (e.currentTarget as HTMLElement).style.background = 'var(--surface)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = ''
                }}
              >
                {/* W / L */}
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

                {/* Map */}
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

                {/* Opponents */}
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

                {/* Duration */}
                <span
                  className="font-mono"
                  style={{ fontSize: '.68rem', color: 'var(--muted)', textAlign: 'right' }}
                >
                  {fmtDuration(match.durationInSeconds ?? 0)}
                </span>

                {/* Date / status */}
                <span
                  className="font-mono"
                  style={{
                    fontSize: '.68rem',
                    color: isLoading ? 'var(--accent)' : 'var(--muted)',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isLoading ? 'Downloading…' : fmtDate(match.endTime)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {count > PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <button
            className="btn-flat"
            disabled={offset === 0 || fetching}
            onClick={() => search(offset - PAGE_SIZE)}
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
            onClick={() => search(offset + PAGE_SIZE)}
          >
            NEXT →
          </button>
        </div>
      )}
    </div>
  )
}
