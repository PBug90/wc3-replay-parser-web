import type { ParserOutput } from 'w3gjs/dist/types/types'
import type { PositionedAction } from '../Heatmap'
import Heatmap from '../Heatmap'
import ApmChart from '../ApmChart'
import Meta from './Meta'
import PlayerCard from './PlayerCard'
import { formatDuration } from '../format'

interface ReplayViewProps {
  replay: ParserOutput
  actions: PositionedAction[]
  fileName: string | null
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: '1.25rem' }}>
      <div className="flex items-center gap-3">
        <span className="section-label">{label}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>
      {children}
    </div>
  )
}

export default function ReplayView({ replay, actions, fileName }: ReplayViewProps) {
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
    <div className="flex flex-col" style={{ gap: '3rem' }}>
      {/* Metadata strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '1.5rem 2rem',
          padding: '1.5rem',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
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

      {/* Action heatmap */}
      {actions.length > 0 && (
        <Section label="Action Map">
          <Heatmap
            actions={actions}
            mapFile={mapFile}
            playerIdColorMap={playerIdColorMap}
            width={500}
            height={500}
          />
        </Section>
      )}

      {/* APM chart */}
      {players.some((p) => p.actions?.timed?.length > 0) && (
        <Section label="APM Over Time">
          <ApmChart players={players} trackingInterval={replay.apm.trackingInterval} />
        </Section>
      )}

      {/* Teams */}
      {Object.keys(teams).length > 0 && (
        <Section label="Players">
          <div className="flex flex-col" style={{ gap: '2rem' }}>
            {Object.entries(teams).map(([teamId, teamPlayers]) => (
              <div key={teamId} className="flex flex-col" style={{ gap: '.75rem' }}>
                <span
                  className="font-mono"
                  style={{ fontSize: '.65rem', color: 'var(--muted)', letterSpacing: '.1em' }}
                >
                  TEAM {Number(teamId) + 1}
                </span>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {teamPlayers.map((player) => (
                    <PlayerCard key={player.id ?? player.name} player={player} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Raw JSON */}
      <Section label="Raw Data">
        <details>
          <summary
            style={{
              cursor: 'pointer',
              fontSize: '.75rem',
              color: 'var(--muted)',
              letterSpacing: '.04em',
              userSelect: 'none',
            }}
          >
            Show JSON
          </summary>
          <pre
            style={{
              marginTop: '.75rem',
              padding: '1rem',
              fontSize: '.7rem',
              color: 'var(--muted)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              overflowX: 'auto',
              maxHeight: '24rem',
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1.6,
            }}
          >
            {JSON.stringify(replay, null, 2)}
          </pre>
        </details>
      </Section>
    </div>
  )
}
