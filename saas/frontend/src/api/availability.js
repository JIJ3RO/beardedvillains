import api from './client';

export const getSchedule = () => api.get('/availability').then((r) => r.data);
export const setSchedule = (schedule) => api.put('/availability', { schedule }).then((r) => r.data);
export const getBlocked = () => api.get('/availability/blocked').then((r) => r.data);
export const addBlocked = (data) => api.post('/availability/blocked', data).then((r) => r.data);
export const removeBlocked = (id) => api.delete(`/availability/blocked/${id}`).then((r) => r.data);
