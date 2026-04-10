const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

export function EventIcon({
  id,
  detail,
  kind,
}: {
  id: string
  detail: string
  kind: 'building' | 'upgrade'
}) {
  if (kind === 'building') {
    return (
      <img
        src={`${BASE}/buildings/${id}.png`}
        width={16}
        height={16}
        style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
      />
    )
  }
  const suffix = detail === 'Adept' || detail === 'Master' ? `_${detail}` : ''
  return (
    <img
      src={`${BASE}/upgrades/${id}${suffix}.png`}
      width={16}
      height={16}
      style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
    />
  )
}
