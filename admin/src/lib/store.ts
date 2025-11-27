import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@/lib/api/baseApi';
import authReducer from '@/lib/slices/authSlice';
import themeReducer from '@/lib/slices/themeSlice';

export const makeStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      adminAuth: authReducer,
      theme: themeReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(baseApi.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
export type RootState = ReturnType<AppStore['getState']>;

export const initStore = (() => {
  let store: AppStore | undefined;
  return () => {
    if (!store) {
      store = makeStore();
      setupListeners(store.dispatch);
    }
    return store;
  };
})();




