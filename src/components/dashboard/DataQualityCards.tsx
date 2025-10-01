import clsx from "clsx"

type Props = {
  total: number
  withPdf: number
  complete: number
  inconsistencies: number
  loading?: boolean
  className?: string
}

function pct(part: number, total: number) {
  if (!total || total <= 0) return 0
  return Math.round((Math.max(0, part) * 100) / total)
}

export default function DataQualityCards({
  total,
  withPdf,
  complete,
  inconsistencies,
  loading = false,
  className,
}: Props) {
  const pdfPct = pct(withPdf, total)
  const completePct = pct(complete, total)
  const incoPct = pct(inconsistencies, total)

  return (
    <div className={clsx("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {[
        {
          title: "% con PDF adjunto",
          value: `${pdfPct}%`,
          sub: `${withPdf.toLocaleString("es-PE")} de ${total.toLocaleString("es-PE")}`,
          bar: pdfPct,
          tone: "sky",
        },
        {
          title: "% completitud de campos",
          value: `${completePct}%`,
          sub: `${complete.toLocaleString("es-PE")} completos`,
          bar: completePct,
          tone: "emerald",
        },
        {
          title: "Incoherencias de fecha",
          value: inconsistencies.toLocaleString("es-PE"),
          sub: `${incoPct}% del total`,
          bar: Math.min(incoPct, 100),
          tone: "amber",
        },
        {
          title: "Registros totales",
          value: total.toLocaleString("es-PE"),
          sub: "Base analizada",
          bar: 100,
          tone: "slate",
        },
      ].map((k, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4">
          {loading ? (
            <>
              <div className="h-4 w-40 bg-slate-100 rounded mb-2" />
              <div className="h-8 w-24 bg-slate-100 rounded mb-2" />
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-5/6 bg-slate-100 rounded mt-2" />
            </>
          ) : (
            <>
              <div className="text-sm text-slate-500">{k.title}</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">{k.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{k.sub}</div>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all",
                    k.tone === "sky" && "bg-sky-500",
                    k.tone === "emerald" && "bg-emerald-500",
                    k.tone === "amber" && "bg-amber-500",
                    k.tone === "slate" && "bg-slate-500"
                  )}
                  style={{ width: `${k.bar}%` }}
                />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
