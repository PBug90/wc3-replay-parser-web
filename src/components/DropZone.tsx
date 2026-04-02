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
        style={{ padding: '3.5rem 2rem' }}
      >
        <div className="flex flex-col items-center gap-3 pointer-events-none select-none">
          {/* Upload icon */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
            style={{ color: 'var(--muted)', opacity: loading ? 0.4 : 1 }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>

          <div className="flex flex-col items-center gap-1">
            <span
              className="font-display"
              style={{
                fontSize: '1.05rem',
                fontWeight: 500,
                letterSpacing: '.06em',
                color: loading ? 'var(--muted)' : 'var(--text)',
              }}
            >
              {loading ? `PARSING ${(fileName ?? '').toUpperCase()}…` : 'DROP REPLAY FILE'}
            </span>
            <span style={{ fontSize: '.75rem', color: 'var(--muted)', letterSpacing: '.02em' }}>
              {loading ? 'Please wait' : '.w3g format · click or drag & drop'}
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
        <span className="section-label" style={{ flexShrink: 0 }}>
          Try an example
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
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
