// ---------------------------------------------------------------------------
// Warcraft III unit / hero data
// Edit UNITS below to add new units or correct stats. All other exports are
// derived automatically — no other file needs to change.
//
// gold / lumber: null  = summoned / morphed unit (no build cost)
// icon: undefined      = no portrait image available
// ---------------------------------------------------------------------------

export interface UnitData {
  supply: number
  gold: number
  lumber: number
  icon?: string // 4-char ID matching public/units/{id}.png
}

export const UNITS: Record<string, UnitData> = {
  // ── Human ────────────────────────────────────────────────────────────────
  Peasant: { supply: 1, gold: 75, lumber: 0, icon: 'hpea' },
  Militia: { supply: 1, gold: 75, lumber: 0, icon: 'hmil' },
  Footman: { supply: 2, gold: 135, lumber: 0, icon: 'hfoo' },
  Rifleman: { supply: 3, gold: 205, lumber: 30, icon: 'hrif' },
  Knight: { supply: 4, gold: 245, lumber: 60, icon: 'hkni' },
  Priest: { supply: 2, gold: 135, lumber: 10, icon: 'hmpr' },
  Sorceress: { supply: 2, gold: 155, lumber: 20, icon: 'hsor' },
  Spellbreaker: { supply: 3, gold: 215, lumber: 30, icon: 'hspt' },
  'Flying Machine': { supply: 1, gold: 90, lumber: 30, icon: 'hgyr' },
  'Mortar Team': { supply: 3, gold: 180, lumber: 70, icon: 'hmtm' },
  'Siege Engine': { supply: 3, gold: 195, lumber: 60, icon: 'hmtt' },
  'Gryphon Rider': { supply: 4, gold: 280, lumber: 70, icon: 'hgry' },
  'Dragonhawk Rider': { supply: 3, gold: 200, lumber: 30, icon: 'hdhw' },
  'Water Elemental': { supply: 0, gold: 0, lumber: 0, icon: 'hwel' },

  // ── Orc ──────────────────────────────────────────────────────────────────
  Peon: { supply: 1, gold: 75, lumber: 0, icon: 'opeo' },
  Grunt: { supply: 3, gold: 200, lumber: 0, icon: 'ogru' },
  'Troll Headhunter': { supply: 2, gold: 135, lumber: 20, icon: 'ohun' },
  'Troll Berserker': { supply: 2, gold: 135, lumber: 20, icon: 'otbk' },
  Shaman: { supply: 2, gold: 130, lumber: 20, icon: 'oshm' },
  'Troll Witch Doctor': { supply: 2, gold: 145, lumber: 25, icon: 'odoc' },
  Raider: { supply: 3, gold: 180, lumber: 40, icon: 'orai' },
  'Spirit Walker': { supply: 3, gold: 195, lumber: 35, icon: 'ospw' },
  'Troll Batrider': { supply: 2, gold: 160, lumber: 40, icon: 'otbr' },
  Demolisher: { supply: 4, gold: 220, lumber: 50, icon: 'ocat' },
  'Kodo Beast': { supply: 4, gold: 255, lumber: 60, icon: 'okod' },
  'Wind Rider': { supply: 4, gold: 265, lumber: 40, icon: 'owyv' },
  Tauren: { supply: 5, gold: 280, lumber: 80, icon: 'otau' },
  Shredder: { supply: 4, gold: 195, lumber: 50, icon: 'oshr' },

  // ── Undead ───────────────────────────────────────────────────────────────
  Acolyte: { supply: 1, gold: 75, lumber: 0, icon: 'uaco' },
  Shade: { supply: 1, gold: 0, lumber: 0, icon: 'ushd' },
  Ghoul: { supply: 2, gold: 120, lumber: 0, icon: 'ugho' },
  Gargoyle: { supply: 2, gold: 185, lumber: 30, icon: 'ugar' },
  Banshee: { supply: 2, gold: 155, lumber: 30, icon: 'uban' },
  Necromancer: { supply: 2, gold: 145, lumber: 20, icon: 'unec' },
  'Crypt Fiend': { supply: 3, gold: 215, lumber: 40, icon: 'ucry' },
  'Obsidian Statue': { supply: 3, gold: 200, lumber: 35, icon: 'uobs' },
  Abomination: { supply: 4, gold: 240, lumber: 70, icon: 'uabo' },
  'Meat Wagon': { supply: 4, gold: 230, lumber: 50, icon: 'umtw' },
  Destroyer: { supply: 5, gold: 0, lumber: 0, icon: 'ubsp' },
  'Frost Wyrm': { supply: 7, gold: 385, lumber: 120, icon: 'ufro' },
  'Skeleton Warrior': { supply: 0, gold: 0, lumber: 0, icon: 'uskw' },
  'Skeletal Mage': { supply: 0, gold: 0, lumber: 0, icon: 'uskm' },
  'Carrion Beetle': { supply: 0, gold: 0, lumber: 0, icon: 'ucrb' },

  // ── Night Elf ─────────────────────────────────────────────────────────────
  Wisp: { supply: 1, gold: 60, lumber: 0, icon: 'ewsp' },
  Archer: { supply: 2, gold: 130, lumber: 10, icon: 'earc' },
  'Druid of the Talon': { supply: 2, gold: 135, lumber: 20, icon: 'edot' },
  Hippogryph: { supply: 2, gold: 160, lumber: 20, icon: 'ehip' },
  'Faerie Dragon': { supply: 2, gold: 155, lumber: 25, icon: 'efdr' },
  Huntress: { supply: 3, gold: 195, lumber: 20, icon: 'esen' },
  Dryad: { supply: 3, gold: 145, lumber: 60, icon: 'edry' },
  'Glaive Thrower': { supply: 3, gold: 210, lumber: 65, icon: 'ebal' },
  'Druid of the Claw': { supply: 4, gold: 255, lumber: 80, icon: 'edoc' },
  'Hippogryph Rider': { supply: 4, gold: 0, lumber: 0, icon: 'ehir' },
  Chimaera: { supply: 5, gold: 330, lumber: 70, icon: 'echm' },
  'Mountain Giant': { supply: 7, gold: 425, lumber: 100, icon: 'emtg' },
  'Sentry Ward': { supply: 0, gold: 0, lumber: 0, icon: 'ensw' },
  Treant: { supply: 0, gold: 0, lumber: 0, icon: 'etrt' },

  // ── Night Elf buildings (can uproot / appear as units in observer data) ──
  'Ancient of War': { supply: 0, gold: 0, lumber: 0, icon: 'eaow' },
  'Ancient of Lore': { supply: 0, gold: 0, lumber: 0, icon: 'eaol' },
  'Ancient of Wind': { supply: 0, gold: 0, lumber: 0, icon: 'eawn' },
  'Ancient Protector': { supply: 0, gold: 0, lumber: 0, icon: 'etrt' },
  'Tree of Life': { supply: 0, gold: 0, lumber: 0, icon: 'etol' },
  'Tree of Ages': { supply: 0, gold: 0, lumber: 0, icon: 'etoa' },
  'Tree of Eternity': { supply: 0, gold: 0, lumber: 0, icon: 'etoe' },
  'Moon Well': { supply: 0, gold: 0, lumber: 0, icon: 'emwl' },
  "Hunter's Hall": { supply: 0, gold: 0, lumber: 0, icon: 'ehhl' },
  'Altar of Elders': { supply: 0, gold: 0, lumber: 0, icon: 'eale' },
  'Ancient of Wonders': { supply: 0, gold: 0, lumber: 0, icon: 'eawo' },
}

