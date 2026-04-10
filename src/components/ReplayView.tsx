import type { ParserOutput } from 'w3gjs/dist/types/types'
import type { PositionedAction, PositionedBuilding } from '../Heatmap'
import Heatmap from '../Heatmap'
import ApmChart from '../ApmChart'
import Meta from './Meta'
import PlayerCard from './PlayerCard'
import BuildTimeline from './BuildTimeline'
import { formatDuration } from '../format'

interface ReplayViewProps {
  replay: ParserOutput
  actions: PositionedAction[]
  buildings: PositionedBuilding[]
  fileName: string | null
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Rune-style divider */}
      <div className="flex items-center gap-3">
        <div
          className="h-px flex-1"
          style={{ background: 'linear-gradient(to right, transparent, rgba(200,160,80,0.25))' }}
        />
        <svg width="6" height="6" viewBox="0 0 6 6">
          <polygon points="3,0 6,3 3,6 0,3" fill="var(--gold)" opacity="0.6" />
        </svg>
        <span className="section-label">{label}</span>
        <svg width="6" height="6" viewBox="0 0 6 6">
          <polygon points="3,0 6,3 3,6 0,3" fill="var(--gold)" opacity="0.6" />
        </svg>
        <div
          className="h-px flex-1"
          style={{ background: 'linear-gradient(to left, transparent, rgba(200,160,80,0.25))' }}
        />
      </div>
      {children}
    </div>
  )
}

export default function ReplayView({ replay, actions, buildings, fileName }: ReplayViewProps) {
  const players = replay.players ?? []

  const teams: Record<number, typeof players> = {}
  for (const p of players) {
    const tid = p.teamid ?? 0
    if (!teams[tid]) teams[tid] = []
    teams[tid].push(p)
  }

  const playerIdColorMap: Record<number, string> = {}
  for (const p of players) playerIdColorMap[p.id] = p.color

  const mapFile = replay.map?.path ?? ''
  const mapName = mapFile
    ? (mapFile
        .split(/[\\/]/)
        .pop()
        ?.replace(/\.(w3x|w3m)$/, '') ?? mapFile)
    : '—'

  return (
    <div className="flex flex-col gap-12">
      {/* Metadata strip */}
      <div
        className="panel-gold grid p-6"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '1.5rem 2rem',
        }}
      >
        <Meta label="File" value={fileName ?? '—'} />
        {replay.gamename && <Meta label="Game" value={replay.gamename} />}
        <Meta label="Map" value={mapName || '—'} wrap />
        {replay.duration > 0 && <Meta label="Duration" value={formatDuration(replay.duration)} />}
        {replay.version && <Meta label="Version" value={replay.version} />}
        {replay.type && <Meta label="Type" value={replay.type} />}
        <Meta label="Players" value={String(players.length)} />
      </div>

      {/* Action heatmap + key timings side by side */}
      {actions.length > 0 && (
        <Section label="Battle Map">
          <div className="flex gap-6 items-start">
            <Heatmap
              actions={actions}
              buildings={buildings}
              mapFile={mapFile}
              playerIdColorMap={playerIdColorMap}
              width={500}
              height={500}
            />
            {players.length > 0 && (
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <span className="section-label">Key Timings</span>
                <BuildTimeline players={players} />
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Teams */}
      {Object.keys(teams).length > 0 && (
        <Section label="Players & Teams">
          {Object.keys(teams).length === 2 ? (
            // Side-by-side layout for 2-team games (1v1, 2v2, 3v3, 4v4)
            (() => {
              const [[tid0, t0players], [tid1, t1players]] = Object.entries(teams)
              return (
                <div
                  className="grid items-start"
                  style={{ gridTemplateColumns: '1fr auto 1fr', gap: 0 }}
                >
                  {/* Team 1 */}
                  <div className="flex flex-col gap-3">
                    <span
                      className="font-display text-muted"
                      style={{ fontSize: '.55rem', letterSpacing: '.25em' }}
                    >
                      ── TEAM {Number(tid0) + 1} ──
                    </span>
                    <div className="flex flex-col gap-4">
                      {t0players.map((player) => (
                        <PlayerCard key={player.id ?? player.name} player={player} />
                      ))}
                    </div>
                  </div>

                  {/* VS divider */}
                  <div
                    className="flex flex-col items-center self-stretch mx-5"
                    style={{ paddingTop: '1.65rem' }}
                  >
                    <div
                      className="flex-1 w-px"
                      style={{
                        background: 'linear-gradient(to bottom, transparent, rgba(200,160,80,0.3))',
                      }}
                    />
                    <span
                      className="font-display py-3"
                      style={{
                        fontSize: '.6rem',
                        letterSpacing: '.22em',
                        color: 'var(--gold)',
                        opacity: 0.5,
                      }}
                    >
                      VS
                    </span>
                    <div
                      className="flex-1 w-px"
                      style={{
                        background: 'linear-gradient(to top, transparent, rgba(200,160,80,0.3))',
                      }}
                    />
                  </div>

                  {/* Team 2 */}
                  <div className="flex flex-col gap-3">
                    <span
                      className="font-display text-muted"
                      style={{ fontSize: '.55rem', letterSpacing: '.25em', textAlign: 'right' }}
                    >
                      ── TEAM {Number(tid1) + 1} ──
                    </span>
                    <div className="flex flex-col gap-4">
                      {t1players.map((player) => (
                        <PlayerCard key={player.id ?? player.name} player={player} />
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()
          ) : (
            // Vertical layout for FFA or other team counts
            <div className="flex flex-col gap-8">
              {Object.entries(teams).map(([teamId, teamPlayers]) => (
                <div key={teamId} className="flex flex-col gap-3">
                  <span
                    className="font-display text-muted"
                    style={{ fontSize: '.55rem', letterSpacing: '.25em' }}
                  >
                    ── TEAM {Number(teamId) + 1} ──
                  </span>
                  <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}
                  >
                    {teamPlayers.map((player) => (
                      <PlayerCard key={player.id ?? player.name} player={player} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* APM chart */}
      {players.some((p) => p.actions?.timed?.length > 0) && (
        <Section label="Actions Per Minute">
          <ApmChart players={players} trackingInterval={replay.apm.trackingInterval} />
        </Section>
      )}

      {/* Raw JSON */}
      <Section label="Raw Data">
        <details>
          <summary
            className="cursor-pointer text-muted select-none font-display"
            style={{ fontSize: '.6rem', letterSpacing: '.12em' }}
          >
            Reveal Replay Contents
          </summary>
          <pre
            className="mt-3 p-4 text-muted bg-surface overflow-x-auto max-h-96 font-mono leading-relaxed"
            style={{
              fontSize: '.65rem',
              border: '1px solid var(--border)',
              borderTop: '1px solid rgba(200,160,80,0.15)',
            }}
          >
            {JSON.stringify(replay, null, 2)}
          </pre>
        </details>
      </Section>
    </div>
  )
}
