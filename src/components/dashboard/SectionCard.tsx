import type { ReactNode } from "react"
import clsx from "clsx"
import { motion } from "framer-motion"

type Props = {
  id?: string
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
}

export default function SectionCard({
  id,
  title,
  subtitle,
  actions,
  children,
  className,
  headerClassName,
  contentClassName,
}: Props) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={clsx("bg-white rounded-2xl border border-slate-200 shadow-sm", className)}
    >
      {(title || actions || subtitle) && (
        <div
          className={clsx(
            "px-4 sm:px-5 pt-4 pb-3 border-b border-slate-200/70 flex items-start sm:items-center justify-between gap-3",
            headerClassName
          )}
        >
          <div className="min-w-0">
            {title && <h3 className="text-base font-semibold text-slate-800 truncate">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={clsx("p-4 sm:p-5", contentClassName)}>{children}</div>
    </motion.section>
  )
}
