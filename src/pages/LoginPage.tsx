// src/pages/LoginPage.tsx

import { account } from "../lib/appwrite"
import { Lock } from "lucide-react"
import { motion } from "framer-motion"

export default function LoginPage() {

  const handleGoogleLogin = () => {
    account.createOAuth2Session(
      "google" as any,
      `${window.location.origin}/dashboard`,
      `${window.location.origin}/login`
    )
  }

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="relative min-h-screen overflow-hidden text-gray-800 bg-gradient-to-br from-white via-sky-100 to-sky-200"
    >
      {/* Fondos animados como en HomePage */}
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

      {/* Contenido centrado */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <motion.div
          initial={false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="bg-white/50 p-10 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6 backdrop-blur border border-white/40"
        >
          {/* Título + ícono */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 10 }}
            className="flex items-center justify-center gap-2 text-sky-500"
          >
            <Lock className="w-6 h-6" />
            <h2 className="text-2xl font-semibold tracking-tight">Bienvenido</h2>
          </motion.div>

          {/* Botón con animación */}
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-md bg-sky-300 opacity-30 blur-xl"
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

            <motion.button
              onClick={handleGoogleLogin}
              aria-label="Iniciar sesión con Google"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              whileHover={{
                scale: 1.05,
                rotateX: 5,
                rotateY: 5,
                transition: { type: "spring", stiffness: 200 },
              }}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-2 rounded-md shadow-md hover:bg-gray-50 transition font-medium relative z-10"
            >
              <svg className="w-5 h-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.4-35-4.4-52H272v98.7h146.9c-6.3 34-25.4 62.8-54.3 82l87.6 68.2c51-47.1 81.3-116.5 81.3-196.9z" />
                <path fill="#34A853" d="M272 544.3c73.6 0 135.3-24.4 180.4-66.3l-87.6-68.2c-24.4 16.4-55.8 26-92.8 26-71.4 0-131.9-48.1-153.6-112.9l-90.5 69.6C71.7 486.7 163.4 544.3 272 544.3z" />
                <path fill="#FBBC05" d="M118.4 322.5c-10.3-30.4-10.3-63.3 0-93.7L27.9 159.2C-8.6 230.6-8.6 313.7 27.9 385z" />
                <path fill="#EA4335" d="M272 107.7c39.9 0 75.7 13.7 103.9 40.4l77.8-77.8C405.2 24.3 345.4 0 272 0 163.4 0 71.7 57.6 27.9 159.2l90.5 69.6C140.1 155.8 200.6 107.7 272 107.7z" />
              </svg>
              <span>Iniciar sesión con Google</span>
            </motion.button>
          </div>

          <p className="text-xs text-gray-500 pt-2">
            Al continuar, aceptas nuestros{" "}
            <a href="/terms" className="underline text-sky-500 hover:text-sky-600 transition">
              Términos
            </a>{" "}
            y{" "}
            <a href="/privacy" className="underline text-sky-500 hover:text-sky-600 transition">
              Política de privacidad
            </a>.
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
