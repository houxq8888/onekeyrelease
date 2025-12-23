import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DeviceService } from '../../services/deviceService';

// 异步操作：注册设备
export const registerDevice = createAsyncThunk(
  'device/register',
  async (deviceInfo, { rejectWithValue }) => {
    try {
      const response = await DeviceService.registerDevice(deviceInfo);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 异步操作：连接WebSocket
export const connectWebSocket = createAsyncThunk(
  'device/connectWebSocket',
  async (deviceId, { rejectWithValue }) => {
    try {
      await DeviceService.connectWebSocket(deviceId);
      return { isConnected: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const deviceSlice = createSlice({
  name: 'device',
  initialState: {
    deviceId: null,
    deviceInfo: null,
    isRegistered: false,
    isWebSocketConnected: false,
    loading: false,
    error: null,
  },
  reducers: {
    setDeviceId: (state, action) => {
      state.deviceId = action.payload;
    },
    setWebSocketStatus: (state, action) => {
      state.isWebSocketConnected = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetDevice: (state) => {
      state.deviceId = null;
      state.deviceInfo = null;
      state.isRegistered = false;
      state.isWebSocketConnected = false;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 注册设备
      .addCase(registerDevice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerDevice.fulfilled, (state, action) => {
        state.loading = false;
        state.isRegistered = true;
        state.deviceInfo = action.payload;
        state.deviceId = action.payload.deviceId;
      })
      .addCase(registerDevice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 连接WebSocket
      .addCase(connectWebSocket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(connectWebSocket.fulfilled, (state) => {
        state.loading = false;
        state.isWebSocketConnected = true;
      })
      .addCase(connectWebSocket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setDeviceId, setWebSocketStatus, clearError, resetDevice } = deviceSlice.actions;
export default deviceSlice.reducer;