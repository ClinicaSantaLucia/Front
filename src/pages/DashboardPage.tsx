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

const colores = ["#94a3b8", "#64748b", "#475569", "#334155", "#1e293b"]

type Gender = "masculino" | "femenino"
type MedicalDocument = Models.Document & {
  year?: number
  month?: number
  doctor_last?: string
  gender?: Gender
  patient_first_name: string
  patient_last_name: string
}

export default function DashboardPage() {
  const { user, loading } = useUser()

  const [stats, setStats] = useState<{
    totalHistorias: number
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
    años: new Set(),
    doctores: new Set(),
    generos: { masculino: 0, femenino: 0 },
    operaciones: {}, // 👈 AÑADIDO
    operacionesPorDoctor: {}, // 👈 AÑADIDO
    porAño: {},
    porMes: {},
    topDoctores: [],
    ultimo: null,
  })
  
  const [añoSeleccionado, setAñoSeleccionado] = useState<number | null>(null)


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
    
      const añosDisponibles = new Set<number>()
      const todosDoctores = new Set<string>()
allDocs.forEach((doc) => {
  if (doc.doctor_last) {
    todosDoctores.add(doc.doctor_last)
  }
})

      allDocs.forEach((doc) => {
        if (doc.admission_date) {
          const fecha = new Date(doc.admission_date)
          if (!isNaN(fecha.getTime())) {
            añosDisponibles.add(fecha.getFullYear())
          }
        }
      })
    
      const añoFinal = añoSeleccionado ?? Math.max(...Array.from(añosDisponibles))
    
      const docsFiltrados = allDocs.filter((doc) => {
        if (doc.admission_date) {
          const fecha = new Date(doc.admission_date)
          return fecha.getFullYear() === añoFinal
        }
        return false
      })
    
      const doctores = new Set<string>()
      const generos: Record<Gender, number> = { masculino: 0, femenino: 0 }
      const porAño: Record<number, number> = {}
      const porMes: Record<number, number> = {}
      const conteoDoctores: Record<string, number> = {}
      const operaciones: Record<string, number> = {}
      const operacionesPorDoctor: Record<string, Record<string, number>> = {}
    
      let ultimo: MedicalDocument | null = null
    // Total por año (no depende de filtro)
allDocs.forEach((doc) => {
  if (doc.admission_date) {
    const fecha = new Date(doc.admission_date)
    const año = fecha.getFullYear()
    porAño[año] = (porAño[año] || 0) + 1
  }
})

      docsFiltrados.forEach((doc) => {
        if (doc.admission_date) {
          const parsedDate = new Date(doc.admission_date)
          const mes = parsedDate.getMonth() + 1
          porMes[mes] = (porMes[mes] || 0) + 1
        }
    
        if (doc.operation) {
          operaciones[doc.operation] = (operaciones[doc.operation] || 0) + 1
        }
    
        if (doc.doctor_last && doc.operation) {
          if (!operacionesPorDoctor[doc.doctor_last]) {
            operacionesPorDoctor[doc.doctor_last] = {}
          }
          operacionesPorDoctor[doc.doctor_last][doc.operation] =
            (operacionesPorDoctor[doc.doctor_last][doc.operation] || 0) + 1
        }
    
        if (doc.doctor_last) {
          doctores.add(doc.doctor_last)
          conteoDoctores[doc.doctor_last] = (conteoDoctores[doc.doctor_last] || 0) + 1
        }
    
        if (doc.gender && ["masculino", "femenino"].includes(doc.gender)) {
          generos[doc.gender as Gender]++
        }
    
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
      if (!añoSeleccionado) {
        const añosArray = Array.from(añosDisponibles)
        if (añosArray.length > 0) {
          const añoMasReciente = Math.max(...añosArray)
          setAñoSeleccionado(añoMasReciente)
        }
      }
      
    } catch (err) {
      console.error("Error cargando estadísticas:", err)
    }
  }    

  useEffect(() => {
    fetchStats()
  }, [añoSeleccionado])
  

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Cargando Dashboard...</div>
  }

  const cards = [
    { icon: <FileText className="text-yellow-500 w-8 h-8" />, title: "Total historias clínicas", value: stats.totalHistorias },
    { icon: <Calendar className="text-emerald-500 w-8 h-8" />, title: "Años registrados", value: stats.años.size },
    { icon: <Users className="text-indigo-500 w-8 h-8" />, title: "Doctores", value: stats.doctores.size },
  ]

  const porAñoData = Object.entries(stats.porAño).map(([año, count]) => ({ year: año, count }))
  const generoData = Object.entries(stats.generos).map(([key, value]) => ({ name: key, value }))
  const porMesData = Object.entries(stats.porMes).map(([mes, count]) => ({
    label: new Date(2025, parseInt(mes) - 1).toLocaleDateString("es-PE", { month: "long" }),
    count
  }))
  const operacionesData = Object.entries(stats.operaciones).map(([name, value]) => ({ name, value }))

  const operaciones = Array.from(new Set(operacionesData.map((op) => op.name)))
  const doctores = Object.keys(stats.operacionesPorDoctor)
  
