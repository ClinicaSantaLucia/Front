import { useEffect, useState } from "react"
import { databases, Query } from "../lib/appwrite"
import { FileText, Calendar, XCircle, Filter, X, Printer, FileDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Header from "../components/layout/Header"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import { Save, PencilLine } from "lucide-react"
import { toast } from "sonner"


const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID
const collectionId = import.meta.env.VITE_APPWRITE_MEDICAL_COLLECTION_ID
const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT
function limpiarDocumento(doc: any) {
  const camposValidos = [
    "year", "month", "gender", "record_number", "admission_date",
    "discharge_date", "doctor_first", "doctor_last", "hc", "room_number",
    "account_number", "operation", "correlative", "observations",
    "condition", "created_by", "pdf_file_id", "ocr_image_id", "ocr_text",
    "created_at", "document_type", "patient_first_name", "patient_last_name",
    "amount", "igv", "cancellation_date", "document_number",
    "motivo", "cie10", "descripcion",  "especialidad"
  ]

  const limpio: any = {}
  for (const campo of camposValidos) {
    if (campo in doc) limpio[campo] = doc[campo]
  }
  return limpio
}



export default function BuscadorHistoriasPage() {
  const [filtros, setFiltros] = useState({
    year: "",
    doctor_last: "",
    doctor_first: "",
    patient_last_name: "",
    patient_first_name: "",
    document_number: "",
    document_type: "",
    room_number: "",
    operation: "",
    from_date: "",
    to_date: "",
    gender: "",
    motivo: "",
    cie10: "",
    descripcion: "",
    account_number: "",
    especialidad: "",
  })

  const [resultados, setResultados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detalle, setDetalle] = useState<any | null>(null)
  const [detalleEditable, setDetalleEditable] = useState<any | null>(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)

  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value })
  }

  const buscar = async () => {
    setLoading(true)
    try {
      const queries: any[] = []

      const addQuery = (key: string, val: string) => {
        if (val?.trim()) queries.push(Query.equal(key, val.trim()))
      }

      if (filtros.year.trim()) queries.push(Query.equal("year", parseInt(filtros.year)))
      addQuery("doctor_last", filtros.doctor_last)
      addQuery("doctor_first", filtros.doctor_first)
      addQuery("patient_last_name", filtros.patient_last_name)
      addQuery("patient_first_name", filtros.patient_first_name)
      addQuery("document_number", filtros.document_number)
      addQuery("document_type", filtros.document_type)
      addQuery("room_number", filtros.room_number)
      addQuery("operation", filtros.operation)
      addQuery("gender", filtros.gender)
      addQuery("motivo", filtros.motivo)
      addQuery("cie10", filtros.cie10)
      addQuery("descripcion", filtros.descripcion)
      addQuery("account_number", filtros.account_number)
      addQuery("especialidad", filtros.especialidad)


      if (filtros.from_date) queries.push(Query.greaterThanEqual("admission_date", filtros.from_date))
      if (filtros.to_date) queries.push(Query.lessThanEqual("admission_date", filtros.to_date))
      
        if (queries.length === 0) queries.push(Query.limit(limit))
          else {
            queries.push(Query.limit(limit))
            queries.push(Query.offset(offset))
          }
          
      const res = await databases.listDocuments(databaseId, collectionId, 
        [...queries, Query.limit(limit), Query.offset(offset)]
      )
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
      "Habitación": r.room_number,
      "N° Cuenta": r.account_number,
      "Cirugía": r.operation,
      "Correlativo": r.correlative,
      "Sexo": r.gender,
      "Motivo": r.motivo || "",
      "CIE10": r.cie10 || "",
      "Descripción": r.descripcion || "",
      "Observaciones": r.observations || "",
      "Monto": r.amount,
      "IGV": r.igv,
      "Fecha Ingreso": r.admission_date?.split("T")[0],
      "Fecha Alta": r.discharge_date?.split("T")[0],
      "Cancelación": r.cancellation_date?.split("T")[0],
      
    }))
  
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Historias")
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    saveAs(new Blob([buffer]), "historias_clinicas.xlsx")
  }
  

  useEffect(() => {
    buscar()
  }, [limit, offset])
  
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
        <input
  name="especialidad"
  placeholder="Especialidad del médico"
  value={filtros.especialidad}
  onChange={handleChange}
  className="input"
