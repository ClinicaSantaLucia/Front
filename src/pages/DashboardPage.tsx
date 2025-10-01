// src/pages/DashboardPage.tsx
import { useEffect, useMemo, useState } from "react"
import type { Models } from "appwrite"
import { databases, Query } from "../lib/appwrite"
import Header from "../components/layout/Header"
import SidebarDashboard from "../components/layout/SidebarDashboard"
import KPIStat from "../components/dashboard/KPIStat"
import KPISparkline from "../components/dashboard/KPISparkline"
import YearTotalsBar from "../components/dashboard/YearTotalsBar"
import MonthTotalsBar from "../components/dashboard/MonthTotalsBar"
import GenderPie from "../components/dashboard/GenderPie"
import TopDoctorsPie from "../components/dashboard/TopDoctorsPie"
import TopProceduresBar from "../components/dashboard/TopProceduresBar"
import ByDoctorStacked from "../components/dashboard/ByDoctorStacked"
import SpecialtyShareBar from "../components/dashboard/SpecialtyShareBar"
import ProceduresPareto from "../components/dashboard/ProceduresPareto"
import ProcedureTrend from "../components/dashboard/ProcedureTrend"
import { pct, mom, pareto, sumByMonth, countByMonth } from "../utils/metrics"
import { monthLabel, titleCase } from "../utils/format"

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
const medicalId = import.meta.env.VITE_APPWRITE_MEDICAL_COLLECTION_ID

