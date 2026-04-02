export default function Meta({
  label,
  value,
  wrap = false,
}: {
  label: string
  value: string
  wrap?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="section-label">{label}</span>
      <span
        style={{
          fontSize: '.875rem',
          color: 'var(--text)',
          fontWeight: 400,
          letterSpacing: '.01em',
          ...(wrap
            ? { wordBreak: 'break-all' }
            : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
        }}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}
