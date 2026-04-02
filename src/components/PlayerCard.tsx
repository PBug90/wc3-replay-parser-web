import type { ParserOutput } from 'w3gjs/dist/types/types'
import {
  getRaceLabel,
  heroDisplayName,
  heroInitials,
  heroIconBg,
  unitLabel,
  upgradeLabel,
  abilityLabel,
  formatGameTime,
} from '../format'

type Player = ParserOutput['players'][number]

export default function PlayerCard({ player }: { player: Player }) {
  const colorHex = player.color
  const race: string = player.race ?? player.raceDetected ?? ''
  const apm: number = player.apm ?? 0
  const name: string = player.name ?? 'Unknown'

  const heroes = player.heroes ?? []
  const unitSummary: Record<string, number> = player.units?.summary ?? {}
  const upgradeSummary: Record<string, number> = player.upgrades?.summary ?? {}

  const sortedUnits = Object.entries(unitSummary).sort(([, a], [, b]) => b - a)
  const sortedUpgrades = Object.entries(upgradeSummary).sort(([, a], [, b]) => b - a)

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${colorHex}`,
        background: 'var(--surface)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '.75rem 1rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            flexShrink: 0,
            background: colorHex,
          }}
        />
        <span
          style={{
            fontSize: '.875rem',
            fontWeight: 500,
            color: 'var(--text)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </span>
        <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
          {race && (
            <span style={{ fontSize: '.7rem', color: 'var(--muted)', letterSpacing: '.04em' }}>
              {getRaceLabel(race).toUpperCase()}
            </span>
          )}
          {apm > 0 && (
            <span
              className="font-mono"
              style={{ fontSize: '.7rem', color: 'var(--accent)', letterSpacing: '.04em' }}
            >
              {apm} APM
            </span>
          )}
        </div>
      </div>

      <div
        style={{ padding: '.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {/* Heroes */}
        {heroes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
            {heroes.map((hero, i: number) => {
              const id: string = hero.id ?? ''
              const level: number = hero.level ?? 0
              const abilities: Record<string, number> = hero.abilities ?? {}
              return (
                <div key={i} style={{ display: 'flex', gap: '.75rem' }}>
                  {/* Hero icon */}
                  <div
                    style={{
                      flexShrink: 0,
                      width: 36,
                      height: 36,
                      background: heroIconBg(id),
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: '.7rem',
                      fontWeight: 500,
                      color: 'var(--text)',
                      letterSpacing: '.04em',
                    }}
                    title={heroDisplayName(id)}
                  >
                    {heroInitials(id)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '.5rem' }}>
                      <span style={{ fontSize: '.8rem', fontWeight: 500, color: 'var(--text)' }}>
                        {heroDisplayName(id)}
                      </span>
                      {level > 0 && (
                        <span
                          className="font-mono"
                          style={{ fontSize: '.65rem', color: 'var(--muted)' }}
                        >
                          lv {level}
                        </span>
                      )}
                    </div>
                    {/* Retraining */}
                    {hero.retrainingHistory?.map((entry, ri: number) => (
                      <div
                        key={ri}
                        style={{
                          marginTop: '.5rem',
                          paddingLeft: '.625rem',
                          borderLeft: '1px solid var(--border)',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '.65rem',
                            color: 'var(--muted)',
                            marginBottom: '.25rem',
                            letterSpacing: '.03em',
                          }}
                        >
                          Tome of Retraining · {formatGameTime(entry.time)}
                        </p>
                        <ul
                          style={{
                            listStyle: 'none',
                            margin: 0,
                            padding: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '.2rem',
                          }}
                        >
                          {Object.entries(entry.abilities as Record<string, number>).map(
                            ([abilId, lvl]) => (
                              <li
                                key={abilId}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '.5rem',
                                  fontSize: '.7rem',
                                  color: 'var(--muted)',
                                }}
                              >
                                <AbilityDots level={lvl} faded />
                                <span style={{ textDecoration: 'line-through' }}>
                                  {abilityLabel(abilId)}
                                </span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    ))}
                    {/* Abilities */}
                    {Object.keys(abilities).length > 0 && (
                      <ul
                        style={{
                          listStyle: 'none',
                          margin: '.375rem 0 0',
                          padding: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '.2rem',
                        }}
                      >
                        {Object.entries(abilities).map(([abilId, lvl]) => (
                          <li
                            key={abilId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '.5rem',
                              fontSize: '.7rem',
                              color: '#9a9aa8',
                            }}
                          >
                            <AbilityDots level={lvl} />
                            <span>{abilityLabel(abilId)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Units */}
        {sortedUnits.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <span className="section-label">Units trained</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.375rem' }}>
              {sortedUnits.map(([id, count]) => (
                <span
                  key={id}
                  style={{
                    fontSize: '.7rem',
                    padding: '.25rem .5rem',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '.375rem',
                  }}
                >
                  {unitLabel(id)}
                  <span style={{ color: 'var(--muted)' }}>×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Upgrades */}
        {sortedUpgrades.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <span className="section-label">Upgrades</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.375rem' }}>
              {sortedUpgrades.map(([id, level]) => (
                <span
                  key={id}
                  style={{
                    fontSize: '.7rem',
                    padding: '.25rem .5rem',
                    background: 'var(--bg)',
                    border: '1px solid var(--border-hi)',
                    color: '#9a9aa8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '.375rem',
                  }}
                >
                  {upgradeLabel(id)}
                  {level > 1 && <span style={{ color: 'var(--muted)' }}>·{level}</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AbilityDots({ level, faded = false }: { level: number; faded?: boolean }) {
  return (
    <span style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background:
              i <= level ? (faded ? 'var(--border-hi)' : 'var(--accent)') : 'var(--border)',
          }}
        />
      ))}
    </span>
  )
}
