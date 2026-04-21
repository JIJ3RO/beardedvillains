import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSchedule, setSchedule, getBlocked, addBlocked, removeBlocked } from '../api/availability';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const DEFAULT_SCHEDULE = DAYS.map((_, i) => ({
  day_of_week: i,
  start_time: '09:00',
  end_time: '19:00',
  vip_only: i === 0, // Sunday default VIP only
  enabled: i !== 0,
}));

export default function Availability() {
  const qc = useQueryClient();
  const [schedule, setLocalSchedule] = useState(null);
  const [newBlock, setNewBlock] = useState({ start_at: '', end_at: '', reason: '' });

  const { data: schedData } = useQuery({
    queryKey: ['schedule'],
    queryFn: getSchedule,
    onSuccess: (d) => {
      const filled = DEFAULT_SCHEDULE.map((def) => {
        const found = d.schedule?.find((s) => s.day_of_week === def.day_of_week);
        return found ? { ...found, enabled: true } : def;
      });
      setLocalSchedule(filled);
    },
  });

  const { data: blockedData } = useQuery({ queryKey: ['blocked'], queryFn: getBlocked });

  const saveSched = useMutation({
    mutationFn: () => {
      const toSave = schedule.filter((s) => s.enabled).map(({ enabled, ...rest }) => rest);
      return setSchedule(toSave);
    },
    onSuccess: () => { qc.invalidateQueries(['schedule']); toast.success('Horario guardado'); },
    onError: () => toast.error('Error'),
  });

  const addBlockMutation = useMutation({
    mutationFn: addBlocked,
    onSuccess: () => { qc.invalidateQueries(['blocked']); setNewBlock({ start_at: '', end_at: '', reason: '' }); toast.success('Bloqueo agregado'); },
    onError: () => toast.error('Error'),
  });

  const removeBlockMutation = useMutation({
    mutationFn: removeBlocked,
    onSuccess: () => { qc.invalidateQueries(['blocked']); toast.success('Bloqueo eliminado'); },
    onError: () => toast.error('Error'),
  });

  function updateDay(idx, field, value) {
    setLocalSchedule((prev) => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Disponibilidad</h2>

      {/* Weekly schedule */}
      <div className="bg-white rounded-xl shadow p-5 space-y-3">
        <h3 className="font-semibold text-gray-700">Horario semanal</h3>
        {(schedule || DEFAULT_SCHEDULE).map((day, idx) => (
          <div key={idx} className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 w-28">
              <input type="checkbox" checked={day.enabled} onChange={(e) => updateDay(idx, 'enabled', e.target.checked)} />
              <span className="text-sm font-medium">{DAYS[idx]}</span>
            </label>
            {day.enabled && (
              <>
                <input type="time" value={day.start_time} onChange={(e) => updateDay(idx, 'start_time', e.target.value)}
                  className="border rounded px-2 py-1 text-sm" />
                <span className="text-gray-400 text-sm">a</span>
                <input type="time" value={day.end_time} onChange={(e) => updateDay(idx, 'end_time', e.target.value)}
                  className="border rounded px-2 py-1 text-sm" />
                <label className="flex items-center gap-1 text-sm text-yellow-700">
                  <input type="checkbox" checked={day.vip_only} onChange={(e) => updateDay(idx, 'vip_only', e.target.checked)} />
                  Solo VIP
                </label>
              </>
            )}
          </div>
        ))}
        <button onClick={() => saveSched.mutate()}
          className="mt-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
          Guardar horario
        </button>
      </div>

      {/* Blocked slots */}
      <div className="bg-white rounded-xl shadow p-5 space-y-3">
        <h3 className="font-semibold text-gray-700">Bloqueos / Ausencias</h3>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input type="datetime-local" value={newBlock.start_at} onChange={(e) => setNewBlock({ ...newBlock, start_at: e.target.value })}
              className="border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input type="datetime-local" value={newBlock.end_at} onChange={(e) => setNewBlock({ ...newBlock, end_at: e.target.value })}
              className="border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Motivo</label>
            <input type="text" value={newBlock.reason} onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
              placeholder="Vacaciones, enfermedad..." className="border rounded px-2 py-1 text-sm w-40" />
          </div>
          <button onClick={() => addBlockMutation.mutate(newBlock)}
            className="self-end bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm">
            Agregar
          </button>
        </div>

        <ul className="space-y-2 mt-2">
          {blockedData?.blocked?.map((b) => (
            <li key={b.id} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <span>{new Date(b.start_at).toLocaleString()} — {new Date(b.end_at).toLocaleString()}</span>
              <span className="text-gray-400 text-xs">{b.reason}</span>
              <button onClick={() => removeBlockMutation.mutate(b.id)}>
                <Trash2 size={14} className="text-red-400 hover:text-red-600" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
