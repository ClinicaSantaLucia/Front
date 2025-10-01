import type { ReactNode } from "react"
import clsx from "clsx"

type Props = {
  label: ReactNode
  iconLeft?: ReactNode
  onRemove?: () => void
  onClick?: () => void
  variant?: "default" | "active"
  className?: string
}

export default function BadgeChip({
  label,
  iconLeft,
  onRemove,
  onClick,
  variant = "default",
  className,
}: Props) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs select-none transition-colors"
  const styles =
    variant === "active"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
  return (
    <span
      className={clsx(base, styles, className)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : -1}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return
        if (e.key === "Enter" || e.key === " ") onClick()
      }}
    >
      {iconLeft && <span className="text-slate-500">{iconLeft}</span>}
      <span className="truncate max-w-[12rem]">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 -mr-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          aria-label="Quitar filtro"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}
