export const API_BASE = 'https://website-backend.w3champions.com/api'
export const PAGE_SIZE = 10

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 1 week

export const GATEWAYS = [
  { label: 'Europe', value: '20' },
  { label: 'Americas', value: '10' },
  { label: 'Asia', value: '30' },
]

export const RACE_LABELS: Record<number, string> = {
  1: 'HU',
  2: 'OC',
  4: 'NE',
  8: 'UD',
  16: 'RN',
}

export interface Player {
  battleTag: string
  race: number
  won: boolean
  currentMmr?: number
  mmrGain?: number
}

export interface Match {
  id: string
  mapName: string
  teams: Array<{ players: Player[] }>
  endTime: string
  gameMode: number
  durationInSeconds: number
}

interface LadderEntry {
  player: {
    playerIds: Array<{ battleTag: string }>
    mmr: number
  }
}

export async function fetchMatches(
  playerId: string,
  gateway: string,
  season: string,
  offset: number,
): Promise<{ matches: Match[]; count: number }> {
  const params = new URLSearchParams({
    playerId,
    gateway,
    season,
    offset: String(offset),
    pageSize: String(PAGE_SIZE),
  })
  const res = await fetch(`${API_BASE}/matches/search?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return { matches: data.matches ?? [], count: data.count ?? 0 }
}

export async function fetchReplay(matchId: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API_BASE}/replays/${matchId}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.arrayBuffer()
}

export async function fetchTopPlayerTags(season: string, gateway: string): Promise<string[]> {
  const cacheKey = `w3c_top_players_s${season}_gw${gateway}`

  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { tags, fetchedAt } = JSON.parse(cached) as { tags: string[]; fetchedAt: number }
      if (Date.now() - fetchedAt < CACHE_TTL) return tags
    }
  } catch {
    // corrupted entry — fall through to fetch
  }

  const leagues = await Promise.all(
    [0, 1, 2].map((leagueId) =>
      fetch(`${API_BASE}/ladder/${leagueId}?season=${season}&gateWay=${gateway}&gameMode=1`)
        .then((r) => (r.ok ? (r.json() as Promise<LadderEntry[]>) : []))
        .catch((): LadderEntry[] => []),
    ),
  )

  const combined = leagues.flat()
  combined.sort((a, b) => (b.player?.mmr ?? 0) - (a.player?.mmr ?? 0))

  const seen = new Set<string>()
  for (const entry of combined) {
    const battleTag = entry.player?.playerIds?.[0]?.battleTag
    if (battleTag) seen.add(battleTag)
    if (seen.size === 250) break
  }
  const tags = [...seen]

  try {
    localStorage.setItem(cacheKey, JSON.stringify({ tags, fetchedAt: Date.now() }))
  } catch {
    // localStorage full or unavailable — skip caching
  }

  return tags
}
