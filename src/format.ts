import { RACE_LABELS, HERO_NAMES, HERO_RACE_BG } from './constants'
import { UNIT_NAMES, UPGRADE_NAMES, ABILITY_NAMES } from './w3g-names'

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

export function formatGameTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const getRaceLabel = (race: string) => RACE_LABELS[race] ?? race
export const heroDisplayName = (id: string) => HERO_NAMES[id] ?? id
export const heroInitials = (id: string) => {
  const name = HERO_NAMES[id] ?? id
  return name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 3)
}
export const heroIconBg = (id: string) => HERO_RACE_BG[id[0]] ?? '#2a2a2a'
export const unitLabel = (id: string) => {
  const raw = UNIT_NAMES[id]
  return raw ? raw.replace(/^u_/, '') : id
}
export const upgradeLabel = (id: string) => {
  const raw = UPGRADE_NAMES[id]
  return raw ? raw.replace(/^p_/, '') : id
}
export const abilityLabel = (id: string) => {
  const raw = ABILITY_NAMES[id]
  return raw ? raw.replace(/^a_[^:]+:/, '') : id
}
