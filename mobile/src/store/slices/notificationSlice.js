import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [],
    unreadCount: 0,
    permissionGranted: false,
  },
  reducers: {
    addNotification: (state, action) => {
      const notification = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      };
      
      state.notifications.unshift(notification);
      state.unreadCount += 1;
    },
    markAsRead: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount -= 1;
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        if (!notification.read) {
          notification.read = true;
        }
      });
      state.unreadCount = 0;
    },
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      const notificationIndex = state.notifications.findIndex(n => n.id === notificationId);
      
      if (notificationIndex !== -1) {
        const notification = state.notifications[notificationIndex];
        if (!notification.read) {
          state.unreadCount -= 1;
        }
        state.notifications.splice(notificationIndex, 1);
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    setPermissionGranted: (state, action) => {
      state.permissionGranted = action.payload;
    },
  },
});

export const { 
  addNotification, 
  markAsRead, 
  markAllAsRead, 
  removeNotification, 
  clearAllNotifications,
  setPermissionGranted,
} = notificationSlice.actions;
export default notificationSlice.reducer;