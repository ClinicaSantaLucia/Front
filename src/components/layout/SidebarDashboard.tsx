import { useEffect, useMemo, useState } from "react"
import clsx from "clsx"
import { motion } from "framer-motion"
import type { ReactNode } from "react"
import {
  Gauge,
  Activity,
  PieChart,
  Users,
  Layers,
  Wallet,
  ShieldCheck,
  Table2,
  FileDown,
  Star,
} from "lucide-react"

type Item = {
    id: string
    label: string
    icon: ReactNode
  }

const HEADER_OFFSET = 72

export default function SidebarDashboard() {
  const items: Item[] = useMemo(
    () => [
      { id: "resumen", label: "Resumen", icon: <Gauge className="w-4 h-4" /> },
      { id: "actividad", label: "Actividad", icon: <Activity className="w-4 h-4" /> },
      { id: "composicion", label: "Composición", icon: <PieChart className="w-4 h-4" /> },
      { id: "medicos", label: "Médicos", icon: <Users className="w-4 h-4" /> },
      { id: "procedimientos", label: "Procedimientos", icon: <Layers className="w-4 h-4" /> },
      { id: "finanzas", label: "Finanzas", icon: <Wallet className="w-4 h-4" /> },
      { id: "calidad", label: "Calidad de datos", icon: <ShieldCheck className="w-4 h-4" /> },
      { id: "explorar", label: "Explorar", icon: <Table2 className="w-4 h-4" /> },
      { id: "reportes", label: "Reportes", icon: <FileDown className="w-4 h-4" /> },
      { id: "vistas", label: "Vistas guardadas", icon: <Star className="w-4 h-4" /> },
    ],
    []
  )

  const [active, setActive] = useState<string>("resumen")

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target?.id) setActive(visible[0].target.id)
      },
      { rootMargin: `-${HEADER_OFFSET + 8}px 0px -70% 0px`, threshold: [0.1, 0.25, 0.5] }
    )
    items.forEach((it) => {
      const el = document.getElementById(it.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [items])

  const scrollToId = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET)
    window.scrollTo({ top, behavior: "smooth" })
  }

  return (
    <>
      <nav className="lg:hidden sticky top-16 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 py-2">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => scrollToId(it.id)}
              className={clsx(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs border transition-colors",
                active === it.id
                  ? "bg-sky-50 text-sky-700 border-sky-200"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      </nav>

      <aside className="hidden lg:block w-64 shrink-0">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="sticky top-20"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => scrollToId(it.id)}
                className={clsx(
                  "w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors",
                  active === it.id
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <span
                  className={clsx(
                    "grid place-items-center rounded-md border",
                    "w-7 h-7",
                    active === it.id
                      ? "bg-white border-sky-200 text-sky-700"
                      : "bg-white border-slate-200 text-slate-600"
                  )}
                >
                  {it.icon}
                </span>
                <span className="truncate">{it.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </aside>
    </>
  )
}
