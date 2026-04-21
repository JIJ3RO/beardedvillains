import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const EMPTY = { name: '', description: '', price: '', stock: '', category: '', image_url: '' };

export default function Products() {
  const [form, setForm] = useState(null); // null=closed, {} = new, {...id} = editing
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['products'], queryFn: getProducts });

  const saveMutation = useMutation({
    mutationFn: (d) => d.id ? updateProduct(d.id, d) : createProduct(d),
    onSuccess: () => { qc.invalidateQueries(['products']); setForm(null); toast.success('Guardado'); },
    onError: () => toast.error('Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { qc.invalidateQueries(['products']); toast.success('Eliminado'); },
    onError: () => toast.error('Error'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    saveMutation.mutate(form);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Productos</h2>
        <button onClick={() => setForm(EMPTY)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
          <Plus size={16} /> Agregar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? <p className="text-gray-400">Cargando...</p> : data?.products?.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-800">{p.name}</p>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{p.category}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setForm(p)} className="text-gray-400 hover:text-gray-700"><Pencil size={14} /></button>
                <button onClick={() => deleteMutation.mutate(p.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
            <p className="text-sm text-gray-500">{p.description}</p>
            <div className="flex justify-between text-sm">
              <span className="font-bold text-gray-800">${p.price}</span>
              <span className={`${p.stock <= 5 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                Stock: {p.stock}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {form && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
            <h3 className="font-bold text-lg">{form.id ? 'Editar producto' : 'Nuevo producto'}</h3>
            {[
              { field: 'name', label: 'Nombre', required: true },
              { field: 'description', label: 'Descripción' },
              { field: 'price', label: 'Precio', type: 'number', required: true },
              { field: 'stock', label: 'Stock', type: 'number' },
              { field: 'category', label: 'Categoría' },
              { field: 'image_url', label: 'URL imagen' },
            ].map(({ field, label, type = 'text', required }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input type={type} value={form[field] || ''} required={required}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm hover:bg-gray-700">
                Guardar
              </button>
              <button type="button" onClick={() => setForm(null)}
                className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
