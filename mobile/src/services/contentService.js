import axios from 'axios';
import * as FileSystem from 'expo-file-system';

const API_BASE_URL = 'http://localhost:3000/api/v1';

class ContentService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
    });
  }

  // 获取内容详情
  async getContentDetail(contentId) {
    try {
      const response = await this.api.get(`/mobile/content/detail/${contentId}`);
      return response;
    } catch (error) {
      console.error('获取内容详情失败:', error);
      throw error;
    }
  }

  // 获取内容列表
  async getContentList(deviceId) {
    try {
      const response = await this.api.get(`/mobile/content/list/${deviceId}`);
      return response;
    } catch (error) {
      console.error('获取内容列表失败:', error);
      throw error;
    }
  }

  // 下载图片到本地
  async downloadImage(contentId, imageUrl) {
    try {
      // 创建本地目录
      const contentDir = `${FileSystem.documentDirectory}content/${contentId}/`;
      await FileSystem.makeDirectoryAsync(contentDir, { intermediates: true });

      // 生成文件名
      const fileName = imageUrl.split('/').pop() || `image_${Date.now()}.jpg`;
      const localPath = `${contentDir}${fileName}`;

      // 下载图片
      const downloadResult = await FileSystem.downloadAsync(imageUrl, localPath);

      if (downloadResult.status === 200) {
        return {
          data: {
            contentId,
            imageUrl,
            localPath: downloadResult.uri,
            fileSize: downloadResult.headers['content-length'],
          }
        };
      } else {
        throw new Error(`下载失败: ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('下载图片失败:', error);
      throw error;
    }
  }

  // 分享内容
  async shareContent(contentId, platform) {
    try {
      const response = await this.api.post('/mobile/content/share', {
        contentId,
        platform,
      });
      return response;
    } catch (error) {
      console.error('分享内容失败:', error);
      throw error;
    }
  }

  // 删除内容
  async deleteContent(contentId) {
    try {
      const response = await this.api.delete(`/mobile/content/delete/${contentId}`);
      return response;
    } catch (error) {
      console.error('删除内容失败:', error);
      throw error;
    }
  }

  // 导出内容
  async exportContent(contentId, format = 'json') {
    try {
      const response = await this.api.get(`/mobile/content/export/${contentId}`, {
        params: { format },
      });
      return response;
    } catch (error) {
      console.error('导出内容失败:', error);
      throw error;
    }
  }

  // 获取内容统计
  async getContentStats(deviceId) {
    try {
      const response = await this.api.get(`/mobile/content/stats/${deviceId}`);
      return response;
    } catch (error) {
      console.error('获取内容统计失败:', error);
      throw error;
    }
  }

  // 删除内容
  static async deleteContent(contentId) {
    try {
      const response = await axios.delete(`${this.baseURL}/contents/${contentId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export const contentService = new ContentService();
export { ContentService };