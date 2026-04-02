import { useState } from 'react'
import w3gjsPkg from '../node_modules/w3gjs/package.json'
import { useReplayParser } from './useReplayParser'
import DropZone from './components/DropZone'
import ReplayView from './components/ReplayView'
import W3CMatchBrowser from './components/W3CMatchBrowser'

type Tab = 'upload' | 'w3c'

export default function App() {
  const { replay, actions, loading, error, fileName, parseFile, parseUrl, parseBuffer, reset } =
    useReplayParser()
  const [tab, setTab] = useState<Tab>('upload')

  const showResults = replay && !loading

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Corner ribbon ───────────────────────────────── */}
      <a
        href="https://www.buymeacoffee.com/PBug90"
        target="_blank"
        rel="noreferrer"
        style={{
          position: 'fixed',
          top: 52,
          right: -68,
          width: 260,
          transform: 'rotate(45deg)',
          background: 'var(--accent)',
          textAlign: 'center',
          zIndex: 100,
          boxShadow: '0 2px 12px rgba(0,0,0,.5)',
          padding: '9px 0',
          display: 'block',
          textDecoration: 'none',
          fontFamily: "'Outfit', sans-serif",
          fontSize: '.72rem',
          fontWeight: 600,
          letterSpacing: '.06em',
          color: '#0b0b0e',
        }}
      >
        <span className="steam-wrap">
          ☕
          <span className="steam" />
          <span className="steam" />
          <span className="steam" />
        </span>{' '}
        BUY ME A COFFEE
      </a>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        {/* ── Header ──────────────────────────────────────── */}
        <header style={{ marginBottom: '3.5rem' }}>
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(2.8rem, 7vw, 4.5rem)',
              fontWeight: 600,
              letterSpacing: '.04em',
              lineHeight: 1,
              color: 'var(--text)',
              margin: 0,
            }}
          >
            Warcraft 3 Replay Parser
          </h1>
          <div
            style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <a
              href="https://github.com/PBug90/w3gjs"
              target="_blank"
              rel="noreferrer"
              className="font-mono"
              style={{
                fontSize: '.7rem',
                color: 'var(--accent)',
                letterSpacing: '.1em',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              w3gjs v{w3gjsPkg.version}
            </a>
            <span style={{ width: 1, height: 10, background: 'var(--border-hi)' }} />
            <span
              className="font-mono"
              style={{ fontSize: '.7rem', color: 'var(--muted)', letterSpacing: '.08em' }}
            >
              .w3g file parser — parsed locally in your browser
            </span>
          </div>
        </header>

        {/* ── Upload / W3Champions tabs ────────────────────── */}
        <div style={{ display: showResults ? 'none' : 'block' }}>
          {/* Tab bar */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border)',
              marginBottom: '1.5rem',
            }}
          >
            {(['upload', 'w3c'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="font-mono"
                style={{
                  padding: '.5rem 1.25rem',
                  fontSize: '.7rem',
                  letterSpacing: '.08em',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
                  color: tab === t ? 'var(--text)' : 'var(--muted)',
                  cursor: 'pointer',
                  marginBottom: -1,
                  transition: 'color .15s',
                }}
              >
                {t === 'upload' ? 'UPLOAD FILE' : 'W3CHAMPIONS'}
              </button>
            ))}
          </div>

          {tab === 'upload' && (
            <DropZone loading={loading} fileName={fileName} onFile={parseFile} onUrl={parseUrl} />
          )}
          {tab === 'w3c' && <W3CMatchBrowser loading={loading} onBuffer={parseBuffer} />}
        </div>

        {/* ── Error ───────────────────────────────────────── */}
        {error && (
          <div
            className="font-mono"
            style={{
              marginTop: '1.5rem',
              padding: '.875rem 1rem',
              border: '1px solid #7f1d1d',
              background: 'rgba(127,29,29,.15)',
              fontSize: '.75rem',
              color: '#fca5a5',
              letterSpacing: '.02em',
            }}
          >
            ERROR — {error}
          </div>
        )}

        {/* ── Results ─────────────────────────────────────── */}
        {showResults && (
          <div className="fade-up">
            {/* Parse another */}
            <div
              style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
            >
              <button
                className="btn-flat"
                onClick={reset}
                style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                >
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                PARSE ANOTHER REPLAY
              </button>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span
                className="font-mono"
                style={{ fontSize: '.65rem', color: 'var(--muted)', letterSpacing: '.08em' }}
              >
                {fileName}
              </span>
            </div>

            <ReplayView replay={replay} actions={actions} fileName={fileName} />
          </div>
        )}
      </div>
    </div>
  )
}
