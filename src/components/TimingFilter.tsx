import { RACE_GROUPS } from '../timingUtils'

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

interface Props {
  inactiveIds: Set<string>
  onToggle: (id: string) => void
  onToggleGroup: (ids: string[], allActive: boolean) => void
}

export default function TimingFilter({ inactiveIds, onToggle, onToggleGroup }: Props) {
  return (
    <div
      className="flex flex-col gap-1 border border-border bg-surface p-2"
      style={{ fontSize: '.65rem' }}
    >
      {RACE_GROUPS.map((group) => {
        const allActive = group.entities.every((e) => !inactiveIds.has(e.id))
        return (
          <div key={group.abbr} className="flex items-center gap-2">
            <button
              onClick={() =>
                onToggleGroup(
                  group.entities.map((e) => e.id),
                  allActive,
                )
              }
              title={allActive ? `Deactivate all ${group.name}` : `Activate all ${group.name}`}
              className="font-mono text-left flex-shrink-0"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                width: 32,
                letterSpacing: '.06em',
                color: allActive ? 'var(--gold)' : 'var(--muted)',
                fontSize: '.6rem',
              }}
            >
              {group.abbr}
            </button>
            <div className="flex flex-wrap gap-0.5">
              {group.entities.map((entity) => {
                const active = !inactiveIds.has(entity.id)
                const iconSrc =
                  entity.kind === 'building'
                    ? `${BASE}/buildings/${entity.id}.png`
                    : `${BASE}/upgrades/${entity.id}${entity.iconSuffix}.png`
                return (
                  <button
                    key={entity.id}
                    onClick={() => onToggle(entity.id)}
                    title={entity.label}
                    style={{
                      background: 'none',
                      border: `1px solid ${active ? 'var(--border-hi)' : 'transparent'}`,
                      cursor: 'pointer',
                      padding: 1,
                      opacity: active ? 1 : 0.3,
                      lineHeight: 0,
                    }}
                  >
                    <img
                      src={iconSrc}
                      width={22}
                      height={22}
                      style={{ display: 'block', imageRendering: 'pixelated' }}
                      onError={(e) => {
                        ;(e.currentTarget.parentElement as HTMLElement).style.display = 'none'
                      }}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
