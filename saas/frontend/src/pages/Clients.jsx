import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, updateClient } from '../api/clients';
import toast from 'react-hot-toast';

export default function Clients() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['clients'], queryFn: getClients });

  const mutation = useMutation({
    mutationFn: ({ id, data }) => updateClient(id, data),
    onSuccess: () => { qc.invalidateQueries(['clients']); toast.success('Guardado'); },
    onError: () => toast.error('Error al guardar'),
  });

  const toggleVip = (client) =>
    mutation.mutate({ id: client.id, data: { is_vip: !client.is_vip } });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Clientes</h2>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Nombre', 'Teléfono', 'VIP', 'Cancelaciones', 'No-shows', 'Notas'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Cargando...</td></tr>
            ) : data?.clients?.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.name || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleVip(c)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      c.is_vip ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {c.is_vip ? '★ VIP' : 'Normal'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className={c.cancellation_count >= 2 ? 'text-red-600 font-bold' : ''}>
                    {c.cancellation_count}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={c.noshow_count >= 1 ? 'text-orange-500 font-bold' : ''}>
                    {c.noshow_count}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <input
                    defaultValue={c.notes || ''}
                    onBlur={(e) => {
                      if (e.target.value !== (c.notes || '')) {
                        mutation.mutate({ id: c.id, data: { notes: e.target.value } });
                      }
                    }}
                    className="w-full border-0 bg-transparent text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded px-1"
                    placeholder="Agregar nota..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