// ---------------------------------------------------------------------------
// Derived exports — consumed by MemoryGameView and other components
// ---------------------------------------------------------------------------

export const UNIT_SUPPLY: Record<string, number> = Object.fromEntries(
  Object.entries(UNITS).map(([name, u]) => [name, u.supply]),
)

export const UNIT_ICON_ID: Record<string, string> = Object.fromEntries(
  Object.entries(UNITS)
    .filter(([, u]) => u.icon !== undefined)
    .map(([name, u]) => [name, u.icon!]),
)

export const WORKERS = new Set(['Peasant', 'Peon', 'Wisp', 'Acolyte'])

// ---------------------------------------------------------------------------
// Heroes — display name → 4-char icon ID  (used by replay parser summaries)
// ---------------------------------------------------------------------------

export const HERO_ICON: Record<string, string> = {
  Archmage: 'Hamg',
  'Mountain King': 'Hmkg',
  Paladin: 'Hpal',
  'Blood Mage': 'Hblm',
  Blademaster: 'Obla',
  'Far Seer': 'Ofar',
  'Shadow Hunter': 'Oshd',
  'Tauren Chieftain': 'Otch',
  'Death Knight': 'Udea',
  Dreadlord: 'Udre',
  Lich: 'Ulic',
  'Crypt Lord': 'Ucrl',
  'Demon Hunter': 'Edem',
  'Keeper of the Grove': 'Ekee',
  'Priestess of the Moon': 'Emoo',
  Warden: 'Ewar',
  Alchemist: 'Nalc',
  Beastmaster: 'Nbst',
  'Fire Lord': 'Nfir',
  'Naga Sea Witch': 'Nngs',
  'Pandaren Brewmaster': 'Npbm',
  'Pit Lord': 'Nplh',
  Tinker: 'Ntin',
}

// ---------------------------------------------------------------------------
// Heroes — normalized name (lowercase, no spaces) → icon ID + display name
// Used by the Observer API / Magic Sentry JSON format.
// ---------------------------------------------------------------------------

export const HERO_OBSERVER: Record<string, { icon: string; display: string }> = {
  archmage: { icon: 'Hamg', display: 'Archmage' },
  mountainking: { icon: 'Hmkg', display: 'Mountain King' },
  paladin: { icon: 'Hpal', display: 'Paladin' },
  bloodmage: { icon: 'Hblm', display: 'Blood Mage' },
  blademaster: { icon: 'Obla', display: 'Blademaster' },
  farseer: { icon: 'Ofar', display: 'Far Seer' },
  shadowhunter: { icon: 'Oshd', display: 'Shadow Hunter' },
  taurenchieftain: { icon: 'Otch', display: 'Tauren Chieftain' },
  deathknight: { icon: 'Udea', display: 'Death Knight' },
  dreadlord: { icon: 'Udre', display: 'Dreadlord' },
  lich: { icon: 'Ulic', display: 'Lich' },
  cryptlord: { icon: 'Ucrl', display: 'Crypt Lord' },
  demonhunter: { icon: 'Edem', display: 'Demon Hunter' },
  keeperofthegrove: { icon: 'Ekee', display: 'Keeper of the Grove' },
  priestessofthemoon: { icon: 'Emoo', display: 'Priestess of the Moon' },
  warden: { icon: 'Ewar', display: 'Warden' },
  alchemist: { icon: 'Nalc', display: 'Alchemist' },
  beastmaster: { icon: 'Nbst', display: 'Beastmaster' },
  firelord: { icon: 'Nfir', display: 'Fire Lord' },
  seawitch: { icon: 'Nngs', display: 'Naga Sea Witch' },
  pandarenbrewmaster: { icon: 'Npbm', display: 'Pandaren Brewmaster' },
  pitlord: { icon: 'Nplh', display: 'Pit Lord' },
  tinker: { icon: 'Ntin', display: 'Tinker' },
}
