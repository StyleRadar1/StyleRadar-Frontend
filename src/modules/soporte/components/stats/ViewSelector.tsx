export interface ViewOption<T extends string> {
  id: T
  label: string
}

export function ViewSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly ViewOption<T>[]
  value: T
  onChange: (next: T) => void
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-white/[.03] p-1"
    >
      {options.map((opt) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.id)}
            className={`glass-pill cursor-pointer px-2.5 py-1 text-xs font-semibold ${
              active ? 'is-active' : ''
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
