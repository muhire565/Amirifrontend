import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('amiri_token'),
  user: JSON.parse(localStorage.getItem('amiri_user')),

  setAuth: (token, user) => {
    localStorage.setItem('amiri_token', token);
    localStorage.setItem('amiri_user', JSON.stringify(user));
    set({ token, user });
  },

  clearAuth: () => {
    localStorage.removeItem('amiri_token');
    localStorage.removeItem('amiri_user');
    set({ token: null, user: null });
  },

  logout: () => {
    localStorage.removeItem('amiri_token');
    localStorage.removeItem('amiri_user');
    set({ token: null, user: null });
  },

  isAuthenticated: () => !!get().token,

  hasRole: (...roles) => {
    const user = get().user;
    if (!user) return false;
    // Flatten in case an array was passed as a single argument
    const flattenedRoles = roles.flat();
    return flattenedRoles.includes(user.role);
  },
}));
