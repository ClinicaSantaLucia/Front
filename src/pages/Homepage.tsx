// src/pages/HomePage.tsx

import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Stethoscope } from "lucide-react"

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="relative min-h-screen overflow-hidden text-gray-800 bg-gradient-to-br from-white via-sky-100 to-sky-200"
    >
      {/* Fondo animado */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute top-[-10%] left-[10%] w-[400px] h-[400px] bg-sky-200 rounded-full blur-[120px] opacity-30"
          animate={{ x: [0, 50, -50, 0], y: [0, 40, -40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[5%] w-[300px] h-[300px] bg-blue-300 rounded-full blur-[100px] opacity-30"
          animate={{ x: [0, -30, 30, 0], y: [0, -20, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Icono animado */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
          className="mb-6"
        >
          <Stethoscope size={80} strokeWidth={2.5} className="text-sky-600 drop-shadow" />
        </motion.div>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-4xl md:text-6xl font-extrabold leading-tight drop-shadow-md text-gray-800 tracking-tight"
        >
          Bienvenido a tu Clínica Inteligente
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="mt-4 text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed"
        >
          Gestiona historias clínicas con tecnología moderna, precisión y velocidad.
        </motion.p>

        {/* Botón con pulso */}
        <div className="relative mt-10">
          {/* Halo pulsante */}
          <motion.div
            className="absolute inset-0 rounded-full bg-sky-300 opacity-30 blur-xl"
            animate={{
              scale: [1, 1.4],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Botón principal */}
          <motion.button
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            whileHover={{
              scale: 1.05,
              rotateX: 5,
              rotateY: 5,
              transition: { type: "spring", stiffness: 200 },
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/login")}
            aria-label="Iniciar sesión"
            className="relative z-10 px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-sky-400 to-blue-400 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-md"
          >
            Iniciar
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
