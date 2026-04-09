import { useState, useCallback, useEffect } from 'react'
import { fetchMatches, fetchReplay, fetchTopPlayerTags, Match } from '../api/w3c'
import PlayerSearchInput from './PlayerSearchInput'
import MatchList from './MatchList'

interface Props {
  loading: boolean
  onBuffer: (buffer: ArrayBuffer, name: string) => void
}

export default function W3CMatchBrowser({ loading, onBuffer }: Props) {
  const [tag, setTag] = useState('')
  const [season, setSeason] = useState('24')
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
    fetchTopPlayerTags(season)
      .then((tags) => {
        if (!cancelled) setTopPlayers(tags)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [season])

  const search = useCallback(
    async (newOffset = 0) => {
      const trimmed = tag.trim()
      if (!trimmed) return
      setFetching(true)
      setFetchError(null)
      setLastSearchedTag(trimmed)
      try {
        const { matches: m, count: c } = await fetchMatches(trimmed, season, newOffset)
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
    [tag, season],
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
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="flex gap-2">
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

      {/* Season */}
      <div className="flex items-center gap-2">
        <span
          className="font-mono text-muted"
          style={{ fontSize: '.68rem', letterSpacing: '.06em' }}
        >
          SEASON
        </span>
        <input
          type="number"
          value={season}
          min={1}
          onChange={(e) => setSeason(e.target.value)}
          className="font-mono bg-surface border border-border-hi text-foreground text-center outline-none"
          style={{
            width: 52,
            padding: '.3rem .5rem',
            fontSize: '.75rem',
          }}
        />
      </div>

      {/* Error */}
      {fetchError && (
        <span className="font-mono text-red-300" style={{ fontSize: '.72rem' }}>
          {fetchError}
        </span>
      )}

      {/* Empty hint */}
      {!fetching && !fetchError && matches.length === 0 && (
        <p className="text-muted text-center m-0 py-8" style={{ fontSize: '.75rem' }}>
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
