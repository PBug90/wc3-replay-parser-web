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
  // ── 1on1 ladder ──────────────────────────────────────────────────────────
  autumnleaves: {
    displayName: 'Autumn Leaves',
    width: 12544, // 98 tiles
    height: 12544,
    image: `${base}/maps/autumnleaves.png`,
  },
  bouldervale: {
    displayName: 'Boulder Vale',
    width: 12288, // 96 tiles
    height: 10752, // 84 tiles
    image: `${base}/maps/bouldervale.png`,
  },
  concealedhill: {
    displayName: 'Concealed Hill',
    width: 10240, // 80 tiles
    height: 12544, // 98 tiles
    image: `${base}/maps/concealedhill.png`,
  },
  echoisle2: {
    displayName: 'Echo Isles 2',
    width: 13824, // 108 tiles
    height: 11264, // 88 tiles
    offset_x: -1000,
    offset_y: 1600,
    image: `${base}/maps/echoisle2.png`,
  },
  hammerfall: {
    displayName: 'Hammerfall',
    width: 10752, // 84 tiles
    height: 10752,
    image: `${base}/maps/hammerfall.png`,
  },
  lastrefuge: {
    displayName: 'Last Refuge',
    width: 10752, // 84 tiles
    height: 10752,
    image: `${base}/maps/lastrefuge.png`,
    offset_x: -240,
    offset_y: -280,
  },
  northernisles: {
    displayName: 'Northern Isles',
    width: 13824, // 108 tiles
    height: 11008, // 86 tiles
    image: `${base}/maps/northernisles.png`,
    offset_x: 2040,
  },
  scrimmage: {
    displayName: 'Scrimmage',
    width: 14336, // 112 tiles
    height: 10240, // 80 tiles
    image: `${base}/maps/scrimmage.png`,
  },
  shallowgrave: {
    displayName: 'Shallow Grave',
    width: 12288, // 96 tiles
    height: 12288,
    offset_x: 3100,
    offset_y: 2570,
    image: `${base}/maps/shallowgrave.png`,
  },
  springtime: {
    displayName: 'Springtime',
    width: 11520, // 90 tiles
    height: 11520,
    image: `${base}/maps/springtime.png`,
  },
  tidehunters: {
    displayName: 'Tidehunters',
    width: 11520, // 90 tiles
    height: 11520,
    image: `${base}/maps/tidehunters.png`,
  },
  turtlerock2: {
    displayName: 'Turtle Rock 2',
    width: 13312, // 104 tiles
    height: 13312,
    image: `${base}/maps/turtlerock2.png`,
  },

  // ── 2on2 ladder ──────────────────────────────────────────────────────────
  avalanche: {
    displayName: 'Avalanche',
    width: 12288, // 96 tiles
    height: 12288,
    image: `${base}/maps/avalanche.png`,
  },
  basaltbasin: {
    displayName: 'Basalt Basin',
    width: 13824, // 108 tiles
    height: 13824,
    image: `${base}/maps/basaltbasin.png`,
  },
  dalarangarden: {
    displayName: 'Dalaran Garden',
    width: 15360, // 120 tiles
    height: 15616, // 122 tiles
    image: `${base}/maps/dalarangarden.png`,
  },
  faeriescrossing: {
    displayName: 'Faeries Crossing',
    width: 12288, // 96 tiles
    height: 11264, // 88 tiles
    image: `${base}/maps/faeriescrossing.jpg`,
  },
  fortpearl: {
    displayName: 'Fort Pearl',
    width: 16128, // 126 tiles
    height: 16128,
    image: `${base}/maps/fortpearl.png`,
  },
  gnollwood: {
    displayName: 'Gnoll Wood',
    width: 16384, // 128 tiles
    height: 16384,
    image: `${base}/maps/gnollwood.png`,
  },
  hillsbradcreek: {
    displayName: 'Hillsbrad Creek',
    width: 16384, // 128 tiles
    height: 16384,
    image: `${base}/maps/hillsbradcreek.png`,
  },
  kaldrassil: {
    displayName: "Kal'drassil",
    width: 14336, // 112 tiles
    height: 14336,
    image: `${base}/maps/kaldrassil.png`,
  },
  kingandcountry: {
    displayName: 'King and Country',
    width: 14336, // 112 tiles
    height: 14336,
    image: `${base}/maps/kingandcountry.png`,
  },
  shatteredexile: {
    displayName: 'Shattered Exile',
    width: 12288, // 96 tiles
    height: 11520, // 90 tiles
    image: `${base}/maps/shatteredexile.png`,
  },
  twistedmeadows: {
    displayName: 'Twisted Meadows',
    width: 15872, // 124 tiles
    height: 15872,
    image: `${base}/maps/twistedmeadows.png`,
  },
  witheringfields: {
    displayName: 'Withering Fields',
    width: 12288, // 96 tiles
    height: 12288,
    image: `${base}/maps/witheringfields.png`,
  },
}

/**
 * Reduce a raw replay map path to a canonical slug for lookup.
 *
 * "Maps/FrozenThrone/(2)TerenasStand_LV.w3x"              →  "terenasstand"
 * "(4)TwistedMeadows.w3x"                                  →  "twistedmeadow"
 * "EchoIsles"                                               →  "echoisle"
 * "1v1_EchoIsles_v2.2_w3c_260125_1357_1051.w3x"           →  "echoisle"
 * "12_w3c_251104_0950_TurtleRock_v2.0.w3x"                →  "turtlerock"
 */
export function normalizeMapPath(raw: string): string {
  return raw
    .replace(/\\/g, '/') // unify path separators
    .split('/')
    .pop()! // filename only
    .replace(/\.(w3x|w3m)$/i, '') // drop extension
    .replace(/^\d+v\d+[_\s-]/i, '') // drop "1v1_" / "2v2_" W3C player-count prefix (map name before _w3c_)
    .replace(/^\d+[_\s-]w3c[_\s-]\d+[_\s-]\d+[_\s-]/i, '') // drop "12_w3c_251104_0950_" W3C prefix (map name after _w3c_)
    .replace(/[_\s-]w3c[_\s-].*$/i, '') // drop "_w3c_260125_1357_1051" W3Champions suffix
    .replace(/[_\s-]v\d+(?:\.\d+)*$/i, '') // drop "_v2.2" / "_v2.0" version suffix
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
