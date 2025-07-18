// src/pages/AdminPage.tsx
import { useUser } from "../hooks/useUser"
import { Navigate } from "react-router-dom"
import Header from "../components/layout/Header"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { databases, Query, ID, storage } from "../lib/appwrite"
import { Button } from "../components/ui/button.tsx"
import { Trash2, ArrowUpDown, PlusCircle, FileDown } from "lucide-react"
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
  condition: string
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

  const fetchUsers = async () => {
    setRefreshingUsers(true)
    const res = await databases.listDocuments(databaseId, userCollectionId)
    setUsers(res.documents as unknown as UserProfile[])
    setRefreshingUsers(false)
  }
  const fetchHistories = async () => {
    setRefreshingHistories(true)
    const res = await databases.listDocuments(databaseId, historyCollectionId, [Query.limit(20)])
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
    fetchHistories()
  }

  const downloadPDF = async (fileId?: string) => {
    if (!fileId) return
    const response = await storage.getFileDownload(bucketId, fileId)
    saveAs(await response, `historia_${fileId}.pdf`) 
}

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers()
      fetchHistories()
    }
  }, [user])

  if (loading) return <div className="min-h-screen flex justify-center items-center text-gray-600">Cargando...</div>
  if (!user || user.role !== "admin") return <Navigate to="/unauthorized" replace />

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white px-6 py-12">
        <motion.h1
          className="text-3xl font-bold text-gray-800 mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Panel Administrativo
        </motion.h1>

        {/* Gestión de Usuarios */}
        <motion.div
          className="bg-white rounded-xl shadow p-6 mb-10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Gestión de Usuarios</h2>
            <Button onClick={fetchUsers} disabled={refreshingUsers} variant="outline">
              <ArrowUpDown className="w-4 h-4 mr-1" />
              {refreshingUsers ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>

          {users.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay usuarios registrados.</p>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-4 py-2">Nombre</th>
                    <th className="px-4 py-2">Rol</th>
                    <th className="px-4 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.$id} className="border-b hover:bg-blue-50">
                      <td className="px-4 py-2 text-gray-800 font-medium">{u.full_name}</td>
                      <td className="px-4 py-2 text-gray-600">{u.role}</td>
                      <td className="px-4 py-2 space-x-2">
                        <Button
                          size="sm"
                          onClick={() => toggleRole(u.$id, u.role)}
                          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                        >
                          Cambiar rol
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteUser(u.$id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Gestión de Historias Clínicas */}
        <motion.div
          className="bg-white rounded-xl shadow p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Gestión de Historias Clínicas</h2>
            <Button onClick={fetchHistories} disabled={refreshingHistories} variant="outline">
              <ArrowUpDown className="w-4 h-4 mr-1" />
              {refreshingHistories ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>

          {histories.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay historias clínicas registradas.</p>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-4 py-2">Paciente</th>
                    <th className="px-4 py-2">Doctor</th>
                    <th className="px-4 py-2">Condición</th>
                    <th className="px-4 py-2">Monto</th>
                    <th className="px-4 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {histories.map((h) => (
                    <tr key={h.$id} className="border-b hover:bg-blue-50">
                      <td className="px-4 py-2 text-gray-800">{h.patient_first_name} {h.patient_last_name}</td>
                      <td className="px-4 py-2 text-gray-700">{h.doctor_first} {h.doctor_last}</td>
                      <td className="px-4 py-2 text-gray-600">{h.condition}</td>
                      <td className="px-4 py-2 text-gray-600">S/ {h.amount.toFixed(2)}</td>
                      <td className="px-4 py-2 space-x-2">
                        <Button
                          size="sm"
                          onClick={() => downloadPDF(h.pdf_file_id)}
                          className="bg-sky-100 hover:bg-sky-200 text-sky-800"
                        >
                          <FileDown className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteHistory(h.$id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </>
  )
}
