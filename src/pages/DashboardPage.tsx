import { useEffect, useState } from "react"
import { useUser } from "../hooks/useUser"
import { databases, Query } from "../lib/appwrite"
import { FileText, Users, Calendar, BarChart2, PieChart } from "lucide-react"
import { motion } from "framer-motion"
import Header from "../components/layout/Header"
import type { Models } from "appwrite"
import ReactECharts from "echarts-for-react"

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
const medicalId = import.meta.env.VITE_APPWRITE_MEDICAL_COLLECTION_ID

const colores = ["#94a3b8", "#64748b", "#475569", "#334155", "#1e293b", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#22c55e"]

type Gender = "masculino" | "femenino"

type MedicalDocument = Models.Document & {
  admission_date?: string
  doctor_last?: string
  doctor_first?: string
  gender?: string
  operation?: string
  descripcion?: string
  observations?: string
  patient_first_name: string
  patient_last_name: string
}

function normStr(s?: string | null) {
  return (s ?? "").toString().trim()
}

function normGender(g?: string | null): Gender | null {
  const v = normStr(g).toLowerCase()
  if (v === "masculino") return "masculino"
  if (v === "femenino") return "femenino"
  return null
}

function titleCase(v: string) {
  return v
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/(^|\s)\S/g, (t) => t.toUpperCase())
}

function normDoctorLast(d?: string | null) {
  return normStr(d).replace(/\s+/g, " ")
}

