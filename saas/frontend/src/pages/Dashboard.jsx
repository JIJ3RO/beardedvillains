import { useQuery } from '@tanstack/react-query';
import { getStats } from '../api/dashboard';
import { Calendar, Users, XCircle, ShoppingBag, Clock } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color = 'bg-white' }) {
  return (
    <div className={`${color} rounded-xl shadow p-5 flex items-center gap-4`}>
      <div className="p-3 bg-gray-100 rounded-lg">
        <Icon size={22} className="text-gray-700" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value ?? '–'}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['stats'], queryFn: getStats, refetchInterval: 60000 });

  if (isLoading) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Citas hoy" value={data?.today} />
        <StatCard icon={Calendar} label="Esta semana" value={data?.this_week} />
        <StatCard icon={XCircle} label="Cancelaciones (30d)" value={data?.cancellations_30d} />
        <StatCard icon={Clock} label="En lista de espera" value={data?.waitlist_count} />
      </div>

      {data?.low_stock_products?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-800 flex items-center gap-2">
            <ShoppingBag size={16} /> Productos con poco stock
          </h3>
          <ul className="mt-2 space-y-1">
            {data.low_stock_products.map((p) => (
              <li key={p.id} className="text-sm text-yellow-700">
                {p.name} — <strong>{p.stock}</strong> unidades
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