type Doc = Models.Document & {
  admission_date?: string
  discharge_date?: string
  gender?: string
  descripcion?: string
  especialidad?: string
  motivo?: string
  doctor_first?: string
  doctor_last?: string
  patient_first_name?: string
  patient_last_name?: string
  amount?: number
  pdf_file_id?: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [docs, setDocs] = useState<Doc[]>([])
  const [year, setYear] = useState<number | "all">("all")

  useEffect(() => {
    let cancel = false
    ;(async () => {
      setLoading(true)
      const all: Doc[] = []
      let page = 0
      const limit = 100
      let more = true
      while (more) {
        const res = await databases.listDocuments<Doc>(databaseId, medicalId, [Query.limit(limit), Query.offset(page * limit)])
        all.push(...res.documents)
        more = res.documents.length === limit
        page++
      }
      if (!cancel) {
        setDocs(all)
        setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [])

  const yearsSet = useMemo(() => {
    const s = new Set<number>()
    docs.forEach((d) => {
      const dt = d.admission_date ? new Date(d.admission_date) : null
      if (dt && !isNaN(dt.getTime())) s.add(dt.getFullYear())
    })
    return s
  }, [docs])

  useEffect(() => {
    if (year === "all" && yearsSet.size) {
      const maxY = Math.max(...Array.from(yearsSet))
      setYear(maxY)
    }
  }, [year, yearsSet])

  const filtered = useMemo(() => {
    if (year === "all") return docs
    return docs.filter((d) => {
      const dt = d.admission_date ? new Date(d.admission_date) : null
      return dt && !isNaN(dt.getTime()) && dt.getFullYear() === year
    })
  }, [docs, year])

  const { totals: totalsAllMonths } = useMemo(
    () => countByMonth(docs, (x) => x.admission_date || null),
    [docs]
  )
  const sparkData = totalsAllMonths

  const totalHistorias = filtered.length
  const totalGlobal = docs.length

  const porAñoData = useMemo(() => {
    const map = new Map<number, number>()
    docs.forEach((d) => {
      const dt = d.admission_date ? new Date(d.admission_date) : null
      if (dt && !isNaN(dt.getTime())) {
        const y = dt.getFullYear()
        map.set(y, (map.get(y) || 0) + 1)
      }
    })
    return Array.from(map.entries())
      .map(([y, c]) => ({ year: y, count: c }))
      .sort((a, b) => a.year - b.year)
  }, [docs])

  const { months: monthsSel, totals: totalsSelMonths } = useMemo(
    () => countByMonth(filtered, (x) => x.admission_date || null),
    [filtered]
  )
  const labelsMes = monthsSel.map((m) => monthLabel(m, "es-PE", "long"))
  const curMonth = new Date().getMonth() + 1
  const prevMonth = curMonth === 1 ? 12 : curMonth - 1
  const deltaMensual = mom(totalsSelMonths[curMonth - 1] || 0, totalsSelMonths[prevMonth - 1] || 0)

  const generoData = useMemo(() => {
    let m = 0
    let f = 0
    filtered.forEach((d) => {
      const g = (d.gender || "").toLowerCase()
      if (g === "masculino") m++
      else if (g === "femenino") f++
    })
    return [
      { name: "masculino", value: m },
      { name: "femenino", value: f },
    ]
  }, [filtered])

  const opsMap = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((d) => {
      const op = titleCase(d.descripcion || "")
      if (!op) return
      map.set(op, (map.get(op) || 0) + 1)
    })
    return map
  }, [filtered])

  const opsList = useMemo(
    () =>
      Array.from(opsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value })),
    [opsMap]
  )

  const doctors = useMemo(() => {
    const set = new Set<string>()
    filtered.forEach((d) => {
      const ln = (d.doctor_last || "").trim().replace(/\s+/g, " ")
      if (ln) set.add(ln)
    })
    return Array.from(set)
  }, [filtered])

  const opsByDoctor = useMemo(() => {
    const ops = Array.from(new Set(opsList.map((x) => x.name)))
    const matrix: number[][] = doctors.map(() => Array(ops.length).fill(0))
    const idxOp = new Map(ops.map((o, i) => [o, i] as const))
    const idxDoc = new Map(doctors.map((d, i) => [d, i] as const))
    filtered.forEach((d) => {
      const op = titleCase(d.descripcion || "")
      const doc = (d.doctor_last || "").trim().replace(/\s+/g, " ")
      const io = idxOp.get(op)
      const id = idxDoc.get(doc)
      if (io != null && id != null) matrix[id][io] += 1
    })
    return { operations: ops, doctors, matrix }
  }, [filtered, doctors, opsList])

  const topDoctors = useMemo(() => {
    const counts = new Map<string, number>()
    filtered.forEach((d) => {
      const ln = (d.doctor_last || "").trim().replace(/\s+/g, " ")
      if (!ln) return
      counts.set(ln, (counts.get(ln) || 0) + 1)
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))
  }, [filtered])

  const specialtyData = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((d) => {
      const e = titleCase(d.especialidad || "")
      if (!e) return
      map.set(e, (map.get(e) || 0) + 1)
    })
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0)
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value, pct: pct(value, total, 0) }))
      .sort((a, b) => b.value - a.value)
  }, [filtered])

  const paretoData = useMemo(() => pareto(opsList, "value", 0.8), [opsList])

  const topProcedure = opsList[0]?.name || ""
  const procedureTrend = useMemo(() => {
    if (!topProcedure) return { months: monthsSel.map((m) => monthLabel(m, "es-PE", "short")), values: monthsSel.map(() => 0) }
    const arr = Array(12).fill(0)
    filtered.forEach((d) => {
      const name = titleCase(d.descripcion || "")
      if (name !== topProcedure) return
      const dt = d.admission_date ? new Date(d.admission_date) : null
      if (!dt || isNaN(dt.getTime())) return
      arr[dt.getMonth()] += 1
    })
    return { months: monthsSel.map((m) => monthLabel(m, "es-PE", "short")), values: arr }
  }, [filtered, monthsSel, topProcedure])

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
        <div className="w-full px-3 md:px-5 lg:px-6 py-5">
          <div className="flex gap-4 lg:gap-6 xl:gap-8">
            <SidebarDashboard />
            <main className="flex-1">
              <div className="sticky top-16 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-3 md:px-5 py-3 flex items-center justify-between">
                <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
                <div className="flex items-center gap-2">
                  <select
                    className="h-9 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                    value={year === "all" ? "" : String(year)}
                    onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "all")}
                  >
                    <option value="">{Array.from(yearsSet).length ? "Todos" : "—"}</option>
                    {Array.from(yearsSet)
                      .sort((a, b) => b - a)
                      .map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <section id="resumen" className="pt-6">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6">
                        <div className="h-4 w-28 bg-slate-100 rounded mb-2" />
                        <div className="h-8 w-24 bg-slate-100 rounded mb-3" />
                        <div className="h-10 w-full bg-slate-100 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-8">
                      <KPIStat label="Total historias" value={totalHistorias.toLocaleString("es-PE")} delta={deltaMensual} />
                      <KPIStat label="Total histórico" value={totalGlobal.toLocaleString("es-PE")} />
                    </div>
                    <div className="mt-6">
                      <KPISparkline data={sparkData} />
                    </div>
                  </>
                )}
              </section>

              <section id="actividad" className="pt-10">
                <div className="grid grid-cols-1 gap-8 xl:gap-10">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-2">Historias por año</h3>
                    <YearTotalsBar data={porAñoData} />
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-2">Historias por mes</h3>
                    <MonthTotalsBar labels={labelsMes} values={totalsSelMonths} />
                  </div>
                </div>
              </section>

              <section id="composicion" className="pt-10">
                <div className="grid grid-cols-1 gap-8 xl:gap-10">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <GenderPie data={generoData} />
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <TopProceduresBar data={opsList} />
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <SpecialtyShareBar data={specialtyData.map((x) => ({ name: x.name, value: x.value }))} />
                  </div>
                </div>
              </section>

              <section id="medicos" className="pt-10">
                <div className="grid grid-cols-1 gap-8 xl:gap-10">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <TopDoctorsPie data={topDoctors} />
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-base font-semibold text-slate-800 mb-2">Operaciones por doctor</h3>
                    <ByDoctorStacked doctors={opsByDoctor.doctors} operations={opsByDoctor.operations} matrix={opsByDoctor.matrix} />
                  </div>
                </div>
              </section>

              <section id="procedimientos" className="pt-10">
  <div className="grid grid-cols-1 gap-8 xl:gap-10">
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <ProceduresPareto
        data={paretoData.map((x) => ({ name: x.name, value: x.value }))}
        height={520}
      />
    </div>
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-2">
        Tendencia mensual: {topProcedure || "—"}
      </h3>
      <ProcedureTrend
        months={procedureTrend.months}
        values={procedureTrend.values}
        height={420}
      />
    </div>
  </div>
