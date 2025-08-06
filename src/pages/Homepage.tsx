import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle, Users, FileText } from "lucide-react"

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="bg-white text-gray-800">
      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 py-20 bg-gradient-to-br from-blue-50 via-white to-blue-100 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-200 opacity-30 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-indigo-200 opacity-20 rounded-full blur-3xl animate-pulse-slower" />
        </div>

        <motion.h1
          className="relative text-5xl md:text-6xl font-extrabold mb-6 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Bienvenido a tu Sistema Clínico
        </motion.h1>
        <motion.p
          className="relative max-w-xl text-lg text-gray-600 mb-8 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Gestiona historias clínicas, administra usuarios y accede a funciones avanzadas con facilidad.
        </motion.p>
        <motion.button
          onClick={() => navigate("/login")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative z-10 bg-blue-600 text-white px-6 py-3 rounded-full flex items-center gap-2 text-lg font-medium shadow-md hover:bg-blue-700 transition"
        >
          Iniciar sesión <ArrowRight className="w-5 h-5" />
        </motion.button>
      </section>

      {/* BENEFICIOS */}
      <section className="py-24 bg-white px-6 text-center">
        <h2 className="text-3xl font-bold mb-12">¿Por qué elegir nuestra plataforma?</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { icon: <FileText className="w-8 h-8" />, title: "Historias clínicas digitales", desc: "Accede y gestiona historias con facilidad." },
            { icon: <Users className="w-8 h-8" />, title: "Control de usuarios", desc: "Administra roles y accesos de forma segura." },
            { icon: <CheckCircle className="w-8 h-8" />, title: "Seguridad garantizada", desc: "Protegemos tus datos clínicos con encriptación." },
          ].map((b, i) => (
            <motion.div
              key={i}
              className="bg-blue-50 p-6 rounded-xl shadow hover:shadow-lg transition"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              viewport={{ once: true }}
            >
              <div className="text-blue-600 mb-4">{b.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{b.title}</h3>
              <p className="text-gray-600">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* VIDEO DEMO */}
      <section className="py-24 bg-gradient-to-b from-white to-blue-50 px-6 text-center">
        <h2 className="text-3xl font-bold mb-6">Descubre cómo funciona</h2>
        <p className="text-gray-600 mb-10">Una breve demostración del poder de nuestra plataforma</p>
        <div className="max-w-4xl mx-auto aspect-video rounded-xl overflow-hidden shadow-lg">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/vLZ-c4coNTA"
            title="Demo Video"
            frameBorder="0"
            allowFullScreen
          ></iframe>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-24 bg-white px-6 text-center">
        <h2 className="text-3xl font-bold mb-10">Lo que dicen nuestros usuarios</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { name: "Dra. García", text: "Increíblemente intuitivo y me ahorra horas de trabajo diario." },
            { name: "Dr. Pérez", text: "El mejor sistema clínico que he probado. Seguridad y velocidad." },
            { name: "Lic. Soto", text: "Ideal para clínicas pequeñas y medianas. ¡Recomendado!" },
          ].map((t, i) => (
            <motion.div
              key={i}
              className="bg-blue-100/40 p-6 rounded-lg shadow text-left"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              viewport={{ once: true }}
            >
              <p className="text-gray-700 italic mb-4">"{t.text}"</p>
              <p className="text-gray-900 font-semibold">– {t.name}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-blue-50 px-6 text-center">
        <h2 className="text-3xl font-bold mb-10">Preguntas frecuentes</h2>
        <div className="max-w-4xl mx-auto space-y-6 text-left">
          {[
            ["¿Es seguro el sistema?", "Sí, todos los datos están encriptados y almacenados con Appwrite."],
            ["¿Puedo gestionar usuarios?", "Sí, puedes asignar roles y permisos como admin o doctor."],
            ["¿Funciona en celulares?", "Sí, la plataforma es 100% responsive y adaptada a móviles."],
          ].map(([q, a], i) => (
            <motion.div
              key={i}
              className="p-4 bg-white rounded-lg shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
            >
              <p className="font-semibold text-gray-800">{q}</p>
              <p className="text-gray-600 mt-2">{a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 bg-blue-600 text-white text-center px-6">
        <h2 className="text-3xl font-bold mb-4">¿Listo para comenzar?</h2>
        <p className="mb-8 text-lg">Inicia sesión y lleva tu gestión clínica al siguiente nivel.</p>
        <button
          onClick={() => navigate("/login")}
          className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition"
        >
          Ir al login
        </button>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Sistema Clínico. Todos los derechos reservados.
      </footer>
    </div>
  )
}
