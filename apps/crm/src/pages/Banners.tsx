export default function Banners() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Banners</h1>
        <p className="mt-2 text-gray-600">Administra los banners del carrusel en la home</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-6xl mb-4">🎨</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Próximamente</h3>
        <p className="text-gray-600 mb-6">
          La gestión de banners estará disponible próximamente.
          <br />
          Podrás subir imágenes, configurar enlaces y programar campañas.
        </p>
        <div className="inline-block bg-gray-100 rounded-lg p-4 text-left">
          <p className="text-sm font-semibold text-gray-900 mb-2">Funcionalidades planeadas:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Upload de imágenes para banners</li>
            <li>• Configurar enlaces (productos, categorías, externo)</li>
            <li>• Orden de visualización</li>
            <li>• Programación de inicio/fin</li>
            <li>• Vista previa en tiempo real</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
