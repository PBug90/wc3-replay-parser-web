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
        className={`text-foreground font-normal text-sm ${
          wrap ? 'break-all' : 'overflow-hidden text-ellipsis whitespace-nowrap'
        }`}
        style={{ letterSpacing: '.01em' }}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}
