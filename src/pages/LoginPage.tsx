import { account } from "../lib/appwrite"
import { Lock } from "lucide-react"

export default function LoginPage() {
  const handleGoogleLogin = () => {
    account.createOAuth2Session(
      "google" as any,
      `${window.location.origin}/dashboard`,
      `${window.location.origin}/login`
    )
  }

  return (
    <div className="relative min-h-screen bg-[#f9fafb] text-[#111827] transition-colors duration-300">
      {/* Imagen de fondo */}
      <img
        src="https://images.unsplash.com/photo-1588776814546-ec7d2da85b1b?auto=format&fit=crop&w=2000&q=80"
        alt="Fondo salud"
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-40"
      />

      {/* Overlay blanco con blur */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-md z-10" />

      {/* Contenido centrado */}
      <div className="relative z-20 flex items-center justify-center min-h-screen px-6">
        <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6 border border-gray-200 transition">
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <Lock className="w-6 h-6" />
            <h2 className="text-2xl font-semibold tracking-tight">Bienvenido</h2>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-2 rounded-md hover:bg-gray-50 shadow-md transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.4-35-4.4-52H272v98.7h146.9c-6.3 34-25.4 62.8-54.3 82l87.6 68.2c51-47.1 81.3-116.5 81.3-196.9z"/>
              <path fill="#34A853" d="M272 544.3c73.6 0 135.3-24.4 180.4-66.3l-87.6-68.2c-24.4 16.4-55.8 26-92.8 26-71.4 0-131.9-48.1-153.6-112.9l-90.5 69.6C71.7 486.7 163.4 544.3 272 544.3z"/>
              <path fill="#FBBC05" d="M118.4 322.5c-10.3-30.4-10.3-63.3 0-93.7L27.9 159.2C-8.6 230.6-8.6 313.7 27.9 385z"/>
              <path fill="#EA4335" d="M272 107.7c39.9 0 75.7 13.7 103.9 40.4l77.8-77.8C405.2 24.3 345.4 0 272 0 163.4 0 71.7 57.6 27.9 159.2l90.5 69.6C140.1 155.8 200.6 107.7 272 107.7z"/>
            </svg>
            <span className="font-medium">Iniciar sesión con Google</span>
          </button>

          <p className="text-xs text-gray-500 pt-2">
            Al continuar, aceptas nuestros{" "}
            <a href="/terms" className="underline text-blue-600 hover:text-blue-700">
              Términos
            </a>{" "}
            y{" "}
            <a href="/privacy" className="underline text-blue-600 hover:text-blue-700">
              Política de privacidad
            </a>.
          </p>
        </div>
      </div>
    </div>
  )
}
