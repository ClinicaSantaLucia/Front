// src/pages/AdminPage.tsx
import { useUser } from "../hooks/useUser"
import { Navigate } from "react-router-dom"
import Header from "../components/layout/Header"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { databases, Query, storage } from "../lib/appwrite"
import { Button } from "../components/ui/button.tsx"
import { Trash2, FileDown, XCircle } from "lucide-react"
import { saveAs } from "file-saver"

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
const userCollectionId = import.meta.env.VITE_APPWRITE_USER_PROFILE_COLLECTION_ID
const historyCollectionId = import.meta.env.VITE_APPWRITE_MEDICAL_COLLECTION_ID
const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID

interface UserProfile {
  $id: string
  full_name: string
  role: string
  specialty?: string
  user_id: string
}

interface MedicalHistory {
  $id: string
  patient_first_name: string
  patient_last_name: string
  doctor_first: string
  doctor_last: string
  amount: number
  created_at: string
  pdf_file_id?: string
}

export default function AdminPage() {
  const { user, loading } = useUser()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [histories, setHistories] = useState<MedicalHistory[]>([])
  const [refreshingUsers, setRefreshingUsers] = useState(false)
  const [refreshingHistories, setRefreshingHistories] = useState(false)
  const [terminoBusqueda, setTerminoBusqueda] = useState("")

  const fetchUsers = async () => {
    setRefreshingUsers(true)
    const res = await databases.listDocuments(databaseId, userCollectionId)
    setUsers(res.documents as unknown as UserProfile[])
    setRefreshingUsers(false)
  }

  const buscarHistories = async (termino: string) => {
    if (!termino.trim()) {
      setHistories([])
      return
    }
    setRefreshingHistories(true)
    const res = await databases.listDocuments(databaseId, historyCollectionId, [
      Query.equal("document_number", termino),
      Query.limit(50),
    ])
    setHistories(res.documents as unknown as MedicalHistory[])
    setRefreshingHistories(false)
  }

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin"
    await databases.updateDocument(databaseId, userCollectionId, id, { role: newRole })
    fetchUsers()
  }

  const deleteUser = async (id: string) => {
    await databases.deleteDocument(databaseId, userCollectionId, id)
    fetchUsers()
  }

  const deleteHistory = async (id: string) => {
    await databases.deleteDocument(databaseId, historyCollectionId, id)
    setHistories((prev) => prev.filter((h) => h.$id !== id))
  }

  const downloadPDF = async (fileId?: string) => {
    if (!fileId) return
    const response = await storage.getFileDownload(bucketId, fileId)
    saveAs(await response, `historia_${fileId}.pdf`)
  }

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-600">
        Cargando...
      </div>
    )
  }
  if (!user || user.role !== "admin") return <Navigate to="/unauthorized" replace />

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-white motion-reduce:transition-none">
        <main className="px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Toolbar / Título */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-2">
              <div>
                <h1 className="text-2xl/tight font-semibold text-slate-800">Panel Administrativo</h1>
                <p className="text-slate-500 text-sm">Gestiona usuarios y documentos clínicos.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-9 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                >
                  Guía rápida
                </Button>
              </div>
            </div>

            {/* Gestión de Usuarios */}
            <motion.div
              className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Gestión de Usuarios</h2>
                <Button
                  onClick={fetchUsers}
                  disabled={refreshingUsers}
                  variant="outline"
                  className="focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                >
                  {refreshingUsers ? "Actualizando..." : "Actualizar"}
                </Button>
              </div>

              {users.length === 0 && !refreshingUsers ? (
                <div className="rounded-xl border border-slate-200/60 p-10 text-center">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <p className="text-slate-700 font-medium">No hay usuarios registrados</p>
                  <p className="text-slate-500 text-sm">Pulsa “Actualizar” para recargar la lista.</p>
                </div>
              ) : (
                <div className="overflow-auto rounded-xl border border-slate-200/60">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
                      <tr className="text-slate-600">
                        <th className="px-4 py-3 font-medium text-left">Nombre</th>
                        <th className="px-4 py-3 font-medium text-left">Rol</th>
                        <th className="px-4 py-3 font-medium text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {refreshingUsers ? (
                        <>
                          {[...Array(4)].map((_, i) => (
                            <tr key={`skeleton-user-${i}`}>
                              <td className="px-4 py-3">
                                <div className="h-4 w-40 bg-slate-200/60 rounded animate-pulse" />
                              </td>
                              <td className="px-4 py-3">
                                <div className="h-4 w-16 bg-slate-200/60 rounded animate-pulse" />
                              </td>
                              <td className="px-4 py-3">
                                <div className="h-8 w-24 bg-slate-200/60 rounded animate-pulse" />
                              </td>
                            </tr>
                          ))}
                        </>
                      ) : (
                        users.map((u) => (
                          <motion.tr
                            key={u.$id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className="hover:bg-slate-50/70"
                          >
                            <td className="px-4 py-3 text-gray-800 font-medium">{u.full_name}</td>
                            <td className="px-4 py-3">
                              <span
                                className={
                                  "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs " +
                                  (u.role === "admin"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-700")
                                }
                              >
                                {u.role === "admin" ? "Admin" : "Usuario"}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => toggleRole(u.$id, u.role)}
                                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                                  aria-label="Cambiar rol"
                                  title="Cambiar rol"
                                >
                                  Cambiar rol
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteUser(u.$id)}
                                  className="focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                                  aria-label="Eliminar usuario"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Gestión de Historias Clínicas */}
            <motion.div
              className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              <div className="mb-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Gestión de Historias Clínicas</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por DNI o nombre"
                      value={terminoBusqueda}
                      onChange={(e) => setTerminoBusqueda(e.target.value)}
                      className="pl-9 pr-8 py-2 h-10 w-72 rounded-lg border border-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    />
                    {/* Icono lupa */}
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
                    </svg>
                    {/* Botón limpiar */}
                    {terminoBusqueda && (
                      <button
                        onClick={() => setTerminoBusqueda("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label="Limpiar búsqueda"
                        title="Limpiar búsqueda"
                        type="button"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    onClick={() => buscarHistories(terminoBusqueda)}
                    disabled={refreshingHistories}
                    className="h-10 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                  >
                    {refreshingHistories ? "Buscando..." : "Buscar"}
                  </Button>
                </div>
              </div>

              {histories.length === 0 && !refreshingHistories ? (
                <div className="rounded-xl border border-slate-200/60 p-10 text-center">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <FileDown className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-slate-700 font-medium">No hay historias clínicas</p>
                  <p className="text-slate-500 text-sm">Realiza una búsqueda por DNI o nombre.</p>
                </div>
              ) : (
                <div className="overflow-auto rounded-xl border border-slate-200/60">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
                      <tr className="text-slate-600">
                        <th className="px-4 py-3 font-medium text-left">Paciente</th>
                        <th className="px-4 py-3 font-medium text-left">Doctor</th>
                        <th className="px-4 py-3 font-medium text-left">Monto</th>
                        <th className="px-4 py-3 font-medium text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {refreshingHistories ? (
                        <>
                          {[...Array(4)].map((_, i) => (
                            <tr key={`skeleton-h-${i}`}>
                              <td className="px-4 py-3">
                                <div className="h-4 w-56 bg-slate-200/60 rounded animate-pulse" />
                              </td>
                              <td className="px-4 py-3">
                                <div className="h-4 w-40 bg-slate-200/60 rounded animate-pulse" />
                              </td>
                              <td className="px-4 py-3">
                                <div className="h-4 w-20 bg-slate-200/60 rounded animate-pulse" />
                              </td>
                              <td className="px-4 py-3">
                                <div className="h-8 w-24 bg-slate-200/60 rounded animate-pulse" />
                              </td>
                            </tr>
                          ))}
                        </>
                      ) : (
                        histories.map((h) => (
                          <motion.tr
                            key={h.$id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className="hover:bg-slate-50/70"
                          >
                            <td className="px-4 py-3 text-gray-800">
                              {h.patient_first_name} {h.patient_last_name}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {h.doctor_first} {h.doctor_last}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-mono">
                                {typeof h.amount === "number" ? `S/ ${h.amount.toFixed(2)}` : "—"}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => downloadPDF(h.pdf_file_id)}
                                  className="h-8 w-8 p-0 bg-sky-100 hover:bg-sky-200 text-sky-800 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                                  aria-label="Descargar PDF"
                                  title="Descargar PDF"
                                >
                                  <FileDown className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteHistory(h.$id)}
                                  className="h-8 w-8 p-0 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                                  aria-label="Eliminar historia"
                                  title="Eliminar historia"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </>
  )
}
