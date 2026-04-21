import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices, createService, updateService, deleteService } from '../api/services';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const EMPTY = { name: '', duration_minutes: '', price: '', home_visit_surcharge: '0' };

export default function Services() {
  const [form, setForm] = useState(null);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['services'], queryFn: getServices });

  const saveMutation = useMutation({
    mutationFn: (d) => d.id ? updateService(d.id, d) : createService(d),
    onSuccess: () => { qc.invalidateQueries(['services']); setForm(null); toast.success('Guardado'); },
    onError: () => toast.error('Error'),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => { qc.invalidateQueries(['services']); toast.success('Eliminado'); },
    onError: () => toast.error('Error'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Servicios</h2>
        <button onClick={() => setForm(EMPTY)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
          <Plus size={16} /> Agregar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Servicio', 'Duración', 'Precio', 'Cargo domicilio', 'Activo', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Cargando...</td></tr>
            ) : data?.services?.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-500">{s.duration_minutes} min</td>
                <td className="px-4 py-3">${s.price}</td>
                <td className="px-4 py-3 text-gray-500">+${s.home_visit_surcharge}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setForm(s)}><Pencil size={14} className="text-gray-400 hover:text-gray-700" /></button>
                    <button onClick={() => deleteMutation.mutate(s.id)}><Trash2 size={14} className="text-red-400 hover:text-red-600" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3">
            <h3 className="font-bold text-lg">{form.id ? 'Editar servicio' : 'Nuevo servicio'}</h3>
            {[
              { field: 'name', label: 'Nombre', required: true },
              { field: 'duration_minutes', label: 'Duración (min)', type: 'number', required: true },
              { field: 'price', label: 'Precio ($)', type: 'number', required: true },
              { field: 'home_visit_surcharge', label: 'Cargo a domicilio ($)', type: 'number' },
            ].map(({ field, label, type = 'text', required }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input type={type} value={form[field] || ''} required={required}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm">Guardar</button>
              <button type="button" onClick={() => setForm(null)} className="flex-1 border rounded-lg py-2 text-sm">Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
