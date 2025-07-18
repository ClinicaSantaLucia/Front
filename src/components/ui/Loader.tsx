import React from "react"

const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-blue-600 border-dashed rounded-full animate-spin"></div>
        <p className="text-blue-600 text-lg font-medium tracking-wide">
          Cargando...
        </p>
      </div>
    </div>
  )
}

export default Loader
