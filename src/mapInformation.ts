export interface MapInfo {
  displayName: string
  /** WC3 world units. 1 tile = 128 units, e.g. 96 tiles → 12288. */
  width: number
  height: number
  /**
   * WC3 world coordinate of the map center.
   * Non-zero when the map origin is not centered at (0, 0).
   * Defaults to 0 when omitted.
   */
  offset_x?: number
  offset_y?: number
  /** Liquipedia minimap image URL, or empty string if unknown. */
  image: string
}

/*
 * Keys are canonical slugs produced by normalizeMapPath():
 *   - extract filename (strip directory)
 *   - strip .w3x / .w3m extension
 *   - strip leading player-count prefix "(N)"
 *   - strip trailing "_LV" / "LV" (Ladder Version)
 *   - strip all underscores, spaces, hyphens
 *   - lowercase
 *   - strip trailing "s" to unify plural/singular variants
 *
 * e.g. "Maps/FrozenThrone/(2)TerenasStand_LV.w3x" → "terenasstand"
 *      "(4)TwistedMeadows.w3x"                    → "twistedmeadow"
 *      "EchoIsles.w3x"                            → "echoisle"
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, '')

const MAP_DB: Record<string, MapInfo> = {
  lastrefuge: {
    displayName: 'Last Refuge',
    width: 12800,
    height: 12800,
    image: `${base}/maps/lastrefuge.png`,
    offset_x: -240,
    offset_y: -280,
  },
  shatteredexile: {
    displayName: 'Shattered Exile',
    width: 12800,
    height: 12800,
    image: `${base}/maps/shatteredexile.png`,
  },
  autumnleaves: {
    displayName: 'Autumn Leaves',
    width: 12800,
    height: 12800,
    image: `${base}/maps/autumnleaves.png`,
  },
  shallowgrave: {
    displayName: 'Shallow Grave',
    width: 12800,
    height: 12800,
    offset_x: 3100,
    offset_y: 2570,
    image: `${base}/maps/shallowgrave.png`,
  },
}

/**
 * Reduce a raw replay map path to a canonical slug for lookup.
 *
 * "Maps/FrozenThrone/(2)TerenasStand_LV.w3x"  →  "terenasstand"
 * "(4)TwistedMeadows.w3x"                      →  "twistedmeadow"
 * "EchoIsles"                                  →  "echoisle"
 */
export function normalizeMapPath(raw: string): string {
  return raw
    .replace(/\\/g, '/') // unify path separators
    .split('/')
    .pop()! // filename only
    .replace(/\.(w3x|w3m)$/i, '') // drop extension
    .replace(/^\(\d+\)/, '') // drop "(N)" player-count prefix
    .replace(/[_\s-]/g, '') // drop separators
    .replace(/lv$/i, '') // drop "LV" ladder-version suffix
    .toLowerCase()
    .replace(/s$/, '') // singular form  (isles→isle, meadows→meadow …)
}

/**
 * Find the MapInfo for a replay map path.
 *
 * Resolution order (first match wins):
 *   1. Exact slug match after normalisation.
 *   2. A stored slug is a prefix of the normalised input  ("turtlerock" ↔ "turtlerockv2").
 *   3. The normalised input is a prefix of a stored slug  (short/abbreviated names).
 *   4. Either string contains the other (broadest fallback).
 */
export function findMapInfo(mapPath: string): MapInfo | undefined {
  if (!mapPath) return undefined
  const needle = normalizeMapPath(mapPath)
  if (!needle) return undefined

  // 1. exact
  if (MAP_DB[needle]) return MAP_DB[needle]

  // 2–4. progressive relaxation
  let prefixMatch: MapInfo | undefined
  let containsMatch: MapInfo | undefined

  for (const [slug, info] of Object.entries(MAP_DB)) {
    if (!prefixMatch && (needle.startsWith(slug) || slug.startsWith(needle))) {
      prefixMatch = info
    } else if (!containsMatch && (needle.includes(slug) || slug.includes(needle))) {
      containsMatch = info
    }
  }

  return prefixMatch ?? containsMatch
}
