import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAppointments, updateStatus, cancelAppointment } from '../api/appointments';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_COLORS = {
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
  no_show: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS = { confirmed: 'Confirmada', cancelled: 'Cancelada', completed: 'Completada', no_show: 'No asistió' };

export default function Appointments() {
  const [filters, setFilters] = useState({ date: '', status: '', type: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => getAppointments(filters),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries(['appointments']); toast.success('Estado actualizado'); },
    onError: () => toast.error('Error al actualizar'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => cancelAppointment(id),
    onSuccess: () => { qc.invalidateQueries(['appointments']); toast.success('Cita cancelada'); },
    onError: () => toast.error('Error al cancelar'),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Citas</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow">
        <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm" />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          <option value="confirmed">Confirmada</option>
          <option value="cancelled">Cancelada</option>
          <option value="completed">Completada</option>
          <option value="no_show">No asistió</option>
        </select>
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Todos los tipos</option>
          <option value="in_shop">En tienda</option>
          <option value="home_visit">Domicilio</option>
        </select>
        <button onClick={() => setFilters({ date: '', status: '', type: '' })}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800">
          Limpiar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              {['Fecha', 'Cliente', 'Servicio', 'Tipo', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Cargando...</td></tr>
            ) : data?.appointments?.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  {format(new Date(a.scheduled_at), "dd MMM yyyy HH:mm", { locale: es })}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{a.client_name || a.client_phone}</p>
                  {a.cancellation_count >= 2 && (
                    <span className="text-xs text-red-500">⚠️ {a.cancellation_count} cancelaciones</span>
                  )}
                  {a.is_vip && <span className="ml-1 text-xs text-yellow-600">★ VIP</span>}
                </td>
                <td className="px-4 py-3">{a.service_name}</td>
                <td className="px-4 py-3">
                  {a.type === 'home_visit' ? '🏠 Domicilio' : '✂️ Tienda'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[a.status]}`}>
                    {STATUS_LABELS[a.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {a.status === 'confirmed' && (
                    <div className="flex gap-2">
                      <button onClick={() => statusMutation.mutate({ id: a.id, status: 'completed' })}
                        className="text-xs text-blue-600 hover:underline">Completar</button>
                      <button onClick={() => statusMutation.mutate({ id: a.id, status: 'no_show' })}
                        className="text-xs text-gray-500 hover:underline">No asistió</button>
                      <button onClick={() => cancelMutation.mutate(a.id)}
                        className="text-xs text-red-500 hover:underline">Cancelar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
