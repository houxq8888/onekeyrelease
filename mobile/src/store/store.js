import { configureStore } from '@reduxjs/toolkit';
import deviceReducer from './slices/deviceSlice';
import taskReducer from './slices/taskSlice';
import contentReducer from './slices/contentSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    device: deviceReducer,
    task: taskReducer,
    content: contentReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});