import { useEffect, useState } from "react"
import { useUser } from "../hooks/useUser"
import { databases, Query } from "../lib/appwrite"
import { FileText, Users, Calendar, BarChart2, PieChart, UserCheck } from "lucide-react"
import { motion } from "framer-motion"
import Header from "../components/layout/Header"
import type { Models } from "appwrite"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Pie,
  PieChart as RePieChart,
  Cell,
  Legend
} from "recharts"

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
    porAño: Record<number, number>
    porMes: Record<number, number>
    topDoctores: { name: string; value: number }[]
    ultimo: MedicalDocument | null
  }>({
    totalHistorias: 0,
    años: new Set(),
    doctores: new Set(),
    generos: { masculino: 0, femenino: 0 },
    porAño: {},
    porMes: {},
    topDoctores: [],
    ultimo: null,
  })

  const fetchStats = async () => {
    try {
      const res = await databases.listDocuments<MedicalDocument>(databaseId, medicalId, [Query.limit(100)])
      const años = new Set<number>()
      const doctores = new Set<string>()
      const generos: Record<Gender, number> = { masculino: 0, femenino: 0 }
      const porAño: Record<number, number> = {}
      const porMes: Record<number, number> = {}
      const conteoDoctores: Record<string, number> = {}
      let ultimo: MedicalDocument | null = null

      res.documents.forEach((doc) => {
        if (doc.year !== undefined) {
          años.add(doc.year)
          porAño[doc.year] = (porAño[doc.year] || 0) + 1
        }

        if (doc.month !== undefined) {
          let mesIndex: number | null = null
        
          if (typeof doc.month === "number") {
            mesIndex = doc.month
          } else if (typeof doc.month === "string") {
            const meses = [
              "enero", "febrero", "marzo", "abril", "mayo", "junio",
              "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
            ]
            const lowerMonth = (doc.month as string).toLowerCase()
            const idx = meses.findIndex(m => m === lowerMonth)
            if (idx !== -1) mesIndex = idx + 1
          }
        
          if (mesIndex !== null) {
            porMes[mesIndex] = (porMes[mesIndex] || 0) + 1
          }
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
        totalHistorias: res.total,
        años,
        doctores,
        generos,
        porAño,
        porMes,
        topDoctores,
        ultimo,
      })
    } catch (err) {
      console.error("Error cargando estadísticas:", err)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Cargando Dashboard...</div>
  }

  const cards = [
    { icon: <FileText className="text-yellow-500 w-8 h-8" />, title: "Total historias clínicas", value: stats.totalHistorias },
    { icon: <Calendar className="text-emerald-500 w-8 h-8" />, title: "Años registrados", value: stats.años.size },
    { icon: <Users className="text-indigo-500 w-8 h-8" />, title: "Doctores diferentes", value: stats.doctores.size },
  ]

  const porAñoData = Object.entries(stats.porAño).map(([año, count]) => ({ year: año, count }))
  const generoData = Object.entries(stats.generos).map(([key, value]) => ({ name: key, value }))
  const porMesData = Object.entries(stats.porMes).map(([mes, count]) => ({
    label: new Date(2025, parseInt(mes) - 1).toLocaleDateString("es-PE", { month: "long" }),
    count
  }))

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
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2"><BarChart2 /> Historias por año</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={porAñoData}>
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#475569" />
                </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2"><PieChart /> Porcentaje por género</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie data={generoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {generoData.map((_, i) => <Cell key={i} fill={colores[i % colores.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow p-4 col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2"><BarChart2 /> Historias por mes</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={porMesData}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#475569" />
                </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow p-4 col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2"><UserCheck /> Top 5 doctores</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie data={stats.topDoctores} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {stats.topDoctores.map((_, i) => <Cell key={i} fill={colores[i % colores.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>


     

      </div>
    </>
  )
}



       
