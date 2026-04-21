import api from './client';

export const getClients = () => api.get('/clients').then((r) => r.data);
export const updateClient = (id, data) => api.patch(`/clients/${id}`, data).then((r) => r.data);