/>

        <input name="patient_first_name" placeholder="Nombre del paciente" value={filtros.patient_first_name} onChange={handleChange} className="input" />
        <input name="patient_last_name" placeholder="Apellido del paciente" value={filtros.patient_last_name} onChange={handleChange} className="input" />
        <input name="document_number" placeholder="N° Documento" value={filtros.document_number} onChange={handleChange} className="input" />
        <input name="document_type" placeholder="Tipo Documento" value={filtros.document_type} onChange={handleChange} className="input" />
        <input name="room_number" placeholder="Habitación" value={filtros.room_number} onChange={handleChange} className="input" />
        <input name="account_number" placeholder="N° Cuenta" value={filtros.account_number} onChange={handleChange} className="input" />
        <input name="operation" placeholder="Cirugía / Operación" value={filtros.operation} onChange={handleChange} className="input" />
        <input name="motivo" placeholder="Motivo (cirugía / tratamiento)" value={filtros.motivo} onChange={handleChange} className="input" />
        <input name="cie10" placeholder="Código CIE10" value={filtros.cie10} onChange={handleChange} className="input" />
        <input name="descripcion" placeholder="Descripción" value={filtros.descripcion} onChange={handleChange} className="input" />
       
        <input name="from_date" type="date" value={filtros.from_date} onChange={handleChange} className="input" />
        <input name="to_date" type="date" value={filtros.to_date} onChange={handleChange} className="input" />
        <select name="gender" value={filtros.gender} onChange={handleChange} className="input text-gray-500">
          <option value="">Sexo</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
        </select>

        <div className="flex flex-wrap gap-2 col-span-2 md:col-span-1">
          <button onClick={buscar} className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-1 hover:bg-blue-700">
            <Filter className="w-4 h-4" /> Buscar
          </button>
          <button onClick={exportarExcel} className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-1 hover:bg-green-700">
            <FileDown className="w-4 h-4" /> Excel
          </button>
          <button onClick={() => window.print()} className="bg-gray-600 text-white px-4 py-2 rounded-md flex items-center gap-1 hover:bg-gray-700">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </motion.div>
    

      {/* RESULTADOS */}
      <div className="px-6 mt-12 pb-40 max-w-7xl mx-auto">
      {loading ? (
  <p className="text-center text-gray-500 text-lg">Cargando resultados...</p>
) : resultados.length > 0 ? (
  <motion.div
    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 min-h-[300px]"
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
                onClick={() => {
                  setDetalle(historia)
                  setDetalleEditable(historia)
                }}
                              >
                <div className="flex items-center gap-2 mb-3 text-blue-700">
                  <FileText className="w-5 h-5" />
                  <h2 className="text-lg font-bold">
                    {historia.patient_last_name}, {historia.patient_first_name}
                  </h2>
                </div>
                <p className="text-sm text-gray-700 font-medium">Médico: <span className="font-normal">{historia.doctor_last}, {historia.doctor_first}</span></p>
                <p className="text-sm text-gray-700 font-medium">Especialidad: <span className="font-normal">{historia.especialidad}</span></p>
                <p className="text-sm text-gray-700 font-medium">Sexo: <span className="font-normal capitalize">{historia.gender}</span></p>
                <p className="text-sm text-gray-700 font-medium flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4" /> {historia.admission_date?.split("T")[0]}
                </p>
              </motion.div>
            ))}
          </motion.div>
       ) : (
        <div className="min-h-[300px] flex flex-col items-center justify-center text-gray-500 text-center">
          <XCircle className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-lg font-medium">No se encontraron resultados</p>
        </div>
      )}
      </div> 
      <div className="flex justify-between items-center mt-6 px-4">
  

