import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { findMapInfo } from './mapInformation'

/*
 * WC3 coordinate system has its center at (offset_x, offset_y) in world units.
 * Canvas has (0, 0) at the top-left corner.
 *
 *   x_canvas = (x_wc3 - offset_x) / xScale + canvasWidth  / 2
 *   y_canvas = canvasHeight / 2 - (y_wc3 - offset_y) / yScale
 *
 * where xScale = mapWorldWidth / canvasWidth
 * offset_x / offset_y default to 0 for maps centered at the origin.
 *
 * if the displayed action locations seem off open the map in World Editor
 * and hover with the mouse over the center of the map. if 0/0 is not close to the center,
 * the offset for x and y is the location shown in the editor when the cursor is a the approximate
 * center of the map
 */

export interface PositionedAction {
  time: number
  playerId: number
  x: number
  y: number
}

interface HeatmapProps {
  actions: PositionedAction[]
  mapFile: string
  playerIdColorMap: Record<number, string>
  width?: number
  height?: number
}

const DOT_RADIUS = 14 // canvas pixels (radial gradient radius)

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Parse a "#rrggbb" hex string into an [r, g, b] triple. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
  ]
}

export default function Heatmap({
  actions,
  mapFile,
  playerIdColorMap,
  width = 500,
  height = 500,
}: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Total game length derived from the last recorded action.
  const maxSec = useMemo(
    () => (actions.length > 0 ? Math.ceil(Math.max(...actions.map((a) => a.time)) / 1000) : 600),
    [actions],
  )

  // playhead = end of the visible window (seconds).
  // windowSec = how many seconds the window covers.
  const [playhead, setPlayhead] = useState(Math.min(30, maxSec))
  const [windowSec, setWindowSec] = useState(60)

  // Reset playhead when a new replay is loaded.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlayhead(Math.min(60, maxSec))
  }, [actions, maxSec])

  const endSec = Math.min(playhead, maxSec)
  const startSec = Math.max(0, endSec - windowSec)

  const mapInfo = findMapInfo(mapFile)

  // Pre-parse player hex colours to [r,g,b] once per render, not per dot.
  const rgbCache = useMemo(() => {
    const cache: Record<number, [number, number, number]> = {}
    for (const [id, hex] of Object.entries(playerIdColorMap)) {
      cache[Number(id)] = hexToRgb(hex)
    }
    return cache
  }, [playerIdColorMap])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !mapInfo) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const xScale = mapInfo.width / width
    const yScale = mapInfo.height / height
    const offsetX = mapInfo.offset_x ?? 0
    const offsetY = mapInfo.offset_y ?? 0
    const startMs = startSec * 1000
    const endMs = endSec * 1000

    ctx.clearRect(0, 0, width, height)
    ctx.globalCompositeOperation = 'screen'

    for (const action of actions) {
      if (action.time < startMs || action.time > endMs) continue

      const cx = (action.x - offsetX) / xScale + width / 2
      const cy = height / 2 - (action.y - offsetY) / yScale

      // Skip dots fully outside the canvas.
      if (cx < -DOT_RADIUS || cx > width + DOT_RADIUS) continue
      if (cy < -DOT_RADIUS || cy > height + DOT_RADIUS) continue

      const [r, g, b] = rgbCache[action.playerId] ?? [255, 255, 255]

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, DOT_RADIUS)
      gradient.addColorStop(0, `rgba(${r},${g},${b},0.35)`)
      gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(cx, cy, DOT_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalCompositeOperation = 'source-over'
  }, [actions, mapInfo, rgbCache, startSec, endSec, width, height])

  useEffect(() => {
    draw()
  }, [draw])

  if (!mapInfo) {
    return (
      <p className="text-xs text-zinc-500 italic">
        Map visualization not available for: {mapFile || 'unknown'}
      </p>
    )
  }

  const visibleCount = actions.filter(
    (a) => a.time >= startSec * 1000 && a.time <= endSec * 1000,
  ).length

  return (
    <div className="flex flex-col gap-3" style={{ width }}>
      {mapInfo.displayName && <p className="text-xs text-zinc-500">{mapInfo.displayName}</p>}

      {/* Map + canvas overlay */}
      <div
        style={{ width, height, position: 'relative' }}
        className="rounded overflow-hidden border border-zinc-700"
      >
        <img src={mapInfo.image} alt="map" style={{ width, height, display: 'block' }} />
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ position: 'absolute', left: 0, top: 0 }}
        />
      </div>

      {/* Time slider */}
      <div className="flex flex-col gap-1.5">
        <input
          type="range"
          min={0}
          max={maxSec}
          step={1}
          value={playhead}
          onChange={(e) => setPlayhead(Number(e.target.value))}
          className="w-full accent-zinc-400 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-zinc-500 select-none">
          <span>{fmt(startSec)}</span>
          <span className="text-zinc-400">{visibleCount} actions</span>
          <span>{fmt(endSec)}</span>
        </div>
      </div>

      {/* Window-size control */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span>Window</span>
        {[10, 30, 45, 60].map((s) => (
          <label key={s} className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="radio"
              name="windowSec"
              value={s}
              checked={windowSec === s}
              onChange={() => setWindowSec(s)}
              className="accent-zinc-400"
            />
            <span className={windowSec === s ? 'text-zinc-300' : ''}>{s}s</span>
          </label>
        ))}
      </div>

      {/* Player colour legend */}
      {Object.keys(playerIdColorMap).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(playerIdColorMap).map(([id, color]) => (
            <span key={id} className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: color }}
              />
              P{id}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
