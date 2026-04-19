import { create } from 'zustand';
import { getAllApps, getAppById, addApp as dbAddApp, updateApp as dbUpdateApp, deleteApp as dbDeleteApp } from '../firebase/services';

const useAppStore = create((set, get) => ({
  // ─── Theme ───
  theme: localStorage.getItem('mrjk-theme') || 'dark',
  setTheme: (theme) => {
    localStorage.setItem('mrjk-theme', theme);
    document.documentElement.className = theme;
    set({ theme });
  },
  toggleTheme: () => {
    const current = get().theme;
    const next = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  // ─── Auth ───
  isAdmin: false,
  setAdmin: (val) => set({ isAdmin: val }),
  logout: () => set({ isAdmin: false }),

  // ─── Apps ───
  apps: [],
  loading: false,
  
  fetchApps: async () => {
    set({ loading: true });
    try {
      const apps = await getAllApps();
      set({ apps, loading: false });
    } catch (err) {
      console.error('Failed to fetch apps:', err);
      set({ loading: false });
    }
  },

  getAppById: async (id) => {
    try {
      return await getAppById(id);
    } catch (err) {
      console.error('Failed to get app:', err);
      return null;
    }
  },

  addApp: async (appData) => {
    try {
      const newApp = await dbAddApp(appData);
      set(state => ({ apps: [newApp, ...state.apps] }));
      return newApp;
    } catch (err) {
      console.error('Failed to add app:', err);
      throw err;
    }
  },

  updateApp: async (id, data) => {
    try {
      const updated = await dbUpdateApp(id, data);
      set(state => ({
        apps: state.apps.map(a => a.id === id ? { ...a, ...data } : a)
      }));
      return updated;
    } catch (err) {
      console.error('Failed to update app:', err);
      throw err;
    }
  },

  deleteApp: async (id) => {
    try {
      await dbDeleteApp(id);
      set(state => ({
        apps: state.apps.filter(a => a.id !== id)
      }));
    } catch (err) {
      console.error('Failed to delete app:', err);
      throw err;
    }
  },

  // ─── Page Loading ───
  pageLoading: false,
  setPageLoading: (val) => set({ pageLoading: val }),
}));

export default useAppStore;
