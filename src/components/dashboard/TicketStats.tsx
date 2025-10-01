import clsx from "clsx"

type Props = {
  avg: number
  median: number
  className?: string
}

function formatPEN(n: number) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 }).format(n || 0)
}

export default function TicketStats({ avg, median, className }: Props) {
  return (
    <div className={clsx("grid grid-cols-2 gap-4", className)}>
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="text-sm text-slate-500">Promedio</div>
        <div className="mt-1 text-2xl font-semibold text-slate-900">{formatPEN(avg)}</div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-sky-500 rounded-full" style={{ width: "60%" }} />
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="text-sm text-slate-500">Mediana</div>
        <div className="mt-1 text-2xl font-semibold text-slate-900">{formatPEN(median)}</div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: "50%" }} />
        </div>
      </div>
    </div>
  )
}
