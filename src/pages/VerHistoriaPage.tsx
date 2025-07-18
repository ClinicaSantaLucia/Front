import { useEffect, useState } from "react"
import { databases, Query } from "../lib/appwrite"
import { FileText, Calendar, XCircle, Filter, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Header from "../components/layout/Header"

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
const collectionId = import.meta.env.VITE_APPWRITE_MEDICAL_COLLECTION_ID
const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT

export default function BuscadorHistoriasPage() {
  const [filtros, setFiltros] = useState({
    year: "",
    doctor_last: "",
    doctor_first: "",
    patient_last_name: "",
    patient_first_name: "",
    condition: "",
    document_number: "",
    document_type: "",
    room_number: "",
    operation: "",
    from_date: "",
    to_date: "",
    min_age: "",
    max_age: "",
    gender: "",
  })

  const [resultados, setResultados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detalle, setDetalle] = useState<any | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value })
  }

  const buscar = async () => {
    setLoading(true)
    try {
      const queries: any[] = []

      const addQuery = (key: string, val: string, parser = (v: string) => v) => {
        if (val?.trim()) queries.push(Query.equal(key, parser(val.trim())))
      }

      if (filtros.year.trim()) queries.push(Query.equal("year", parseInt(filtros.year)))
      addQuery("doctor_last", filtros.doctor_last)
      addQuery("doctor_first", filtros.doctor_first)
      addQuery("patient_last_name", filtros.patient_last_name)
      addQuery("patient_first_name", filtros.patient_first_name)
      addQuery("condition", filtros.condition)
      addQuery("document_number", filtros.document_number)
      addQuery("document_type", filtros.document_type)
      addQuery("room_number", filtros.room_number)
      addQuery("operation", filtros.operation)
      addQuery("gender", filtros.gender)

      if (filtros.from_date) queries.push(Query.greaterThanEqual("admission_date", filtros.from_date))
      if (filtros.to_date) queries.push(Query.lessThanEqual("admission_date", filtros.to_date))
      if (filtros.min_age) queries.push(Query.greaterThanEqual("age", parseInt(filtros.min_age)))
      if (filtros.max_age) queries.push(Query.lessThanEqual("age", parseInt(filtros.max_age)))

      if (queries.length === 0) queries.push(Query.limit(100))

      const res = await databases.listDocuments(databaseId, collectionId, queries)
      setResultados(res.documents)
    } catch (err) {
      console.error("Error al buscar:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    buscar()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 relative">
      <Header />

      <motion.h1
        className="text-4xl font-extrabold text-center text-blue-700 mt-10 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Buscador de Historias Clínicas
      </motion.h1>

      {/* FILTROS */}
      <motion.div
        className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto px-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <input name="year" type="number" placeholder="Año" value={filtros.year} onChange={handleChange} className="input" />
        <input name="doctor_first" placeholder="Nombre del médico" value={filtros.doctor_first} onChange={handleChange} className="input" />
        <input name="doctor_last" placeholder="Apellido del médico" value={filtros.doctor_last} onChange={handleChange} className="input" />
        <input name="patient_first_name" placeholder="Nombre del paciente" value={filtros.patient_first_name} onChange={handleChange} className="input" />
        <input name="patient_last_name" placeholder="Apellido del paciente" value={filtros.patient_last_name} onChange={handleChange} className="input" />
        <input name="condition" placeholder="Condición médica" value={filtros.condition} onChange={handleChange} className="input" />
        <input name="document_number" placeholder="N° Documento" value={filtros.document_number} onChange={handleChange} className="input" />
        <input name="room_number" placeholder="Habitación" value={filtros.room_number} onChange={handleChange} className="input" />
        <input name="operation" placeholder="Cirugía / Operación" value={filtros.operation} onChange={handleChange} className="input" />
        <input name="from_date" type="date" value={filtros.from_date} onChange={handleChange} className="input" />
        <input name="to_date" type="date" value={filtros.to_date} onChange={handleChange} className="input" />
        <input name="min_age" type="number" placeholder="Edad mínima" value={filtros.min_age} onChange={handleChange} className="input" />
        <input name="max_age" type="number" placeholder="Edad máxima" value={filtros.max_age} onChange={handleChange} className="input" />
        <select name="gender" value={filtros.gender} onChange={handleChange} className="input text-gray-500">
          <option value="">Sexo</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
        </select>
        <select name="document_type" value={filtros.document_type} onChange={handleChange} className="input text-gray-500">
          <option value="">Tipo Documento</option>
          <option>DNI</option>
          <option>PASAPORTE</option>
          <option>CARNET EXT</option>
        </select>

        <button
          onClick={buscar}
          className="bg-blue-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 px-4 py-2 hover:bg-blue-700 transition col-span-2 md:col-span-1"
        >
          <Filter className="w-4 h-4" /> Buscar
        </button>
      </motion.div>

      {/* RESULTADOS */}
      <div className="px-6 mt-12 pb-20 max-w-7xl mx-auto">
        {loading ? (
          <p className="text-center text-gray-500 text-lg">Cargando resultados...</p>
        ) : resultados.length > 0 ? (
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {resultados.map((historia) => (
              <motion.div
                key={historia.$id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setDetalle(historia)}
              >
                <div className="flex items-center gap-2 mb-3 text-blue-700">
                  <FileText className="w-5 h-5" />
                  <h2 className="text-lg font-bold">
                    {historia.patient_last_name}, {historia.patient_first_name}
                  </h2>
                </div>
                <p className="text-sm text-gray-700 font-medium">Médico: <span className="font-normal">{historia.doctor_last}, {historia.doctor_first}</span></p>
                <p className="text-sm text-gray-700 font-medium">Condición: <span className="font-normal">{historia.condition}</span></p>
                <p className="text-sm text-gray-700 font-medium">Edad: <span className="font-normal">{historia.age} años</span></p>
                <p className="text-sm text-gray-700 font-medium">Sexo: <span className="font-normal capitalize">{historia.gender}</span></p>
                <p className="text-sm text-gray-700 font-medium flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4" /> {historia.admission_date?.split("T")[0]}
                </p>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center text-center text-gray-500 mt-10"
          >
            <XCircle className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-lg font-medium">No se encontraron resultados</p>
          </motion.div>
        )}
      </div>

      {/* MODAL DETALLE COMPLETO */}
      <AnimatePresence>
        {detalle && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-xl relative"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <button onClick={() => setDetalle(null)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-blue-700 mb-4">
                {detalle.patient_last_name}, {detalle.patient_first_name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-800">
                <p><strong>Médico:</strong> {detalle.doctor_first} {detalle.doctor_last}</p>
                <p><strong>Condición:</strong> {detalle.condition}</p>
                <p><strong>Edad:</strong> {detalle.age}</p>
                <p><strong>Sexo:</strong> {detalle.gender}</p>
                <p><strong>Habitación:</strong> {detalle.room_number}</p>
                <p><strong>N° Cuenta:</strong> {detalle.account_number}</p>
                <p><strong>Código HC:</strong> {detalle.hc}</p>
                <p><strong>Tipo Doc:</strong> {detalle.document_type}</p>
                <p><strong>Doc N°:</strong> {detalle.document_number}</p>
                <p><strong>Ingreso:</strong> {detalle.admission_date?.split("T")[0]}</p>
                <p><strong>Alta:</strong> {detalle.discharge_date?.split("T")[0]}</p>
                <p><strong>Cirugía:</strong> {detalle.operation}</p>
                <p><strong>Correlativo:</strong> {detalle.correlative}</p>
                <p><strong>Monto:</strong> S/ {detalle.amount}</p>
                <p><strong>IGV:</strong> S/ {detalle.igv}</p>
                <p><strong>Cancelación:</strong> {detalle.cancellation_date}</p>
                <p className="col-span-2"><strong>Observaciones:</strong> {detalle.observations}</p>
              </div>
              {detalle.pdf_file_id && (
                <a
                  href={`${endpoint}/storage/buckets/${bucketId}/files/${detalle.pdf_file_id}/download?project=${projectId}`}
                  target="_blank"
                  className="block mt-6 text-blue-600 hover:underline font-semibold text-sm"
                >
                  Descargar PDF completo
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
