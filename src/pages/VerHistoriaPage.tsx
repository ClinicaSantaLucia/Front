import { useState } from "react"
import { databases, Query } from "../lib/appwrite"
import { FileText, Calendar, XCircle, Filter, X, Printer, FileDown, Save, PencilLine } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Header from "../components/layout/Header"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import { toast } from "sonner"
import { Button } from "../components/ui/button" // solo visual, no cambia lógica

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
const collectionId = import.meta.env.VITE_APPWRITE_MEDICAL_COLLECTION_ID
const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT

function limpiarDocumento(doc: any) {
  const camposValidos = [
    "year","month","gender","record_number","admission_date","discharge_date","doctor_first","doctor_last","hc",
    "account_number","operation","correlative","observations","condition","created_by","pdf_file_id","ocr_image_id",
    "ocr_text","created_at","document_type","patient_first_name","patient_last_name","amount","document_number",
    "motivo","cie10","descripcion","especialidad"
  ]
  const limpio: any = {}
  for (const campo of camposValidos) if (campo in doc) limpio[campo] = doc[campo]
  return limpio
}

export default function BuscadorHistoriasPage() {
  const [filtros, setFiltros] = useState({
    year: "", doctor_last: "", doctor_first: "", patient_last_name: "",
    patient_first_name: "", document_number: "", document_type: "",
    operation: "", from_date: "", to_date: "", gender: "", motivo: "",
    cie10: "", descripcion: "", account_number: "", especialidad: "",
  })
  const [resultados, setResultados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detalle, setDetalle] = useState<any | null>(null)
  const [detalleEditable, setDetalleEditable] = useState<any | null>(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value })
  }

  const buscar = async () => {
    setLoading(true)
    try {
      const queries: any[] = []
      const addQuery = (key: string, val: string) => { if (val?.trim()) queries.push(Query.equal(key, val.trim())) }

      if (filtros.year.trim()) {
        const year = parseInt(filtros.year)
        const start = `${year}-01-01`
        const end = `${year}-12-31`
        queries.push(Query.greaterThanEqual("admission_date", start))
        queries.push(Query.lessThanEqual("admission_date", end))
      }

      addQuery("doctor_last", filtros.doctor_last)
      addQuery("doctor_first", filtros.doctor_first)
      addQuery("patient_last_name", filtros.patient_last_name)
      addQuery("patient_first_name", filtros.patient_first_name)
      addQuery("document_number", filtros.document_number)
      addQuery("document_type", filtros.document_type)
      addQuery("operation", filtros.operation)
      addQuery("gender", filtros.gender)
      addQuery("motivo", filtros.motivo)
      addQuery("cie10", filtros.cie10)
      addQuery("descripcion", filtros.descripcion)
      addQuery("account_number", filtros.account_number)
      addQuery("especialidad", filtros.especialidad)

      if (filtros.from_date) queries.push(Query.greaterThanEqual("admission_date", filtros.from_date))
      if (filtros.to_date) queries.push(Query.lessThanEqual("admission_date", filtros.to_date))

      queries.push(Query.limit(limit))
      queries.push(Query.offset(offset))

      const res = await databases.listDocuments(databaseId, collectionId, queries)
      setResultados(res.documents)
    } catch (err) {
      console.error("Error al buscar:", err)
    } finally {
      setLoading(false)
    }
  }

  const exportarExcel = () => {
    const data = resultados.map((r) => ({
      "Nombre Paciente": `${r.patient_first_name} ${r.patient_last_name}`,
      "Nombre Médico": `${r.doctor_first} ${r.doctor_last}`,
      "Especialidad": r.especialidad || "",
      "Documento Tipo": r.document_type,
      "Documento N°": r.document_number,
      "HC": r.hc,
      "N° Cuenta": r.account_number,
      "Cirugía": r.operation,
      "Correlativo": r.correlative,
      "Sexo": r.gender,
      "Motivo": r.motivo || "",
      "CIE10": r.cie10 || "",
      "Descripción": r.descripcion || "",
      "Observaciones": r.observations || "",
      "Monto": r.amount,
      "Fecha Ingreso": r.admission_date?.split("T")[0],
      "Fecha Alta": r.discharge_date?.split("T")[0],
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Historias")
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    saveAs(new Blob([buffer]), "historias_clinicas.xlsx")
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-white text-gray-800">
      <Header />

      {/* Título + acciones */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <motion.h1
              className="text-3xl font-semibold text-slate-800"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Buscador de Historias Clínicas
            </motion.h1>
            <p className="text-slate-500 text-sm">Filtra, exporta e imprime tus registros clínicos.</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportarExcel}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
              title="Exportar a Excel"
            >
              <FileDown className="w-4 h-4 mr-2" /> Excel
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="h-9"
              title="Imprimir"
            >
              <Printer className="w-4 h-4 mr-2" /> Imprimir
            </Button>
          </div>
        </div>
      </section>

      {/* FILTROS - card premium */}
      <motion.section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <input name="year" type="number" placeholder="Año" value={filtros.year}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
            <input name="doctor_first" placeholder="Nombre del médico" value={filtros.doctor_first}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 focus:ring-2 focus:ring-sky-500" />
            <input name="doctor_last" placeholder="Apellido del médico" value={filtros.doctor_last}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 focus:ring-2 focus:ring-sky-500" />
            <input name="especialidad" placeholder="Especialidad del médico" value={filtros.especialidad}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 focus:ring-2 focus:ring-sky-500" />

            <input name="patient_first_name" placeholder="Nombre del paciente" value={filtros.patient_first_name}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 focus:ring-2 focus:ring-sky-500" />
            <input name="patient_last_name" placeholder="Apellido del paciente" value={filtros.patient_last_name}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 focus:ring-2 focus:ring-sky-500" />
            <input name="document_number" placeholder="N° Documento" value={filtros.document_number}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 focus:ring-2 focus:ring-sky-500" />
            <input name="document_type" placeholder="Tipo Documento" value={filtros.document_type}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 focus:ring-2 focus:ring-sky-500" />

            <input name="account_number" placeholder="N° Cuenta" value={filtros.account_number}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 focus:ring-2 focus:ring-sky-500" />
            <input name="operation" placeholder="Cirugía / Operación" value={filtros.operation}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 focus:ring-2 focus:ring-sky-500" />
            <input name="motivo" placeholder="Motivo (cirugía / tratamiento)" value={filtros.motivo}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 focus:ring-2 focus:ring-sky-500" />
            <input name="cie10" placeholder="Código CIE10" value={filtros.cie10}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 focus:ring-2 focus:ring-sky-500" />

            <input name="descripcion" placeholder="Descripción" value={filtros.descripcion}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 focus:ring-2 focus:ring-sky-500" />

            <input name="from_date" type="date" value={filtros.from_date}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 focus:ring-2 focus:ring-sky-500" />
            <input name="to_date" type="date" value={filtros.to_date}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 focus:ring-2 focus:ring-sky-500" />
            <select name="gender" value={filtros.gender}
              onChange={handleChange}
              className="input rounded-lg border border-slate-300 bg-white/70 text-gray-600 focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Sexo</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>

            {/* Acciones filtros */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 gap-2 col-span-2 md:col-span-1">
              <Button onClick={buscar} className="bg-sky-600 hover:bg-sky-700 text-white">
                <Filter className="w-4 h-4 mr-2" /> Buscar
              </Button>
              

              <Button
                onClick={() => {
                  setFiltros({
                    year: "", doctor_last: "", doctor_first: "", patient_last_name: "",
                    patient_first_name: "", document_number: "", document_type: "",
                    operation: "", from_date: "", to_date: "", gender: "",
                    motivo: "", cie10: "", descripcion: "", account_number: "", especialidad: ""
                  })
                  setResultados([])
                }}
                className="bg-rose-500 hover:bg-rose-600 text-white"
              >
                <X className="w-4 h-4 mr-1" /> Limpiar
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* RESULTADOS */}
      <section className="px-4 sm:px-6 lg:px-8 mt-10 pb-40 max-w-7xl mx-auto">
        {loading ? (
          // Skeleton grid
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                <div className="h-5 w-48 bg-slate-200/70 rounded animate-pulse mb-3" />
                <div className="h-4 w-64 bg-slate-200/70 rounded animate-pulse mb-2" />
                <div className="h-4 w-40 bg-slate-200/70 rounded animate-pulse mb-2" />
                <div className="h-4 w-28 bg-slate-200/70 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : resultados.length > 0 ? (
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 min-h-[300px]"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {resultados.map((historia) => (
              <motion.div
                key={historia.$id}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                whileHover={{ scale: 1.01 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => { setDetalle(historia); setDetalleEditable(historia) }}
              >
                <div className="flex items-center gap-2 mb-3 text-sky-700">
                  <FileText className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">
                    {historia.patient_last_name}, {historia.patient_first_name}
                  </h2>
                </div>

                <p className="text-sm text-slate-700">
                  <span className="font-medium">Médico:</span>{" "}
                  <span className="text-slate-700">{historia.doctor_last}, {historia.doctor_first}</span>
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {historia.especialidad && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700">
                      {historia.especialidad}
                    </span>
                  )}
                  {historia.gender && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      historia.gender === "femenino"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-teal-100 text-teal-700"
                    }`}>
                      {historia.gender}
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-700 flex items-center gap-1 mt-3">
                  <Calendar className="w-4 h-4" />
                  <span className="font-mono">{historia.admission_date?.split("T")[0]}</span>
                </p>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="min-h-[300px] flex flex-col items-center justify-center text-slate-500 text-center">
            <XCircle className="w-12 h-12 text-slate-400 mb-2" />
            <p className="text-lg font-medium">No se encontraron resultados</p>
            <p className="text-sm">Prueba con otros filtros o un rango de fechas distinto.</p>
          </div>
        )}
      </section>

      {/* Versión para impresión */}
      <div className="hidden print:block px-10 pt-10 text-black">
        <h2 className="text-2xl font-bold mb-4 text-center">Historias Clínicas</h2>
        {resultados.map((r) => (
          <div key={r.$id} className="mb-6 border-b border-gray-400 pb-4">
            <p><strong>Paciente:</strong> {r.patient_first_name} {r.patient_last_name}</p>
            <p><strong>Médico:</strong> {r.doctor_first} {r.doctor_last}</p>
            <p><strong>Especialidad:</strong> {r.especialidad}</p>
            <p><strong>Documento:</strong> {r.document_type} {r.document_number}</p>
            <p><strong>HC:</strong> {r.hc}</p>
            <p><strong>Cuenta:</strong> {r.account_number}</p>
            <p><strong>Cirugía:</strong> {r.operation}</p>
            <p><strong>Sexo:</strong> {r.gender}</p>
            <p><strong>Motivo:</strong> {r.motivo}</p>
            <p><strong>CIE10:</strong> {r.cie10}</p>
            <p><strong>Descripción:</strong> {r.descripcion}</p>
            <p><strong>Observaciones:</strong> {r.observations}</p>
            <p><strong>Monto:</strong> S/ {r.amount}</p>
            <p><strong>Ingreso:</strong> {r.admission_date?.split("T")[0]}</p>
            <p><strong>Alta:</strong> {r.discharge_date?.split("T")[0]}</p>
          </div>
        ))}
      </div>

      {/* Modal Detalle / Edición */}
      <AnimatePresence>
        {detalle && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-2xl w-full shadow-xl relative max-h-[85vh] overflow-y-auto border border-slate-200/60"
              initial={{ scale: 0.97, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: 8 }}
            >
              {/* Header modal */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/60 rounded-t-2xl p-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-800">
                  {detalle.patient_last_name}, {detalle.patient_first_name}
                </h2>
                <div className="flex gap-2">
                  {!modoEdicion && (
                    <Button
                      onClick={() => setModoEdicion(true)}
                      className="h-9 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      <PencilLine className="w-4 h-4 mr-2" /> Editar
                    </Button>
                  )}
                  <button
                    onClick={() => { setDetalle(null); setModoEdicion(false) }}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                    aria-label="Cerrar"
                    title="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Contenido modal */}
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-800">
                  {/* Médico */}
                  <p className="col-span-2">
                    <strong>Médico:</strong>
                    {modoEdicion ? (
                      <>
                        <input
                          value={detalleEditable?.doctor_first || ""}
                          onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, doctor_first: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Nombre"
                        />
                        <input
                          value={detalleEditable?.doctor_last || ""}
                          onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, doctor_last: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="Apellido"
                        />
                      </>
                    ) : (
                      ` ${detalle.doctor_first} ${detalle.doctor_last}`
                    )}
                  </p>

                  <p>
                    <strong>Especialidad:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.especialidad || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, especialidad: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : (detalle.especialidad)}
                  </p>

                  {/* Sexo */}
                  <p>
                    <strong>Sexo:</strong>
                    {modoEdicion ? (
                      <select
                        value={detalleEditable?.gender || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, gender: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="">Seleccionar</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                      </select>
                    ) : (detalle.gender)}
                  </p>

                  <p>
                    <strong>N° Cuenta:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.account_number || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, account_number: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.account_number}
                  </p>

                  <p>
                    <strong>Código HC:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.hc || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, hc: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.hc}
                  </p>

                  <p>
                    <strong>Tipo Doc:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.document_type || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, document_type: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.document_type}
                  </p>

                  <p>
                    <strong>Doc N°:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.document_number || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, document_number: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.document_number}
                  </p>

                  <p><strong>Ingreso:</strong> {detalle.admission_date?.split("T")[0]}</p>
                  <p><strong>Alta:</strong> {detalle.discharge_date?.split("T")[0]}</p>

                  <p>
                    <strong>Cirugía:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.operation || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, operation: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.operation}
                  </p>

                  <p>
                    <strong>Correlativo:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.correlative || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, correlative: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.correlative}
                  </p>

                  <p>
                    <strong>Monto:</strong>
                    {modoEdicion ? (
                      <input
                        type="number"
                        value={detalleEditable?.amount || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, amount: parseFloat(e.target.value) }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : `S/ ${detalle.amount}`}
                  </p>

                  <p className="col-span-2">
                    <strong>Motivo:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.motivo || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, motivo: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.motivo}
                  </p>

                  <p className="col-span-2">
                    <strong>CIE10:</strong>
                    {modoEdicion ? (
                      <input
                        value={detalleEditable?.cie10 || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, cie10: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.cie10}
                  </p>

                  <p className="col-span-2">
                    <strong>Descripción:</strong>
                    {modoEdicion ? (
                      <textarea
                        value={detalleEditable?.descripcion || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, descripcion: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.descripcion}
                  </p>

                  <p className="col-span-2">
                    <strong>Observaciones:</strong>
                    {modoEdicion ? (
                      <textarea
                        value={detalleEditable?.observations || ""}
                        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, observations: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    ) : detalle.observations}
                  </p>
                </div>

                {/* Footer modal */}
                <div className="sticky bottom-0 pt-4 mt-6 bg-gradient-to-t from-white to-white/60">
                  {modoEdicion && (
                    <Button
                      onClick={async () => {
                        try {
                          const limpio = limpiarDocumento(detalleEditable)
                          await databases.updateDocument(databaseId, collectionId, detalleEditable.$id, limpio)
                          toast.success("Historia clínica actualizada correctamente.")
                          setDetalle(null)
                          setModoEdicion(false)
                          buscar()
                        } catch (err) {
                          console.error(err)
                          toast.error("Error al guardar cambios.")
                        }
                      }}
                      className="bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                    </Button>
                  )}

                  {detalle?.pdf_file_id && (
                    <a
                      href={`${endpoint}/storage/buckets/${bucketId}/files/${detalle.pdf_file_id}/download?project=${projectId}`}
                      target="_blank"
                      className="block mt-3 text-sky-700 hover:underline font-medium text-sm"
                    >
                      Descargar PDF completo
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selector de límite flotante */}
      <div className="fixed bottom-3 right-4 z-50 print:hidden">
        <select
          value={limit}
          onChange={(e) => { setLimit(parseInt(e.target.value)); setOffset(0) }}
          className="bg-white/90 backdrop-blur shadow border border-slate-300 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          title="Resultados por página"
        >
          {[10,20,50,100].map((n) => (<option key={n} value={n}>{n}</option>))}
        </select>
      </div>
    </div>
  )
}
