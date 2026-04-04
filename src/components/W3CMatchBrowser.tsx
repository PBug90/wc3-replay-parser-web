import { useState, useCallback, useEffect } from 'react'
import { fetchMatches, fetchReplay, fetchTopPlayerTags, GATEWAYS, Match } from '../api/w3c'
import PlayerSearchInput from './PlayerSearchInput'
import MatchList from './MatchList'

interface Props {
  loading: boolean
  onBuffer: (buffer: ArrayBuffer, name: string) => void
}

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
  const [topPlayers, setTopPlayers] = useState<string[]>([])
  const [lastSearchedTag, setLastSearchedTag] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchTopPlayerTags(season, gateway)
      .then((tags) => {
        if (!cancelled) setTopPlayers(tags)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [season, gateway])

  const search = useCallback(
    async (newOffset = 0) => {
      const trimmed = tag.trim()
      if (!trimmed) return
      setFetching(true)
      setFetchError(null)
      setLastSearchedTag(trimmed)
      try {
        const { matches: m, count: c } = await fetchMatches(trimmed, gateway, season, newOffset)
        setMatches(m)
        setCount(c)
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

  const handleSelectMatch = useCallback(
    async (match: Match) => {
      setDownloadingId(match.id)
      setFetchError(null)
      try {
        const buffer = await fetchReplay(match.id)
        onBuffer(buffer, `${match.id}.w3g`)
      } catch (e) {
        setFetchError(e instanceof Error ? e.message : 'Failed to download replay')
      } finally {
        setDownloadingId(null)
      }
    },
    [onBuffer],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Search bar */}
      <div style={{ display: 'flex', gap: '.5rem' }}>
        <PlayerSearchInput
          value={tag}
          onChange={setTag}
          onSearch={() => search(0)}
          disabled={fetching || loading}
          topPlayers={topPlayers}
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
          {lastSearchedTag
            ? `No matches found for ${lastSearchedTag}`
            : 'Enter a BattleTag to browse recent W3Champions matches'}
        </p>
      )}

      {/* Match list */}
      {matches.length > 0 && (
        <MatchList
          matches={matches}
          tagLower={tag.trim().toLowerCase()}
          downloadingId={downloadingId}
          loading={loading}
          fetching={fetching}
          count={count}
          offset={offset}
          onSelectMatch={handleSelectMatch}
          onPageChange={search}
        />
      )}
    </div>
  )
}