<div className="hidden print:block px-10 pt-10 text-black">
  <h2 className="text-2xl font-bold mb-4 text-center">Historias Clínicas</h2>
  {resultados.map((r) => (
    <div key={r.$id} className="mb-6 border-b border-gray-400 pb-4">
      <p><strong>Paciente:</strong> {r.patient_first_name} {r.patient_last_name}</p>
      <p><strong>Médico:</strong> {r.doctor_first} {r.doctor_last}</p>
      <p><strong>Especialidad:</strong> {r.especialidad}</p>
      <p><strong>Documento:</strong> {r.document_type} {r.document_number}</p>
      <p><strong>HC:</strong> {r.hc}</p>
      <p><strong>Habitación:</strong> {r.room_number}</p>
      <p><strong>Cuenta:</strong> {r.account_number}</p>
      <p><strong>Cirugía:</strong> {r.operation}</p>
      <p><strong>Sexo:</strong> {r.gender}</p>
      <p><strong>Motivo:</strong> {r.motivo}</p>
      <p><strong>CIE10:</strong> {r.cie10}</p>
      <p><strong>Descripción:</strong> {r.descripcion}</p>
      <p><strong>Observaciones:</strong> {r.observations}</p>
      <p><strong>Monto:</strong> S/ {r.amount}</p>
      <p><strong>IGV:</strong> S/ {r.igv}</p>
      <p><strong>Ingreso:</strong> {r.admission_date?.split("T")[0]}</p>
      <p><strong>Alta:</strong> {r.discharge_date?.split("T")[0]}</p>
      <p><strong>Cancelación:</strong> {r.cancellation_date?.split("T")[0]}</p>
    </div>
  ))}
</div>



      

      <AnimatePresence>
  {detalle && (
    <motion.div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
<motion.div
  className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-xl relative max-h-[80vh] overflow-y-auto"

        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
      >
        <button
          onClick={() => {
            setDetalle(null)
            setModoEdicion(false)
          }}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-700">
            {detalle.patient_last_name}, {detalle.patient_first_name}
          </h2>
          {!modoEdicion && (
            <button
              onClick={() => setModoEdicion(true)}
              className="flex items-center gap-1 text-sm px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              <PencilLine className="w-4 h-4" /> Editar
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-800">

{/** Médico */}
<p className="col-span-2"><strong>Médico:</strong>
  {modoEdicion ? (
    <>
      <input
        value={detalleEditable?.doctor_first || ""}
        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, doctor_first: e.target.value }))}
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Nombre"
      />
      <input
        value={detalleEditable?.doctor_last || ""}
        onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, doctor_last: e.target.value }))}
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Apellido"
      />
    </>
  ) : (
    ` ${detalle.doctor_first} ${detalle.doctor_last}`
  )}
</p>

<p><strong>Especialidad:</strong>
  {modoEdicion ? (
    <input
      value={detalleEditable?.especialidad || ""}
      onChange={(e) =>
        setDetalleEditable((prev: any) => ({
          ...prev,
          especialidad: e.target.value,
        }))
      }
      className="input w-full bg-white border px-2 py-1 rounded mt-1"
    />
  ) : (
    detalle.especialidad
  )}
</p>




{/** Sexo */}
<p><strong>Sexo:</strong>
  {modoEdicion ? (
    <select
      value={detalleEditable?.gender || ""}
      onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, gender: e.target.value }))}
      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
      <option value="">Seleccionar</option>
      <option value="masculino">Masculino</option>
      <option value="femenino">Femenino</option>
    </select>
  ) : (
    detalle.gender
  )}
