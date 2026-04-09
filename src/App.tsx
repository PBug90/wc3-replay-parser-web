import { useState } from 'react'
import w3gjsPkg from '../node_modules/w3gjs/package.json'
import { useReplayParser } from './useReplayParser'
import DropZone from './components/DropZone'
import ReplayView from './components/ReplayView'
import W3CMatchBrowser from './components/W3CMatchBrowser'
import CompareView from './components/CompareView'
import MagicPoof from './components/MagicPoof'

type Tab = 'upload' | 'w3c' | 'compare'

const TAB_LABELS: Record<Tab, string> = {
  upload: 'Load Replay',
  w3c: 'W3Champions',
  compare: 'Replay Comparison',
}

export default function App() {
  const {
    replay,
    actions,
    buildings,
    loading,
    error,
    fileName,
    inputReplayBuffer,
    parseFile,
    parseUrl,
    parseBuffer,
    reset,
  } = useReplayParser()

  const parserA = useReplayParser()
  const parserB = useReplayParser()

  const [tab, setTab] = useState<Tab>('upload')

  const showSingleResults = !!(replay && !loading && tab !== 'compare')
  const showCompareResults = !!(
    parserA.replay &&
    !parserA.loading &&
    parserB.replay &&
    !parserB.loading
  )

  return (
    <div className="min-h-screen bg-bg">
      <MagicPoof />
      {/* ── Corner ribbon ───────────────────────────────── */}
      <a
        href="https://www.buymeacoffee.com/PBug90"
        target="_blank"
        rel="noreferrer"
        className="font-display fixed block text-center no-underline bg-gold text-bg z-[100]"
        style={{
          top: 52,
          right: -68,
          width: 260,
          transform: 'rotate(45deg)',
          padding: '9px 0',
          fontSize: '.55rem',
          fontWeight: 700,
          letterSpacing: '.18em',
          boxShadow: '0 2px 20px rgba(0,0,0,0.8)',
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

      <div className="max-w-[1400px] mx-auto px-12 pt-16 pb-24">
        {/* ── Header ──────────────────────────────────────── */}
        <header className="mb-16 text-center">
          {/* Main title */}
          <h1
            className="font-cinzel-deco title-glow m-0 leading-none"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', letterSpacing: '.06em' }}
          >
            Warcraft III
          </h1>
          <p
            className="font-display text-foreground m-0 mt-2"
            style={{
              fontSize: 'clamp(.9rem, 2vw, 1.3rem)',
              letterSpacing: '.35em',
              color: 'var(--text)',
              opacity: 0.6,
            }}
          >
            REPLAY PARSER
          </p>

          {/* Decorative bottom rule */}
          <div className="flex items-center gap-4 mt-6">
            <div
              className="flex-1 h-px"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(200,160,80,0.3), transparent)',
              }}
            />
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polygon
                points="7,0 8.5,5.5 14,7 8.5,8.5 7,14 5.5,8.5 0,7 5.5,5.5"
                fill="var(--gold)"
                opacity="0.6"
              />
            </svg>
            <div
              className="flex-1 h-px"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(200,160,80,0.3), transparent)',
              }}
            />
          </div>

          {/* Meta info */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <a
              href="https://github.com/PBug90/w3gjs"
              target="_blank"
              rel="noreferrer"
              className="font-mono no-underline hover:underline"
              style={{
                fontSize: '.62rem',
                color: 'var(--gold)',
                opacity: 0.7,
                letterSpacing: '.08em',
              }}
            >
              w3gjs v{w3gjsPkg.version}
            </a>
            <span className="text-muted" style={{ fontSize: '.5rem' }}>
              ◆
            </span>
            <span
              className="font-mono text-muted"
              style={{ fontSize: '.62rem', letterSpacing: '.06em' }}
            >
              parsed locally in your browser
            </span>
          </div>
        </header>

        {/* ── Tabs ────────────────────────────────────────── */}
        <div className={showSingleResults ? 'hidden' : 'block'}>
          <div
            className="flex justify-center border-b border-border mb-8"
            style={{ borderBottomColor: 'rgba(200,160,80,0.15)' }}
          >
            {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`wc3-tab${tab === t ? ' active' : ''}`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {tab === 'upload' && (
            <DropZone loading={loading} fileName={fileName} onFile={parseFile} onUrl={parseUrl} />
          )}
          {tab === 'w3c' && <W3CMatchBrowser loading={loading} onBuffer={parseBuffer} />}
          {tab === 'compare' && !showCompareResults && (
            <div className="flex gap-6">
              <div className="flex-1 flex flex-col gap-3">
                <span className="section-label">First Replay</span>
                <DropZone
                  loading={parserA.loading}
                  fileName={parserA.fileName}
                  onFile={parserA.parseFile}
                  onUrl={parserA.parseUrl}
                />
                {parserA.error && (
                  <span className="font-mono text-red-400" style={{ fontSize: '.72rem' }}>
                    {parserA.error}
                  </span>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-3">
                <span className="section-label">Second Replay</span>
                <DropZone
                  loading={parserB.loading}
                  fileName={parserB.fileName}
                  onFile={parserB.parseFile}
                  onUrl={parserB.parseUrl}
                />
                {parserB.error && (
                  <span className="font-mono text-red-400" style={{ fontSize: '.72rem' }}>
                    {parserB.error}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Single replay error ──────────────────────────── */}
        {error && tab !== 'compare' && (
          <div
            className="font-mono mt-6 px-4 py-3.5 text-red-400"
            style={{
              fontSize: '.72rem',
              letterSpacing: '.03em',
              border: '1px solid rgba(184,48,48,0.4)',
              background: 'rgba(184,48,48,0.08)',
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* ── Single replay results ────────────────────────── */}
        {showSingleResults && (
          <div className="fade-up">
            <div className="mb-10 flex items-center gap-3">
              <button className="btn-flat flex items-center gap-2" onClick={reset}>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                >
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                New Replay
              </button>
              {inputReplayBuffer && (
                <button
                  className="btn-flat flex items-center gap-2"
                  onClick={() => {
                    const blob = new Blob([inputReplayBuffer], { type: 'application/octet-stream' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = fileName ?? 'replay.w3g'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                  >
                    <path d="M12 5v14M5 12l7 7 7-7" />
                    <path d="M5 19h14" />
                  </svg>
                  Download Replay
                </button>
              )}
              <div
                className="flex-1 h-px"
                style={{
                  background: 'linear-gradient(to right, rgba(200,160,80,0.2), transparent)',
                }}
              />
              <span
                className="font-mono text-muted"
                style={{ fontSize: '.6rem', letterSpacing: '.06em' }}
              >
                {fileName}
              </span>
            </div>
            <ReplayView
              replay={replay}
              actions={actions}
              buildings={buildings}
              fileName={fileName}
            />
          </div>
        )}

        {/* ── Compare results ──────────────────────────────── */}
        {tab === 'compare' && showCompareResults && (
          <div className="fade-up flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <button
                className="btn-flat flex items-center gap-2"
                onClick={() => {
                  parserA.reset()
                  parserB.reset()
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                >
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                New Comparison
              </button>
              <div
                className="flex-1 h-px"
                style={{
                  background: 'linear-gradient(to right, rgba(200,160,80,0.2), transparent)',
                }}
              />
            </div>
            <CompareView
              replayA={parserA.replay!}
              replayB={parserB.replay!}
              fileNameA={parserA.fileName}
              fileNameB={parserB.fileName}
              actionsA={parserA.actions}
              buildingsA={parserA.buildings}
              actionsB={parserB.actions}
              buildingsB={parserB.buildings}
            />
          </div>
        )}
      </div>
    </div>
  )
}
