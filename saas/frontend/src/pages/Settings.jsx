export default function Settings() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Configuración</h2>
      <div className="bg-white rounded-xl shadow p-6 space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la barbería</label>
          <input type="text" placeholder="Ej: Barber Shop Los Villanos"
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número WhatsApp</label>
          <input type="text" placeholder="+52 55 1234 5678" readOnly
            className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
          <p className="text-xs text-gray-400 mt-1">Configurable en el servidor (.env)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zona horaria</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm">
            <option>America/Mexico_City</option>
            <option>America/Monterrey</option>
            <option>America/Tijuana</option>
          </select>
        </div>
        <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
