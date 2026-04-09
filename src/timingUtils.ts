import type { ParserOutput } from 'w3gjs/dist/types/types'
import { BUILDING_NAMES, UPGRADE_NAMES } from './w3g-names'

type Player = ParserOutput['players'][number]

export const KEY_BUILDINGS = new Set([
  'htow',
  'ugol',
  'etol',
  'ogre',
  'hkee',
  'hcas',
  'etoa',
  'etoe',
  'unp1',
  'unp2',
  'ostr',
  'ofrt',
])

export const TRAINING_UPGRADES: Record<string, string> = {
  Rhpt: 'Priest',
  Rhst: 'Sorc',
  Redt: 'DotT',
  Redc: 'DotC',
  Rost: 'Shaman',
  Rowd: 'WD',
  Rowt: 'SW',
  Rune: 'Necro',
  Ruba: 'Ban',
}

export const SINGLE_UPGRADES: Record<string, string> = {
  Rusp: 'Destroyer',
  Robk: 'Berserker',
}

export type TimingRow = {
  ms: number
  player: Player
  id: string
  label: string
  detail: string
  kind: 'building' | 'upgrade'
}

export function collectRows(players: Player[]): TimingRow[] {
  const rows: TimingRow[] = []

  for (const player of players) {
    for (const b of player.buildings?.order ?? []) {
      if (!KEY_BUILDINGS.has(b.id)) continue
      rows.push({
        ms: b.ms,
        player,
        id: b.id,
        label: BUILDING_NAMES[b.id] ?? b.id,
        detail: '',
        kind: 'building',
      })
    }

    const seen: Record<string, number> = {}
    const upgrades = [...(player.upgrades?.order ?? [])].sort((a, b) => a.ms - b.ms)
    for (const u of upgrades) {
      if (TRAINING_UPGRADES[u.id]) {
        seen[u.id] = (seen[u.id] ?? 0) + 1
        if (seen[u.id] > 2) continue
        const tier = seen[u.id] === 1 ? 'Adept' : 'Master'
        const name = UPGRADE_NAMES[u.id]?.replace(/^p_/, '') ?? TRAINING_UPGRADES[u.id]
        rows.push({ ms: u.ms, player, id: u.id, label: name, detail: tier, kind: 'upgrade' })
      } else if (SINGLE_UPGRADES[u.id]) {
        seen[u.id] = (seen[u.id] ?? 0) + 1
        if (seen[u.id] > 1) continue
        const name = UPGRADE_NAMES[u.id]?.replace(/^p_/, '') ?? SINGLE_UPGRADES[u.id]
        rows.push({ ms: u.ms, player, id: u.id, label: name, detail: '', kind: 'upgrade' })
      }
    }
  }

  return rows.sort((a, b) => a.ms - b.ms)
}
