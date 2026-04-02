export const RACE_LABELS: Record<string, string> = {
  H: 'Human',
  N: 'Night Elf',
  O: 'Orc',
  U: 'Undead',
  R: 'Random',
  human: 'Human',
  nightelf: 'Night Elf',
  orc: 'Orc',
  undead: 'Undead',
  random: 'Random',
}

export const HERO_NAMES: Record<string, string> = {
  Hamg: 'Archmage',
  Hmkg: 'Mountain King',
  Hpal: 'Paladin',
  Hblm: 'Blood Mage',
  Edem: 'Demon Hunter',
  Ekee: 'Keeper of the Grove',
  Emoo: 'Priestess of the Moon',
  Ewar: 'Warden',
  Obla: 'Blademaster',
  Ofar: 'Far Seer',
  Otch: 'Tauren Chieftain',
  Oshd: 'Shadow Hunter',
  Udea: 'Death Knight',
  Udre: 'Dreadlord',
  Ulic: 'Lich',
  Ucrl: 'Crypt Lord',
  Npbm: 'Pandaren Brewmaster',
  Nbrn: 'Dark Ranger',
  Nngs: 'Naga Sea Witch',
  Nplh: 'Pit Lord',
  Nbst: 'Beastmaster',
  Ntin: 'Goblin Tinker',
  Nfir: 'Firelord',
  Nalc: 'Goblin Alchemist',
}

export const HERO_RACE_BG: Record<string, string> = {
  H: '#1e3a5f',
  E: '#1a3d1f',
  O: '#3d1f0a',
  U: '#2a0f45',
  N: '#2a2a2a',
}

const base = import.meta.env.BASE_URL.replace(/\/$/, '')

export const EXAMPLE_REPLAYS = [
  { label: 'Example 1', url: `${base}/replays/example1.w3g` },
  { label: 'Example 2', url: `${base}/replays/example2.w3g` },
  { label: 'Example 3', url: `${base}/replays/example3.w3g` },
]
