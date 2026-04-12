import type { ParserOutput } from 'w3gjs'
import {
  getRaceLabel,
  heroDisplayName,
  heroIconBg,
  unitLabel,
  upgradeLabel,
  abilityLabel,
  buildingLabel,
  formatGameTime,
} from '../format'

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

type Player = ParserOutput['players'][number]

export default function PlayerCard({ player }: { player: Player }) {
  const colorHex = player.color
  const race: string = player.race ?? player.raceDetected ?? ''
  const apm: number = player.apm ?? 0
  const name: string = player.name ?? 'Unknown'

  const heroes = player.heroes ?? []
  const unitSummary: Record<string, number> = player.units?.summary ?? {}
  const upgradeSummary: Record<string, number> = player.upgrades?.summary ?? {}
  const buildOrder: { id: string; ms: number }[] = player.buildings?.order ?? []

  const buildingSummary: Record<string, number> = {}
  for (const { id } of buildOrder) {
    buildingSummary[id] = (buildingSummary[id] ?? 0) + 1
  }

  const sortedUnits = Object.entries(unitSummary).sort(([, a], [, b]) => b - a)
  const sortedUpgrades = Object.entries(upgradeSummary).sort(([, a], [, b]) => b - a)
  const sortedBuildings = Object.entries(buildingSummary).sort(([, a], [, b]) => b - a)

  return (
    <div
      className="overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '2px solid var(--border-hi)',
        borderLeft: `4px solid ${colorHex}`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.5), 4px 0 0 ${colorHex}22`,
        /* Corner brackets in player color */
        backgroundImage: `
          linear-gradient(to right, ${colorHex}44, ${colorHex}44) top right / 10px 1px no-repeat,
          linear-gradient(to bottom, ${colorHex}44, ${colorHex}44) top right / 1px 10px no-repeat,
          linear-gradient(to bottom, var(--surface-hi), var(--surface))
        `,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span
          className="rounded-full flex-shrink-0"
          style={{ width: 8, height: 8, background: colorHex, boxShadow: `0 0 6px ${colorHex}88` }}
        />
        <span
          className="font-display text-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ fontSize: '.85rem', letterSpacing: '.04em' }}
        >
          {name}
        </span>
        <div className="flex gap-3 flex-shrink-0 items-center">
          {race && <span className="race-badge text-muted">{getRaceLabel(race)}</span>}
          {apm > 0 && (
            <span
              className="font-mono"
              style={{ fontSize: '.65rem', color: 'var(--gold)', letterSpacing: '.04em' }}
            >
              {apm} APM
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-3.5 flex flex-col gap-4">
        {/* Heroes */}
        {heroes.length > 0 && (
          <div className="flex flex-col gap-3.5">
            {heroes.map((hero, i: number) => {
              const id: string = hero.id ?? ''
              const level: number = hero.level ?? 0
              const abilities: Record<string, number> = hero.abilities ?? {}
              return (
                <div key={i} className="flex gap-3">
                  {/* Hero icon */}
                  <div
                    className="flex-shrink-0 border border-border overflow-hidden"
                    style={{ width: 36, height: 36, background: heroIconBg(id) }}
                    title={heroDisplayName(id)}
                  >
                    <img
                      src={`${BASE}/heroes/${id}.png`}
                      alt={heroDisplayName(id)}
                      width={36}
                      height={36}
                      style={{ display: 'block', imageRendering: 'pixelated' }}
                      onError={(e) => {
                        // Fallback: hide broken img, show background color only
                        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-foreground" style={{ fontSize: '.8rem' }}>
                        {heroDisplayName(id)}
                      </span>
                      {level > 0 && (
                        <span className="font-mono text-muted" style={{ fontSize: '.65rem' }}>
                          lv {level}
                        </span>
                      )}
                    </div>
                    {/* Retraining */}
                    {hero.retrainingHistory?.map((entry, ri: number) => (
                      <div key={ri} className="mt-2 pl-2.5 border-l border-border">
                        <p
                          className="text-muted mb-1"
                          style={{ fontSize: '.65rem', letterSpacing: '.03em' }}
                        >
                          Tome of Retraining · {formatGameTime(entry.time)}
                        </p>
                        <ul className="list-none m-0 p-0 flex flex-col gap-[.2rem]">
                          {Object.entries(entry.abilities as Record<string, number>).map(
                            ([abilId, lvl]) => (
                              <li
                                key={abilId}
                                className="flex items-center gap-2 text-muted"
                                style={{ fontSize: '.7rem' }}
                              >
                                <AbilityDots level={lvl} faded />
                                <span className="line-through">{abilityLabel(abilId)}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    ))}
                    {/* Abilities */}
                    {Object.keys(abilities).length > 0 && (
                      <ul className="list-none mt-1.5 mb-0 p-0 flex flex-col gap-[.2rem]">
                        {Object.entries(abilities).map(([abilId, lvl]) => (
                          <li
                            key={abilId}
                            className="flex items-center gap-2 text-zinc-400"
                            style={{ fontSize: '.7rem' }}
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
          <div className="flex flex-col gap-2">
            <span className="section-label">Units trained</span>
            <div className="flex flex-wrap gap-1.5">
              {sortedUnits.map(([id, count]) => (
                <span
                  key={id}
                  className="flex items-center gap-1.5 px-2 py-1 bg-bg border border-border text-foreground"
                  style={{ fontSize: '.7rem' }}
                >
                  {unitLabel(id)}
                  <span className="text-muted">×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Upgrades */}
        {sortedUpgrades.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="section-label">Upgrades</span>
            <div className="flex flex-wrap gap-1.5">
              {sortedUpgrades.map(([id, level]) => (
                <span
                  key={id}
                  className="flex items-center gap-1.5 px-2 py-1 bg-bg border border-border-hi text-zinc-400"
                  style={{ fontSize: '.7rem' }}
                >
                  {upgradeLabel(id)}
                  {level > 1 && <span className="text-muted">·{level}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Buildings built */}
        {sortedBuildings.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="section-label">Buildings built</span>
            <div className="flex flex-wrap gap-1.5">
              {sortedBuildings.map(([id, count]) => (
                <span
                  key={id}
                  className="flex items-center gap-1.5 px-2 py-1 bg-bg border border-border text-foreground"
                  style={{ fontSize: '.7rem' }}
                >
                  {buildingLabel(id)}
                  <span className="text-muted">×{count}</span>
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
    <span className="flex gap-[2px] flex-shrink-0">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="inline-block rounded-full"
          style={{
            width: 5,
            height: 5,
            background:
              i <= level ? (faded ? 'var(--border-hi)' : 'var(--accent)') : 'var(--border)',
          }}
        />
      ))}
    </span>
  )
}
