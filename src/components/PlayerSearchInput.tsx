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
    <div className="flex-1 relative">
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
        className="font-mono w-full box-border bg-surface border border-border-hi text-foreground outline-none"
        style={{
          padding: '.5rem .75rem',
          fontSize: '.78rem',
          letterSpacing: '.03em',
        }}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-[100] bg-surface border border-border-hi border-t-0 flex flex-col"
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
                className="flex items-baseline gap-1.5 cursor-pointer"
                style={{
                  padding: '.35rem .75rem',
                  background: i === activeSuggestion ? 'var(--bg)' : 'transparent',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span className="text-foreground" style={{ fontSize: '.78rem' }}>
                  {name}
                </span>
                <span className="font-mono text-muted" style={{ fontSize: '.65rem' }}>
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
