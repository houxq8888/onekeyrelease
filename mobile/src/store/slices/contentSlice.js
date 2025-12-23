import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ContentService } from '../../services/contentService';

// 异步操作：获取内容详情
export const fetchContentDetail = createAsyncThunk(
  'content/fetchContentDetail',
  async (contentId, { rejectWithValue }) => {
    try {
      const response = await ContentService.getContentDetail(contentId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 异步操作：获取内容列表
export const fetchContentList = createAsyncThunk(
  'content/fetchContentList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ContentService.getContentList();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 异步操作：下载内容图片
export const downloadImage = createAsyncThunk(
  'content/downloadImage',
  async ({ contentId, imageUrl }, { rejectWithValue }) => {
    try {
      const response = await ContentService.downloadImage(contentId, imageUrl);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 异步操作：删除内容
export const deleteContent = createAsyncThunk(
  'content/deleteContent',
  async (contentId, { rejectWithValue }) => {
    try {
      const response = await ContentService.deleteContent(contentId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const contentSlice = createSlice({
  name: 'content',
  initialState: {
    currentContent: null,
    contentList: [],
    downloadedImages: {},
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentContent: (state, action) => {
      state.currentContent = action.payload;
    },
    addContent: (state, action) => {
      state.contentList.unshift(action.payload);
    },
    updateContent: (state, action) => {
      const { contentId, updates } = action.payload;
      const contentIndex = state.contentList.findIndex(content => content.contentId === contentId);
      
      if (contentIndex !== -1) {
        state.contentList[contentIndex] = {
          ...state.contentList[contentIndex],
          ...updates,
        };
      }
      
      if (state.currentContent && state.currentContent.contentId === contentId) {
        state.currentContent = {
          ...state.currentContent,
          ...updates,
        };
      }
    },
    markImageDownloaded: (state, action) => {
      const { contentId, imageUrl, localPath } = action.payload;
      if (!state.downloadedImages[contentId]) {
        state.downloadedImages[contentId] = {};
      }
      state.downloadedImages[contentId][imageUrl] = localPath;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetContent: (state) => {
      state.currentContent = null;
      state.contentList = [];
      state.downloadedImages = {};
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取内容详情
      .addCase(getContentDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getContentDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentContent = action.payload;
      })
      .addCase(getContentDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取内容列表
      .addCase(getContentList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getContentList.fulfilled, (state, action) => {
        state.loading = false;
        state.contentList = action.payload;
      })
      .addCase(getContentList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 下载内容图片
      .addCase(downloadContentImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadContentImage.fulfilled, (state, action) => {
        state.loading = false;
        const { contentId, imageUrl, localPath } = action.payload;
        if (!state.downloadedImages[contentId]) {
          state.downloadedImages[contentId] = {};
        }
        state.downloadedImages[contentId][imageUrl] = localPath;
      })
      .addCase(downloadContentImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  setCurrentContent, 
  addContent, 
  updateContent, 
  markImageDownloaded, 
  clearError, 
  resetContent 
} = contentSlice.actions;
export default contentSlice.reducer;