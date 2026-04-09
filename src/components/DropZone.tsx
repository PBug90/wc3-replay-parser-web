import { useRef, useState, useCallback } from 'react'
import { EXAMPLE_REPLAYS } from '../constants'

interface DropZoneProps {
  loading: boolean
  fileName: string | null
  onFile: (file: File) => void
  onUrl: (url: string) => void
}

export default function DropZone({ loading, fileName, onFile, onUrl }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }
  const onDragLeave = () => setDragging(false)

  return (
    <div className="flex flex-col gap-6">
      {/* Drop area */}
      <div
        className={`drop-zone${dragging ? ' dragging' : ''}`}
        onClick={() => !loading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        style={{ padding: '4rem 2rem' }}
      >
        <div className="flex flex-col items-center gap-4 pointer-events-none select-none">
          {/* Scroll icon */}
          {loading ? (
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--gold)"
              strokeWidth="1"
              strokeLinecap="round"
              style={{ opacity: 0.7 }}
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10" />
              <path d="M12 6v6l4 2" />
            </svg>
          ) : (
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--gold)"
              strokeWidth="1"
              strokeLinecap="round"
              style={{ opacity: dragging ? 1 : 0.5 }}
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <polyline points="9 15 12 12 15 15" />
            </svg>
          )}

          <div className="flex flex-col items-center gap-2">
            <span
              className={`font-display ${loading ? 'parsing-text' : ''}`}
              style={{
                fontSize: '.85rem',
                letterSpacing: '.2em',
                color: loading ? undefined : dragging ? 'var(--gold)' : 'var(--text)',
                fontWeight: 600,
              }}
            >
              {loading
                ? `Deciphering ${(fileName ?? '').toUpperCase()}…`
                : dragging
                  ? 'DROP REPLAY HERE'
                  : 'PLACE YOUR REPLAY HERE'}
            </span>
            <span
              className="font-mono text-muted"
              style={{ fontSize: '.62rem', letterSpacing: '.08em' }}
            >
              {loading
                ? 'The seers are reading the battle record…'
                : '.w3g · click to browse or drag & drop'}
            </span>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".w3g"
          className="hidden"
          onChange={onFileChange}
          disabled={loading}
        />
      </div>

      {/* Example replays */}
      <div className="flex items-center gap-4">
        <span className="section-label shrink-0">Replays</span>
        <div
          className="flex-1 h-px"
          style={{ background: 'linear-gradient(to right, rgba(200,160,80,0.2), transparent)' }}
        />
        <div className="flex gap-2">
          {EXAMPLE_REPLAYS.map(({ label, url }) => (
            <button key={url} className="btn-flat" disabled={loading} onClick={() => onUrl(url)}>
              {fileName === url.split('/').pop() && loading ? 'Loading…' : label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