export default function DashboardPage() {
  const { user, loading } = useUser()

  const [stats, setStats] = useState<{
    totalHistorias: number
    totalHistoriasGlobal: number
    años: Set<number>
    doctores: Set<string>
    generos: Record<Gender, number>
    operaciones: Record<string, number>
    operacionesPorDoctor: Record<string, Record<string, number>>
    porAño: Record<number, number>
    porMes: Record<number, number>
    topDoctores: { name: string; value: number }[]
    ultimo: MedicalDocument | null
  }>({
    totalHistorias: 0,
    totalHistoriasGlobal: 0,
    años: new Set(),
    doctores: new Set(),
    generos: { masculino: 0, femenino: 0 },
    operaciones: {},
    operacionesPorDoctor: {},
    porAño: {},
    porMes: {},
    topDoctores: [],
    ultimo: null,
  })

  const [añoSeleccionado, setAñoSeleccionado] = useState<number | null>(null)
  const [topN, setTopN] = useState<number>(25) // 10, 20, 25, 50 o 0 = todos

  const fetchStats = async () => {
    try {
      const allDocs: MedicalDocument[] = []
      let page = 0
      const limit = 100
      let more = true

      while (more) {
        const res = await databases.listDocuments<MedicalDocument>(
          databaseId,
          medicalId,
          [Query.limit(limit), Query.offset(page * limit)]
        )
        allDocs.push(...res.documents)
        more = res.documents.length === limit
        page++
      }

      // Años disponibles
      const añosDisponibles = new Set<number>()
      allDocs.forEach((doc) => {
        const d = normStr(doc.admission_date)
        if (d) {
          const dt = new Date(d)
          if (!isNaN(dt.getTime())) añosDisponibles.add(dt.getFullYear())
        }
      })

      if (!añoSeleccionado) {
        if (añosDisponibles.size > 0) {
          const maxYear = Math.max(...Array.from(añosDisponibles))
          setAñoSeleccionado(maxYear)
        }
      }

      const añoFinal: number | undefined =
        añoSeleccionado ?? (añosDisponibles.size ? Math.max(...Array.from(añosDisponibles)) : undefined)

      const docsFiltrados =
        añoFinal !== undefined
          ? allDocs.filter((doc) => {
              const d = normStr(doc.admission_date)
              if (!d) return false
              const dt = new Date(d)
              return !isNaN(dt.getTime()) && dt.getFullYear() === añoFinal
            })
          : allDocs

      const todosDoctores = new Set<string>()
      allDocs.forEach((doc) => {
        const dl = normDoctorLast(doc.doctor_last)
        if (dl) todosDoctores.add(dl)
      })

      const doctores = new Set<string>()
      const generos: Record<Gender, number> = { masculino: 0, femenino: 0 }
      const porAño: Record<number, number> = {}
      const porMes: Record<number, number> = {}
      const conteoDoctores: Record<string, number> = {}
      const operaciones: Record<string, number> = {}
      const operacionesPorDoctor: Record<string, Record<string, number>> = {}
      let ultimo: MedicalDocument | null = null

      // Totales por año (global)
      allDocs.forEach((doc) => {
        const d = normStr(doc.admission_date)
        if (d) {
          const dt = new Date(d)
          if (!isNaN(dt.getTime())) {
            const y = dt.getFullYear()
            porAño[y] = (porAño[y] || 0) + 1
          }
        }
      })

      // Agregados por año filtrado
      docsFiltrados.forEach((doc) => {
        const d = normStr(doc.admission_date)
        if (d) {
          const dt = new Date(d)
          if (!isNaN(dt.getTime())) {
            const mes = dt.getMonth() + 1
            porMes[mes] = (porMes[mes] || 0) + 1
          }
        }

        // SOLO 'descripcion' cuenta como operación
        const op = titleCase(normStr(doc.descripcion))
        const dl = normDoctorLast(doc.doctor_last)

        if (op) operaciones[op] = (operaciones[op] || 0) + 1

        if (dl && op) {
          if (!operacionesPorDoctor[dl]) operacionesPorDoctor[dl] = {}
          operacionesPorDoctor[dl][op] = (operacionesPorDoctor[dl][op] || 0) + 1
        }

        if (dl) {
          doctores.add(dl)
          conteoDoctores[dl] = (conteoDoctores[dl] || 0) + 1
        }

        const g = normGender(doc.gender)
        if (g) generos[g]++

        if (!ultimo || new Date(doc.$createdAt) > new Date(ultimo.$createdAt)) {
          ultimo = doc
        }
      })

      const topDoctores = Object.entries(conteoDoctores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }))

      setStats({
        totalHistorias: docsFiltrados.length,
        totalHistoriasGlobal: allDocs.length, // NUEVO: total de todos los años
        años: añosDisponibles,
        doctores: todosDoctores,
        generos,
        porAño,
        porMes,
        operaciones,
        operacionesPorDoctor,
        topDoctores,
        ultimo,
      })
    } catch (err) {
      console.error("Error cargando estadísticas:", err)
    }
  }

  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [añoSeleccionado])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Cargando Dashboard...</div>
  }

  // ---- Preparación de datos para gráficos ----
  const porAñoData = Object.entries(stats.porAño)
    .map(([año, count]) => ({ year: Number(año), count }))
    .sort((a, b) => a.year - b.year)

  const meses = Array.from({ length: 12 }, (_, i) => i + 1)
  const porMesData = meses.map((m) => ({
    label: new Date(2025, m - 1).toLocaleDateString("es-PE", { month: "long" }),
    count: stats.porMes[m] ?? 0,
  }))

  const generoData = (["masculino", "femenino"] as Gender[]).map((g) => ({
    name: g,
    value: stats.generos[g] ?? 0,
  }))

  const operacionesOrdenadas = Object.entries(stats.operaciones)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)

  const operacionesData = operacionesOrdenadas.map((name) => ({
    name,
    value: stats.operaciones[name] ?? 0,
  }))

  // Orden doctores por total operaciones (desc)
  const doctoresOrdenadosTotal = Object.entries(stats.operacionesPorDoctor)
    .map(([doctor, mapa]) => [doctor, Object.values(mapa).reduce((s, v) => s + v, 0)] as [string, number])
    .sort((a, b) => b[1] - a[1])
    .map(([doctor]) => doctor)

  // Aplica Top-N (0 = todos)
  const doctoresOrdenados =
    topN && topN > 0 ? doctoresOrdenadosTotal.slice(0, topN) : doctoresOrdenadosTotal

  const seriesOperacionesPorDoctor = operacionesOrdenadas.map((op, i) => ({
    name: op,
    type: "bar" as const,
    stack: "total",
    emphasis: { focus: "series" as const },
    itemStyle: { color: colores[i % colores.length] },
    data: doctoresOrdenados.map((doctor) => stats.operacionesPorDoctor[doctor]?.[op] || 0),
  }))

  // ---- Config adaptativa para "Operaciones por doctor" ----
  const muchosDoctores = doctoresOrdenados.length > 10
  const rowHeight = 26
  const chartHeight = muchosDoctores ? Math.min(120 + doctoresOrdenados.length * rowHeight, 1400) : 420

  const xAxisCfg = muchosDoctores
    ? { type: "value" as const }
    : {
        type: "category" as const,
        data: doctoresOrdenados,
        axisLabel: {
          interval: 0,
          rotate: 25,
          hideOverlap: true,
          margin: 12,
        },
      }

  const yAxisCfg = muchosDoctores
    ? {
        type: "category" as const,
        data: doctoresOrdenados,
        axisLabel: {
          interval: 0,
          width: 140,
          overflow: "truncate",
          ellipsis: "…",
          fontSize: 11,
          margin: 8,
        },
      }
    : { type: "value" as const }

  const dataZoomCfg = muchosDoctores
    ? [
        { type: "inside", yAxisIndex: 0, start: 0, end: 100 },
        { type: "slider", yAxisIndex: 0, start: 0, end: 100, right: 8 },
      ]
    : [
        { type: "inside", start: 0, end: 100 },
        { type: "slider", start: 0, end: 100, bottom: 38 },
      ]

  const gridCfg = muchosDoctores
    ? { left: 160, right: 24, bottom: 24, top: 20, containLabel: true }
    : { left: "3%", right: "4%", bottom: "14%", top: 20, containLabel: true }

  // ---- Config para "Pacientes por tipo de operación" (BARRA HORIZONTAL) ----
  const muchasOps = operacionesData.length > 12
  const opsRowHeight = 26
  const opsChartHeight = muchasOps ? Math.min(120 + operacionesData.length * opsRowHeight, 1400) : 420
  const opsDataZoom = muchasOps
    ? [
        { type: "inside", yAxisIndex: 0, start: 0, end: 100 },
        { type: "slider", yAxisIndex: 0, start: 0, end: 100, right: 8 },
      ]
    : []

  // ---- Keys para remount limpio ----
  const keyAnual = `anual-${porAñoData.map(x => x.year).join("|")}`
  const keyMensual = `mensual-${añoSeleccionado ?? "all"}-${porMesData.map(x => x.count).join(",")}`
  const keyGenero = `genero-${generoData.map(x => `${x.name}:${x.value}`).join("|")}`
  const keyOpsBar = `opsbar-${añoSeleccionado ?? "all"}-${operacionesOrdenadas.join("|")}`
  const keyStackOps = `stack-${añoSeleccionado ?? "all"}-${topN}-${operacionesOrdenadas.join("|")}-${doctoresOrdenados.join("|")}`
  const keyTopDocs = `topdocs-${stats.topDoctores.map(d => d.name).join("|")}`

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white px-6 py-12">
        {/* Bienvenida */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
          <div className="flex items-center gap-2 bg-white/90 border border-blue-100 rounded-xl px-4 py-2 shadow-md w-fit">
            <div className="text-sm text-gray-600">
              Bienvenido, <span className="font-semibold text-gray-800">{user?.full_name}</span>
            </div>
            <span className="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md font-medium capitalize">
              {user?.role}
            </span>
          </div>
        </motion.div>

        {/* Selector de año */}
        <div className="mb-6">
          <select
            id="añoSelector"
            value={añoSeleccionado ?? ""}
            onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 text-sm shadow-sm w-full sm:w-64"
          >
            <option value="">-- Selecciona un año --</option>
            {Array.from(stats.años)
              .sort((a, b) => b - a)
              .map((año) => (
                <option key={año} value={año}>
                  {año}
                </option>
              ))}
          </select>
        </div>

        {/* Tarjetas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { icon: <FileText className="text-yellow-500 w-8 h-8" />, title: "Total historias clínicas", value: stats.totalHistorias },
            { icon: <Calendar className="text-emerald-500 w-8 h-8" />, title: "Años registrados", value: stats.años.size },
            { icon: <Users className="text-indigo-500 w-8 h-8" />, title: "Doctores", value: stats.doctores.size },
            { icon: <FileText className="text-sky-500 w-8 h-8" />, title: "Total histórico de historias", value: stats.totalHistoriasGlobal }, // NUEVA TARJETA
          ].map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ scale: 1.03 }}
              className="bg-white shadow-lg rounded-2xl p-6 flex items-center gap-4"
            >
              {card.icon}
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-semibold text-gray-800">{card.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Historias por año */}
          <div className="bg-white rounded-xl shadow p-4 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <BarChart2 /> Historias por año
            </h3>
            <ReactECharts
              key={keyAnual}
              notMerge={true}
              style={{ height: 300 }}
              option={{
                tooltip: { trigger: "axis" },
                xAxis: { type: "category", data: porAñoData.map((item) => item.year) },
                yAxis: { type: "value" },
                series: [
                  {
                    name: "Historias",
                    type: "bar",
                    data: porAñoData.map((item) => item.count),
                    itemStyle: { color: "#475569" },
                  },
                ],
              }}
            />
          </div>

          {/* Historias por mes */}
          <div className="bg-white rounded-xl shadow p-4 col-span-1 md:col-span-2">
            <p className="text-sm text-gray-500 mb-1">
              Mostrando datos del año: <span className="font-semibold">{añoSeleccionado ?? "—"}</span>
            </p>
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <BarChart2 /> Historias por mes
            </h3>
            <ReactECharts
              key={keyMensual}
              notMerge={true}
              style={{ height: 300 }}
              option={{
                tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
                xAxis: {
                  type: "category",
                  data: porMesData.map((item) => item.label),
                  axisLabel: { interval: 0, rotate: 25, color: "#334155" },
                },
                yAxis: { type: "value", axisLabel: { color: "#334155" } },
                series: [
                  {
                    name: "Historias",
                    type: "bar",
                    data: porMesData.map((item) => item.count),
                    itemStyle: { color: "#475569", borderRadius: [6, 6, 0, 0] },
                    emphasis: { itemStyle: { color: "#1e293b" } },
                  },
                ],
                grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
              }}
            />
          </div>

          {/* Género y Top 5 doctores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 col-span-1 md:col-span-2">
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <PieChart /> Distribución por género
              </h3>
              <ReactECharts
                key={keyGenero}
                notMerge={true}
                style={{ height: 300 }}
                option={{
                  tooltip: { trigger: "item" },
                  legend: { bottom: 0 },
                  series: [
                    {
                      name: "Género",
                      type: "pie",
                      radius: "60%",
                      center: ["50%", "45%"],
                      data: generoData.map((item, i) => ({
                        value: item.value,
                        name: item.name,
                        itemStyle: { color: colores[i % colores.length] },
                      })),
                      emphasis: {
                        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.5)" },
                      },
                    },
                  ],
                }}
              />
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <PieChart /> Top 5 doctores
              </h3>
              <ReactECharts
                key={keyTopDocs}
                notMerge={true}
                style={{ height: 300 }}
                option={{
                  tooltip: { trigger: "item" },
                  legend: { bottom: 0 },
                  series: [
                    {
                      name: "Top doctores",
                      type: "pie",
                      radius: "60%",
                      center: ["50%", "45%"],
                      data: stats.topDoctores.map((item, i) => ({
                        value: item.value,
                        name: item.name,
                        itemStyle: { color: colores[i % colores.length] },
                      })),
                      emphasis: {
                        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.5)" },
                      },
                    },
                  ],
                }}
              />
            </div>
          </div>
        </div>

        {/* Pacientes por operación y Operaciones por doctor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 col-span-1 md:col-span-2">
          {/* Pacientes por tipo de operación — BARRA HORIZONTAL */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <BarChart2 /> Pacientes por tipo de operación
            </h3>
            <ReactECharts
              key={keyOpsBar}
              notMerge={true}
              style={{ height: opsChartHeight }}
              option={{
                tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
                grid: { left: 220, right: 24, top: 20, bottom: 24, containLabel: true },
                xAxis: { type: "value" },
                yAxis: {
                  type: "category",
                  data: operacionesOrdenadas,
                  axisLabel: {
                    interval: 0,
                    width: 200,
                    overflow: "truncate",
                    ellipsis: "…",
                    fontSize: 11,
                    margin: 8,
                  },
                },
                dataZoom: opsDataZoom,
                series: [
                  {
                    name: "Pacientes",
                    type: "bar",
                    data: operacionesData.map((o) => o.value),
                    label: { show: true, position: "right" },
                    itemStyle: {
                      color: (params: any) => colores[params.dataIndex % colores.length],
                    },
                    barCategoryGap: "30%",
                  },
                ],
              }}
            />
          </div>

          {/* Operaciones por doctor (adaptativo + Top-N + altura dinámica) */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <BarChart2 /> Operaciones por doctor
              </h3>
              <div className="flex items-center gap-2">
                <label htmlFor="topn" className="text-sm text-gray-600">Top&nbsp;N:</label>
                <select
                  id="topn"
                  value={topN}
                  onChange={(e) => setTopN(parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm shadow-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={0}>Todos</option>
                </select>
              </div>
            </div>

            <ReactECharts
              key={keyStackOps}
              notMerge={true}
              style={{ height: chartHeight }}
              option={{
                tooltip: {
                  trigger: "axis",
                  axisPointer: { type: "shadow" },
                  formatter: (params: any[]) => {
                    const items = params.filter((p) => Number(p.value) > 0)
                    if (!items.length) return ""
                    const name = String(items[0].name || "")
                    return [name, ...items.map((p) => `${p.marker} ${p.seriesName}: ${p.value}`)].join("<br/>")
                  },
                },
                legend: { bottom: 0, type: "scroll", data: operacionesOrdenadas },
                grid: gridCfg,
                xAxis: xAxisCfg,
                yAxis: yAxisCfg,
                dataZoom: dataZoomCfg,
                series: seriesOperacionesPorDoctor,
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
