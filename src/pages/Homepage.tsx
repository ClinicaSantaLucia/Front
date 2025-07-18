import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import * as THREE from "three"
import { motion } from "framer-motion"
declare const require: any

export default function HomePage() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const [vantaEffect, setVantaEffect] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let effect: any

    const TOPOLOGY = require("vanta/dist/vanta.topology.min")

    if (!vantaEffect && vantaRef.current) {
      effect = TOPOLOGY({
        el: vantaRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x2563eb,
        backgroundColor: 0xf9fafb,
        points: 12.0,
        maxDistance: 20.0,
        spacing: 15.0,
      })
      setVantaEffect(effect)
    }

    return () => {
      if (effect) effect.destroy()
    }
  }, [vantaEffect])

  return (
    <div
      ref={vantaRef}
      className="min-h-screen flex items-center justify-center px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="text-center text-gray-900 dark:text-white"
      >
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8, type: "spring", bounce: 0.4 }}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6"
        >
          Sistema de Historias Clínicas
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-lg text-gray-700 dark:text-gray-300 mb-10 max-w-xl mx-auto"
        >
          Plataforma moderna para administradores de salud. Gestiona, sube y accede a historias clínicas de forma segura.
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/login")}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg font-semibold px-8 py-3 rounded-xl shadow-xl transition duration-300"
        >
          Iniciar
        </motion.button>
      </motion.div>
    </div>
  )
}