</section>

              <section id="finanzas" className="pt-12">
                <div
                  className="relative rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-500 pointer-events-none select-none opacity-70"
                  aria-disabled
                  role="region"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent to-white/60" />
                  <div className="relative">
                    <h3 className="text-base font-semibold text-slate-700 mb-2">Finanzas</h3>
                    <p className="text-sm">Próximamente</p>
                  </div>
                </div>
              </section>

              <section id="calidad" className="pt-8">
                <div
                  className="relative rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-500 pointer-events-none select-none opacity-70"
                  aria-disabled
                  role="region"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent to-white/60" />
                  <div className="relative">
                    <h3 className="text-base font-semibold text-slate-700 mb-2">Calidad de datos</h3>
                    <p className="text-sm">Próximamente</p>
                  </div>
                </div>
              </section>

              <section id="explorar" className="pt-8">
                <div
                  className="relative rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-500 pointer-events-none select-none opacity-70"
                  aria-disabled
                  role="region"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent to-white/60" />
                  <div className="relative">
                    <h3 className="text-base font-semibold text-slate-700 mb-2">Explorar</h3>
                    <p className="text-sm">Próximamente</p>
                  </div>
                </div>
              </section>

              <section id="reportes" className="pt-8">
                <div
                  className="relative rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-500 pointer-events-none select-none opacity-70"
                  aria-disabled
                  role="region"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent to-white/60" />
                  <div className="relative">
                    <h3 className="text-base font-semibold text-slate-700 mb-2">Reportes</h3>
                    <p className="text-sm">Próximamente</p>
                  </div>
                </div>
              </section>

              <section id="vistas" className="pt-8 pb-20">
                <div
                  className="relative rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-500 pointer-events-none select-none opacity-70"
                  aria-disabled
                  role="region"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent to-white/60" />
                  <div className="relative">
                    <h3 className="text-base font-semibold text-slate-700 mb-2">Vistas guardadas</h3>
                    <p className="text-sm">Próximamente</p>
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
