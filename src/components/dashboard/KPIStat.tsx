import type { ReactNode } from "react"
import clsx from "clsx"
import ReactECharts from "echarts-for-react"

type Props = {
  label: ReactNode
  value: ReactNode
  delta?: number | null
  deltaSuffix?: string
  icon?: ReactNode
  hint?: ReactNode
  loading?: boolean
  sparkline?: number[]
  className?: string
}

export default function KPIStat({
  label,
  value,
  delta = null,
  deltaSuffix = "",
  icon,
  hint,
  loading = false,
  sparkline,
  className,
}: Props) {
  const positive = typeof delta === "number" ? delta >= 0 : undefined
  return (
    <div className={clsx("bg-white border border-slate-200 rounded-2xl p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon && (
              <span className="grid place-items-center w-8 h-8 rounded-xl bg-slate-50 text-slate-700">
                {icon}
              </span>
            )}
            <span className="text-slate-500 text-sm truncate">{label}</span>
          </div>
          {loading ? (
            <div className="mt-2 h-8 w-24 rounded bg-slate-100 animate-pulse" />
          ) : (
            <div className="mt-2 text-3xl font-semibold text-slate-900 leading-tight">{value}</div>
          )}
          {typeof delta === "number" && (
            <div
              className={clsx(
                "mt-1 text-xs font-medium",
                positive ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {positive ? "↑ " : "↓ "}
              {Math.abs(delta).toLocaleString("es-PE")}%
              {deltaSuffix ? ` ${deltaSuffix}` : ""}
            </div>
          )}
        </div>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </div>
      {sparkline && sparkline.length > 0 && (
        <div className="mt-4">
          <ReactECharts
            style={{ height: 56 }}
            notMerge
            option={{
              grid: { left: 0, right: 0, top: 8, bottom: 0 },
              xAxis: { type: "category", show: false, data: sparkline.map((_, i) => i + 1) },
              yAxis: { type: "value", show: false },
              tooltip: { trigger: "axis" },
              series: [
                {
                  type: "line",
                  data: sparkline,
                  smooth: true,
                  symbol: "none",
                  lineStyle: { width: 2, color: "#0ea5e9" },
                  areaStyle: { opacity: 0.08, color: "#0ea5e9" },
                },
              ],
            }}
          />
        </div>
      )}
    </div>
  )
}
