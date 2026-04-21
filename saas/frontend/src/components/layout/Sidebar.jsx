import { NavLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import {
  LayoutDashboard, Calendar, Users, ShoppingBag, Scissors, Clock, Settings, LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/appointments', icon: Calendar, label: 'Citas' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/products', icon: ShoppingBag, label: 'Productos' },
  { to: '/services', icon: Scissors, label: 'Servicios' },
  { to: '/availability', icon: Clock, label: 'Disponibilidad' },
  { to: '/settings', icon: Settings, label: 'Configuración' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col">
      <div className="p-5 border-b border-gray-700">
        <h1 className="text-lg font-bold text-brand-500">✂️ Barbershop</h1>
        <p className="text-xs text-gray-400 mt-1">Panel Admin</p>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-brand-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => dispatch(logout())}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
