// utils/ApiManager.js - API管理器
class ApiManager {
  constructor() {
    // API基础地址
    const defaultBase = 'https://hushengjihua.online';
    const deprecatedHosts = ['https://animal-rescue-backend-rho.vercel.app', 'https://animal-rescue-backend-rho.vercel.app/'];
    let target = defaultBase;

    if (typeof wx !== 'undefined' && wx.getStorageSync) {
      const override = wx.getStorageSync('backend_base_url_override');
      const stored = wx.getStorageSync('backend_base_url');

      if (override) {
        target = override;
      } else if (stored && !deprecatedHosts.includes(stored)) {
        target = stored;
      }
    }

    this.baseURL = (target || defaultBase).replace(/\/$/, '');

    // 请求超时时间
    this.timeout = 10000;
    
    // 重试配置
    this.retryConfig = {
      maxRetries: 2,
      retryDelay: 1000
    };
  }

  // 基础请求方法
  async request(url, options = {}) {
    const {
      method = 'GET',
      data = null,
      headers = {},
      timeout = this.timeout
    } = options;

    const requestUrl = url.startsWith('http') ? url : this.baseURL + url;
    
    console.log(`[API请求] ${method} ${requestUrl}`);

    return new Promise((resolve, reject) => {
      wx.request({
        url: requestUrl,
        method: method,
        data: data,
        header: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: timeout,
        success: (res) => {
          console.log(`[API响应] ${method} ${url} ${res.statusCode}`, res.data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              success: true,
              data: res.data,
              statusCode: res.statusCode
            });
          } else {
            const errorMsg = res.data?.message || res.data?.error || `HTTP ${res.statusCode}`;
            reject(new Error(`请求失败: ${res.statusCode} - ${errorMsg}`));
          }
        },
        fail: (error) => {
          console.error(`[API错误] ${method} ${requestUrl}`, error);
          reject(new Error(`网络请求失败: ${error.errMsg || '未知错误'}`));
        }
      });
    });
  }

  // 带重试的请求方法
  async requestWithRetry(url, options = {}) {
    let lastError = null;
    
    for (let i = 0; i <= this.retryConfig.maxRetries; i++) {
      try {
        return await this.request(url, options);
      } catch (error) {
        lastError = error;
        
        if (i < this.retryConfig.maxRetries) {
          console.log(`[API重试] ${i + 1}/${this.retryConfig.maxRetries}: ${url}`);
          await this.delay(this.retryConfig.retryDelay);
        }
      }
    }
    
    throw lastError;
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== 论坛相关API ====================

  // 获取论坛帖子列表
  async getForumPosts(params = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'createTime',
      order = 'desc'
    } = params;

    try {
      const result = await this.requestWithRetry('/api/forum', {
        method: 'GET'
      });
      
      return result;
    } catch (error) {
      console.error('获取论坛帖子失败:', error);
      throw error;
    }
  }

  // 创建论坛帖子
  async createForumPost(postData) {
    try {
      const result = await this.requestWithRetry('/api/forum', {
        method: 'POST',
        data: postData
      });
      
      return result;
    } catch (error) {
      console.error('创建论坛帖子失败:', error);
      throw error;
    }
  }

  // 点赞帖子
  async likeForumPost(postId) {
    try {
      const result = await this.requestWithRetry('/api/forum/like', {
        method: 'POST',
        data: { postId }
      });
      
      return result;
    } catch (error) {
      console.error('点赞帖子失败:', error);
      throw error;
    }
  }

  // ==================== 档案相关API ====================

  // 获取档案列表
  async getProfiles(params = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      type = '',
      status = '',
      includeInactive = false
    } = params;

    try {
// 构建查询参数（不使用 URLSearchParams）
const params = {
  page: page.toString(),
  limit: limit.toString(),
  includeInactive: includeInactive.toString()
};

if (search) params.search = search;
if (type) params.type = type;
if (status) params.status = status;

// 手动构建查询字符串
const queryString = Object.keys(params)
  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  .join('&');

const result = await this.request(`/api/profiles?${queryString}`, {
        method: 'GET'
      });
      
      return result;
    } catch (error) {
      console.error('获取档案列表失败:', error);
      throw error;
    }
  }

  // 创建档案
  async createProfile(profileData) {
    try {
      const result = await this.requestWithRetry('/api/profiles', {
        method: 'POST',
        data: profileData
      });
      
      return result;
    } catch (error) {
      console.error('创建档案失败:', error);
      throw error;
    }
  }

  // 更新档案
  async updateProfile(profileId, profileData) {
    try {
      const result = await this.requestWithRetry(`/api/profiles/${profileId}`, {
        method: 'PUT',
        data: profileData
      });
      
      return result;
    } catch (error) {
      console.error('更新档案失败:', error);
      throw error;
    }
  }

  // 删除档案
  async deleteProfile(profileId) {
    try {
      const result = await this.requestWithRetry(`/api/profiles/${profileId}`, {
        method: 'DELETE'
      });
      
      return result;
    } catch (error) {
      console.error('删除档案失败:', error);
      throw error;
    }
  }

  // ==================== 位置相关API ====================

  // 逆地理编码
  async reverseGeocode(latitude, longitude) {
    try {
      const result = await this.requestWithRetry('/api/location', {
        method: 'POST',
        data: {
          latitude,
          longitude
        }
      });
      
      return result;
    } catch (error) {
      console.error('逆地理编码失败', error);
      throw error;
    }
  }

  // ==================== 文件上传API ====================

  // 上传文件
  async uploadFile(filePath, fileName = '') {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: this.baseURL + '/api/upload',
        filePath: filePath,
        name: 'file',
        formData: {
          fileName: fileName
        },
        header: {
          'Content-Type': 'multipart/form-data'
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (res.statusCode === 200 && data.success) {
              resolve({
                success: true,
                data: data.data
              });
            } else {
              reject(new Error(data.message || '文件上传失败'));
            }
          } catch (error) {
            reject(new Error('响应解析失败'));
          }
        },
        fail: (error) => {
          console.error('文件上传失败:', error);
          reject(new Error(error.errMsg || '文件上传失败'));
        }
      });
    });
  }

  // ==================== 健康检查API ====================

  // 健康检查
  async healthCheck() {
    const startTime = Date.now();
    
    try {
      const result = await this.request('/', {
        method: 'GET'
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('健康检查失败', error);
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  // 更新基础地址
  setBaseURL(url) {
    if (!url || typeof url !== "string") {
      return;
    }
    const normalized = url.trim().replace(/\/$/, "");
    if (!normalized) {
      return;
    }
    this.baseURL = normalized;
    if (typeof wx !== "undefined" && wx.setStorageSync) {
      wx.setStorageSync("backend_base_url", normalized);
    }
  }
  // 获取基础地址
  getBaseURL() {
    return this.baseURL;
  }

  // ==================== 测试连接方法 ====================

  async testConnection() {
    try {
      const result = await this.healthCheck();
      return result.success;
    } catch (error) {
      console.error('连接测试失败:', error);
      return false;
    }
  }
}

// 创建单例实例
const apiManager = new ApiManager();

module.exports = apiManager;



