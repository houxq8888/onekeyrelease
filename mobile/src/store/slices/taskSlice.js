import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { TaskService } from '../../services/taskService';

// 异步操作
export const sendCommand = createAsyncThunk(
  'task/sendCommand',
  async (commandData, { rejectWithValue }) => {
    try {
      const response = await TaskService.sendCommand(commandData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchTaskStatus = createAsyncThunk(
  'task/fetchTaskStatus',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await TaskService.getTaskStatus(taskId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchTaskList = createAsyncThunk(
  'task/fetchTaskList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await TaskService.getTaskList();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const cancelTask = createAsyncThunk(
  'task/cancelTask',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await TaskService.cancelTask(taskId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const retryTask = createAsyncThunk(
  'task/retryTask',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await TaskService.retryTask(taskId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const taskSlice = createSlice({
  name: 'task',
  initialState: {
    currentTask: null,
    taskList: [],
    loading: false,
    error: null,
    lastCommand: null,
  },
  reducers: {
    setCurrentTask: (state, action) => {
      state.currentTask = action.payload;
    },
    updateTaskStatus: (state, action) => {
      const { taskId, status, progress, content } = action.payload;
      const taskIndex = state.taskList.findIndex(task => task.taskId === taskId);
      
      if (taskIndex !== -1) {
        state.taskList[taskIndex] = {
          ...state.taskList[taskIndex],
          status,
          progress: progress || state.taskList[taskIndex].progress,
          content: content || state.taskList[taskIndex].content,
        };
      }
      
      if (state.currentTask && state.currentTask.taskId === taskId) {
        state.currentTask = {
          ...state.currentTask,
          status,
          progress: progress || state.currentTask.progress,
          content: content || state.currentTask.content,
        };
      }
    },
    addTask: (state, action) => {
      state.taskList.unshift(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    resetTasks: (state) => {
      state.currentTask = null;
      state.taskList = [];
      state.loading = false;
      state.error = null;
      state.lastCommand = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 发送指令
      .addCase(sendCommand.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendCommand.fulfilled, (state, action) => {
        state.loading = false;
        state.lastCommand = action.payload;
        state.currentTask = action.payload;
        state.taskList.unshift(action.payload);
      })
      .addCase(sendCommand.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 查询任务状态
      .addCase(getTaskStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTaskStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTask = action.payload;
      })
      .addCase(getTaskStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取任务列表
      .addCase(getTaskList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTaskList.fulfilled, (state, action) => {
        state.loading = false;
        state.taskList = action.payload;
      })
      .addCase(getTaskList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentTask, updateTaskStatus, addTask, clearError, resetTasks } = taskSlice.actions;
export default taskSlice.reducer;