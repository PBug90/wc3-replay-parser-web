import { describe, it, expect } from 'vitest'
import { normalizeMapPath } from './mapInformation'

describe('normalizeMapPath', () => {
  // ── Directory stripping ──────────────────────────────────────────────────

  it('strips FrozenThrone directory prefix (forward slashes)', () => {
    expect(normalizeMapPath('Maps/FrozenThrone/(2)TerenasStand_LV.w3x')).toBe('terenasstand')
  })

  it('strips directory prefix with Windows backslashes', () => {
    expect(normalizeMapPath('Maps\\FrozenThrone\\(2)TerenasStand_LV.w3x')).toBe('terenasstand')
  })

  it('handles a bare filename with no directory', () => {
    expect(normalizeMapPath('(2)TerenasStand_LV.w3x')).toBe('terenasstand')
  })

  it('handles a name with no directory and no extension', () => {
    expect(normalizeMapPath('TerenasStand_LV')).toBe('terenasstand')
  })

  // ── Extension stripping ──────────────────────────────────────────────────

  it('strips .w3x extension', () => {
    expect(normalizeMapPath('(2)EchoIsles.w3x')).toBe('echoisle')
  })

  it('strips .w3m extension', () => {
    expect(normalizeMapPath('(2)LastRefuge.w3m')).toBe('lastrefuge')
  })

  it('treats extension check as case-insensitive', () => {
    expect(normalizeMapPath('(2)TurtleRock.W3X')).toBe('turtlerock')
  })

  // ── Player-count prefix ──────────────────────────────────────────────────

  it('strips single-digit player-count prefix', () => {
    expect(normalizeMapPath('(4)TwistedMeadows.w3x')).toBe('twistedmeadow')
  })

  it('strips two-digit player-count prefix', () => {
    expect(normalizeMapPath('(12)GnollWood.w3x')).toBe('gnollwood')
  })

  it('leaves the name unchanged when there is no player-count prefix', () => {
    expect(normalizeMapPath('Amazonia.w3x')).toBe('amazonia')
  })

  // ── Separator stripping ──────────────────────────────────────────────────

  it('strips underscores from the map name', () => {
    expect(normalizeMapPath('(2)Terenas_Stand_LV.w3x')).toBe('terenasstand')
  })

  it('strips hyphens from the map name', () => {
    expect(normalizeMapPath('(2)Terenas-Stand-LV.w3x')).toBe('terenasstand')
  })

  it('strips spaces from the map name', () => {
    expect(normalizeMapPath('(2)Terenas Stand LV.w3x')).toBe('terenasstand')
  })

  // ── LV suffix stripping ──────────────────────────────────────────────────

  it('strips uppercase LV suffix', () => {
    expect(normalizeMapPath('(4)PhantomGrove_LV.w3x')).toBe('phantomgrove')
  })

  it('strips lowercase lv suffix', () => {
    expect(normalizeMapPath('(4)PhantomGrove_lv.w3x')).toBe('phantomgrove')
  })

  it('strips mixed-case Lv suffix', () => {
    expect(normalizeMapPath('(4)PhantomGrove_Lv.w3x')).toBe('phantomgrove')
  })

  it('does not strip LV when it is part of the core name (not a suffix)', () => {
    // "Silverpine" contains no LV, should be unchanged beyond normal transforms
    expect(normalizeMapPath('(4)SilverpineForest.w3x')).toBe('silverpineforest')
  })

  // ── Lowercasing ──────────────────────────────────────────────────────────

  it('lowercases all-uppercase input', () => {
    expect(normalizeMapPath('(2)TURTLEROCK.w3x')).toBe('turtlerock')
  })

  it('lowercases mixed-case input', () => {
    expect(normalizeMapPath('(2)ConcealedHill.w3x')).toBe('concealedhill')
  })

  // ── Plural → singular normalisation ─────────────────────────────────────

  it('strips trailing s to unify plural map names (Isles → Isle)', () => {
    expect(normalizeMapPath('(2)EchoIsles.w3x')).toBe('echoisle')
  })

  it('strips trailing s on Meadows', () => {
    expect(normalizeMapPath('(4)TwistedMeadows.w3x')).toBe('twistedmeadow')
  })

  it('strips trailing s on NorthernIsles', () => {
    expect(normalizeMapPath('(4)NorthernIsles.w3x')).toBe('northernisle')
  })

  it('strips trailing s on AncientIsles', () => {
    expect(normalizeMapPath('(4)AncientIsles.w3x')).toBe('ancientisle')
  })

  it('does not strip s when the name does not end in s', () => {
    expect(normalizeMapPath('(2)TurtleRock.w3x')).toBe('turtlerock')
  })

  // ── Combined / real-world paths ──────────────────────────────────────────

  it('handles the full FrozenThrone path for Twisted Meadows', () => {
    expect(normalizeMapPath('Maps/FrozenThrone/(4)TwistedMeadows.w3x')).toBe('twistedmeadow')
  })

  it('handles the full FrozenThrone path for Phantom Grove LV', () => {
    expect(normalizeMapPath('Maps/FrozenThrone/(4)PhantomGrove_LV.w3x')).toBe('phantomgrove')
  })

  it('handles a path with no player-count and no LV suffix', () => {
    expect(normalizeMapPath('Maps/FrozenThrone/Amazonia.w3x')).toBe('amazonia')
  })

  it('handles Northshire Cliffs with underscores and suffix', () => {
    expect(normalizeMapPath('(2)NorthshireCliffs.w3x')).toBe('northshirecliff')
  })

  it('handles Gold Rush (space in name)', () => {
    expect(normalizeMapPath('(4)Gold Rush.w3x')).toBe('goldrush')
  })

  it('handles The Two Rivers (leading "The", plural)', () => {
    expect(normalizeMapPath('(4)TheTwoRivers.w3x')).toBe('thetworiver')
  })

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('returns an empty string for an empty input', () => {
    expect(normalizeMapPath('')).toBe('')
  })
})