</p>


  <p><strong>N° Cuenta:</strong>
    {modoEdicion ? (
      <input value={detalleEditable?.account_number || ""} onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, account_number: e.target.value }))} className="input w-full bg-white border px-2 py-1 rounded mt-1" />
    ) : detalle.account_number}
  </p>

  <p><strong>Código HC:</strong>
    {modoEdicion ? (
      <input value={detalleEditable?.hc || ""} onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, hc: e.target.value }))} className="input w-full bg-white border px-2 py-1 rounded mt-1" />
    ) : detalle.hc}
  </p>

  <p><strong>Tipo Doc:</strong>
    {modoEdicion ? (
      <input value={detalleEditable?.document_type || ""} onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, document_type: e.target.value }))} className="input w-full bg-white border px-2 py-1 rounded mt-1" />
    ) : detalle.document_type}
  </p>

  <p><strong>Doc N°:</strong>
    {modoEdicion ? (
      <input value={detalleEditable?.document_number || ""} onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, document_number: e.target.value }))} className="input w-full bg-white border px-2 py-1 rounded mt-1" />
    ) : detalle.document_number}
  </p>

  <p><strong>Ingreso:</strong> {detalle.admission_date?.split("T")[0]}</p>
  <p><strong>Alta:</strong> {detalle.discharge_date?.split("T")[0]}</p>

  <p><strong>Cirugía:</strong>
    {modoEdicion ? (
      <input value={detalleEditable?.operation || ""} onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, operation: e.target.value }))} className="input w-full bg-white border px-2 py-1 rounded mt-1" />
    ) : detalle.operation}
  </p>

  <p><strong>Correlativo:</strong>
    {modoEdicion ? (
      <input value={detalleEditable?.correlative || ""} onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, correlative: e.target.value }))} className="input w-full bg-white border px-2 py-1 rounded mt-1" />
    ) : detalle.correlative}
  </p>

  <p><strong>Monto:</strong>
    {modoEdicion ? (
      <input type="number" value={detalleEditable?.amount || ""} onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, amount: parseFloat(e.target.value) }))} className="input w-full bg-white border px-2 py-1 rounded mt-1" />
    ) : `S/ ${detalle.amount}`}
  </p>

  <p><strong>IGV:</strong>
    {modoEdicion ? (
      <input type="number" value={detalleEditable?.igv || ""} onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, igv: parseFloat(e.target.value) }))} className="input w-full bg-white border px-2 py-1 rounded mt-1" />
    ) : `S/ ${detalle.igv}`}
  </p>

  <p><strong>Cancelación:</strong> {detalle.cancellation_date?.split("T")[0]}</p>

  <p className="col-span-2"><strong>Motivo:</strong>
    {modoEdicion ? (
      <input value={detalleEditable?.motivo || ""} onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, motivo: e.target.value }))} className="input w-full bg-white border px-2 py-1 rounded mt-1" />
    ) : detalle.motivo}
  </p>

  <p className="col-span-2"><strong>CIE10:</strong>
    {modoEdicion ? (
      <input value={detalleEditable?.cie10 || ""} onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, cie10: e.target.value }))} className="input w-full bg-white border px-2 py-1 rounded mt-1" />
    ) : detalle.cie10}
  </p>

  <p className="col-span-2"><strong>Descripción:</strong>
    {modoEdicion ? (
      <textarea value={detalleEditable?.descripcion || ""} onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, descripcion: e.target.value }))} className="input w-full bg-white border px-2 py-1 rounded mt-1" />
    ) : detalle.descripcion}
  </p>

  <p className="col-span-2"><strong>Observaciones:</strong>
    {modoEdicion ? (
      <textarea value={detalleEditable?.observations || ""} onChange={(e) => setDetalleEditable((prev: any) => ({ ...prev, observations: e.target.value }))} className="input w-full bg-white border px-2 py-1 rounded mt-1" />
    ) : detalle.observations}
  </p>
</div>

        {modoEdicion && (
          <button
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
            className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-1"
          >
            <Save className="w-4 h-4" /> Guardar Cambios
          </button>
        )}

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
<div className="fixed bottom-3 right-4 z-50 print:hidden">
  <select
    value={limit}
    onChange={(e) => {
      setLimit(parseInt(e.target.value));
      setOffset(0);
    }}
    className="bg-white shadow border border-gray-300 rounded px-2 py-1 text-sm"
  >
    {[10, 20, 50, 100].map((n) => (
      <option key={n} value={n}>{n}</option>
    ))}
  </select>
</div>


</div>
)}
