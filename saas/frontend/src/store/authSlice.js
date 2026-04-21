import { createSlice } from '@reduxjs/toolkit';

const stored = localStorage.getItem('accessToken');

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: stored || null, isAuthenticated: !!stored },
  reducers: {
    setToken(state, action) {
      state.token = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('accessToken', action.payload);
    },
    logout(state) {
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
    },
  },
});

export const { setToken, logout } = authSlice.actions;
export default authSlice.reducer;