const heatmapData: [number, number, number][] = []

doctores.forEach((doctor, y) => {
  operaciones.forEach((op, x) => {
    const count = stats.operacionesPorDoctor[doctor]?.[op] || 0
    heatmapData.push([x, y, count])
  })
})

  

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {cards.map((card, index) => (
            <motion.div key={index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.2 }} whileHover={{ scale: 1.03 }} className="bg-white shadow-lg rounded-2xl p-6 flex items-center gap-4">
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

{/* Historial por año - ESTIRADO */}
<div className="bg-white rounded-xl shadow p-4 md:col-span-2">
  <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
    <BarChart2 /> Historias por año
  </h3>
  <ReactECharts
    style={{ height: 300 }}
    option={{
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: porAñoData.map((item) => item.year),
      },
      yAxis: {
        type: "value",
      },
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
    Mostrando datos del año: <span className="font-semibold">{añoSeleccionado}</span>
  </p>
  <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
    <BarChart2 /> Historias por mes
  </h3>
  <ReactECharts
    style={{ height: 300 }}
    option={{
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      xAxis: {
        type: "category",
        data: porMesData.map((item) => item.label),
        axisLabel: {
          interval: 0,
          rotate: 25,
          color: "#334155",
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: "#334155",
        },
      },
      series: [
        {
          name: "Historias",
          type: "bar",
          data: porMesData.map((item) => item.count),
          itemStyle: {
            color: "#475569",
            borderRadius: [6, 6, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: "#1e293b",
            },
          },
        },
      ],
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        containLabel: true,
      },
    }}
  />
</div>

{/* Género y Top 5 doctores */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-8 col-span-1 md:col-span-2">
  {/* Distribución por género */}
  <div className="bg-white rounded-xl shadow p-4">
    <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
      <PieChart /> Distribución por género
    </h3>
    <ReactECharts
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
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      }}
    />
  </div>

  {/* Top 5 doctores */}
  <div className="bg-white rounded-xl shadow p-4">
    <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
      <PieChart /> Top 5 doctores
    </h3>
    <ReactECharts
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
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      }}
    />
  </div>
</div>

</div> 


{/* Pacientes por operación y operaciones por doctor */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-8 col-span-1 md:col-span-2">
  {/* Pacientes por tipo de operación */}
  <div className="bg-white rounded-xl shadow p-4">
    <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
      <PieChart /> Pacientes por tipo de operación
    </h3>
    <ReactECharts
      style={{ height: 300 }}
      option={{
        tooltip: { trigger: "item" },
        legend: { bottom: 0 },
        series: [
          {
            name: "Operaciones",
            type: "pie",
            radius: "60%",
            center: ["50%", "45%"],
            data: operacionesData.map((item, i) => ({
              value: item.value,
              name: item.name,
              itemStyle: { color: colores[i % colores.length] },
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
      }}
    />
  </div>

  {/* Operaciones por doctor */}
  <div className="bg-white rounded-xl shadow p-4">
    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
      <BarChart2 /> Operaciones por doctor (barras apiladas)
    </h3>
    <ReactECharts
      style={{ height: 400 }}
      option={{
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        legend: { bottom: 0 },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "10%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: doctores,
          axisLabel: {
            rotate: 25,
          },
        },
        yAxis: {
          type: "value",
        },
        series: operaciones.map((op, i) => ({
          name: op,
          type: "bar",
          stack: "total",
          emphasis: { focus: "series" },
          itemStyle: { color: colores[i % colores.length] },
          data: doctores.map((doctor) => stats.operacionesPorDoctor[doctor]?.[op] || 0),
        })),
      }}
      />
      </div>
      </div> {/* ← cierre del grid “Pacientes / Operaciones por doctor” */}
    </div> {/* ← cierre del .min-h-screen */}
  </>
  );
}
  