import { useRef, useState } from 'react'

const SUGGESTION_LIMIT = 8

interface Props {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  disabled: boolean
  topPlayers: string[]
}

export default function PlayerSearchInput({
  value,
  onChange,
  onSearch,
  disabled,
  topPlayers,
}: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const trimmedLower = value.trim().toLowerCase()
  const suggestions =
    trimmedLower.length > 0
      ? topPlayers
          .filter((t) => t.split('#')[0].toLowerCase().includes(trimmedLower))
          .slice(0, SUGGESTION_LIMIT)
      : []
  function selectSuggestion(tag: string) {
    onChange(tag)
    setShowSuggestions(false)
    setActiveSuggestion(-1)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveSuggestion((i) => Math.max(i - 1, -1))
        return
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        setActiveSuggestion(-1)
        return
      }
      if (e.key === 'Enter' && activeSuggestion >= 0) {
        e.preventDefault()
        selectSuggestion(suggestions[activeSuggestion])
        return
      }
    }
    if (e.key === 'Enter') onSearch()
  }

  function handleBlur(e: React.FocusEvent) {
    if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
      setShowSuggestions(false)
      setActiveSuggestion(-1)
    }
  }

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setShowSuggestions(true)
          setActiveSuggestion(-1)
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="BattleTag — e.g. Grubby#2759"
        disabled={disabled}
        className="font-mono"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: 'var(--surface)',
          border: '1px solid var(--border-hi)',
          color: 'var(--text)',
          padding: '.5rem .75rem',
          fontSize: '.78rem',
          letterSpacing: '.03em',
          outline: 'none',
        }}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--surface)',
            border: '1px solid var(--border-hi)',
            borderTop: 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {suggestions.map((s, i) => {
            const [name, discriminator] = s.split('#')
            return (
              <div
                key={s}
                onMouseDown={(e) => {
                  e.preventDefault()
                  selectSuggestion(s)
                }}
                onMouseEnter={() => setActiveSuggestion(i)}
                onMouseLeave={() => setActiveSuggestion(-1)}
                style={{
                  padding: '.35rem .75rem',
                  cursor: 'pointer',
                  background: i === activeSuggestion ? 'var(--bg)' : 'transparent',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '.375rem',
                }}
              >
                <span style={{ fontSize: '.78rem', color: 'var(--text)' }}>{name}</span>
                <span className="font-mono" style={{ fontSize: '.65rem', color: 'var(--muted)' }}>
                  #{discriminator}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
