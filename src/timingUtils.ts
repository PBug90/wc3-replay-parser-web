import type { ParserOutput } from 'w3gjs/dist/types/types'
import { BUILDING_NAMES, UPGRADE_NAMES } from './w3g-names'

type Player = ParserOutput['players'][number]

// All known buildings
export const KEY_BUILDINGS = new Set(Object.keys(BUILDING_NAMES))

// Two-tier training upgrades (Adept → Master)
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

// Upgrades to exclude from timing tracking
const SKIP_UPGRADES = new Set([
  'Rhpm',
  'Ropm',
  'Repm',
  'Rupm', // Backpack (shared across races)
  'Roch', // Chaos (too situational)
])

export type TimingRow = {
  ms: number
  player: Player
  id: string
  label: string
  detail: string
  kind: 'building' | 'upgrade'
}

export const TIER_COLOR: Record<string, string> = {
  Adept: '#7dd3fc',
  Master: 'var(--accent)',
}

export type RaceEntity = {
  id: string
  label: string
  kind: 'building' | 'upgrade'
  iconSuffix: string
}

export type RaceGroup = {
  name: string
  abbr: string
  entities: RaceEntity[]
}

function buildRaceGroups(): RaceGroup[] {
  const buildingEntity = ([id, label]: [string, string]): RaceEntity => ({
    id,
    label,
    kind: 'building',
    iconSuffix: '',
  })

  const upgradeEntity = ([id, name]: [string, string]): RaceEntity => ({
    id,
    label: name.replace(/^p_/, ''),
    kind: 'upgrade',
    iconSuffix: TRAINING_UPGRADES[id] ? '_Adept' : '',
  })

  const buildings = Object.entries(BUILDING_NAMES)
  const upgrades = Object.entries(UPGRADE_NAMES).filter(([id]) => !SKIP_UPGRADES.has(id))

  return [
    {
      name: 'Human',
      abbr: 'HU',
      entities: [
        ...buildings.filter(([id]) => id.startsWith('h')).map(buildingEntity),
        ...upgrades.filter(([id]) => id.startsWith('Rh')).map(upgradeEntity),
      ],
    },
    {
      name: 'Orc',
      abbr: 'ORC',
      entities: [
        ...buildings.filter(([id]) => id.startsWith('o')).map(buildingEntity),
        ...upgrades.filter(([id]) => id.startsWith('Ro') || id.startsWith('Rw')).map(upgradeEntity),
      ],
    },
    {
      name: 'Night Elf',
      abbr: 'NE',
      entities: [
        ...buildings.filter(([id]) => id.startsWith('e')).map(buildingEntity),
        ...upgrades.filter(([id]) => id.startsWith('Re')).map(upgradeEntity),
      ],
    },
    {
      name: 'Undead',
      abbr: 'UD',
      entities: [
        ...buildings.filter(([id]) => id.startsWith('u')).map(buildingEntity),
        ...upgrades.filter(([id]) => id.startsWith('Ru')).map(upgradeEntity),
      ],
    },
  ]
}

export const RACE_GROUPS: RaceGroup[] = buildRaceGroups()

export function rowIdentityKey(row: TimingRow): string {
  return `${row.player.name}:${row.id}:${row.detail}`
}

export function collectRows(players: Player[]): TimingRow[] {
  const rows: TimingRow[] = []

  for (const player of players) {
    const buildingSeen: Record<string, number> = {}
    for (const b of player.buildings?.order ?? []) {
      if (!KEY_BUILDINGS.has(b.id)) continue
      buildingSeen[b.id] = (buildingSeen[b.id] ?? 0) + 1
      rows.push({
        ms: b.ms,
        player,
        id: b.id,
        label: BUILDING_NAMES[b.id] ?? b.id,
        detail: String(buildingSeen[b.id]),
        kind: 'building',
      })
    }

    const seen: Record<string, number> = {}
    const upgrades = [...(player.upgrades?.order ?? [])].sort((a, b) => a.ms - b.ms)
    for (const u of upgrades) {
      const id = u.id
      if (SKIP_UPGRADES.has(id) || !UPGRADE_NAMES[id]) continue
      seen[id] = (seen[id] ?? 0) + 1
      const name = UPGRADE_NAMES[id].replace(/^p_/, '')
      if (TRAINING_UPGRADES[id]) {
        if (seen[id] > 2) continue
        const tier = seen[id] === 1 ? 'Adept' : 'Master'
        rows.push({ ms: u.ms, player, id, label: name, detail: tier, kind: 'upgrade' })
      } else {
        rows.push({ ms: u.ms, player, id, label: name, detail: String(seen[id]), kind: 'upgrade' })
      }
    }
  }

  // Suffix buildings and general upgrades with #N for stable identity keys
  for (const row of rows) {
    if (row.kind === 'building' || (row.kind === 'upgrade' && !TRAINING_UPGRADES[row.id])) {
      row.detail = `#${row.detail}`
    }
  }

  return rows.sort((a, b) => a.ms - b.ms)
}
