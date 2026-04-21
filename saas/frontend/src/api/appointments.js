import api from './client';

export const getAppointments = (params) => api.get('/appointments', { params }).then((r) => r.data);
export const updateStatus = (id, status) => api.patch(`/appointments/${id}/status`, { status }).then((r) => r.data);
export const cancelAppointment = (id) => api.delete(`/appointments/${id}`).then((r) => r.data);
