// pages/publish-forum/publish-forum.js
const app = getApp();

Page({
  data: {
    postType: 'normal', // 帖子类型：normal（普通）或 rescue（救助）
    title: '',
    content: '',
    images: [],
    location: '',
    latitude: null,
    longitude: null,
    isEmergency: false,
    phone: '',
    wechat: '',
    userInfo: null,
    autoLocation: null // 自动获取的位置信息
  },

  onLoad() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
    
    // 自动获取当前位置
    this.getAutoLocation();
  },

  // 自动获取位置
  getAutoLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const { latitude, longitude } = res;
        this.setData({
          latitude,
          longitude
        });
        
        // 逆地理编码获取地址
        this.reverseGeocoding(latitude, longitude);
      },
      fail: (err) => {
        console.log('获取位置失败:', err);
        // 如果用户拒绝了位置权限，提示用户
        if (err.errMsg.indexOf('auth deny') !== -1) {
          wx.showModal({
            title: '提示',
            content: '需要获取您的位置信息用于标记帖子位置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        }
      }
    });
  },

  // 逆地理编码
  reverseGeocoding(latitude, longitude) {
    // 使用腾讯地图API进行逆地理编码
    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      data: {
        location: `${latitude},${longitude}`,
        key: 'YOUR_TENCENT_MAP_KEY' // 需要替换为实际的key
      },
      success: (res) => {
        if (res.data.status === 0) {
          const address = res.data.result.address;
          const formatted = res.data.result.formatted_addresses?.recommend || address;
          this.setData({
            location: formatted,
            autoLocation: {
              address: address,
              formatted: formatted,
              district: res.data.result.address_component.district,
              street: res.data.result.address_component.street
            }
          });
        }
      }
    });
  },

  // 设置帖子类型
  setPostType(e) {
    const type = e.currentTarget.dataset.type;
    if (type === 'normal') {
      // 普通帖子：清除紧急状态和联系方式
      this.setData({
        postType: type,
        isEmergency: false,
        phone: '',
        wechat: ''
      });
    } else {
      // 救助帖：默认设置为紧急
      this.setData({
        postType: type,
        isEmergency: true
      });
    }
  },

  // 设置紧急程度（仅救助帖使用
  setEmergency(e) {
    const value = e.currentTarget.dataset.value === 'true';
    this.setData({
      isEmergency: value
    });
  },

  // 输入标题
  inputTitle(e) {
    this.setData({
      title: e.detail.value
    });
  },

  // 输入内容
  inputContent(e) {
    this.setData({
      content: e.detail.value
    });
  },

  // 输入电话
  inputPhone(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 输入微信
  inputWechat(e) {
    this.setData({
      wechat: e.detail.value
    });
  },

  // 选择图片
  chooseImage() {
    const { images } = this.data;
    
    wx.chooseImage({
      count: 9 - images.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = [...images, ...res.tempFilePaths];
        this.setData({
          images: newImages
        });
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const { index } = e.currentTarget.dataset;
    const { images } = this.data;
    
    wx.previewImage({
      current: images[index],
      urls: images
    });
  },

  // 删除图片
  deleteImage(e) {
    const { index } = e.currentTarget.dataset;
    const { images } = this.data;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除这张图片吗？,
      success: (res) => {
        if (res.confirm) {
          images.splice(index, 1);
          this.setData({ images });
        }
      }
    });
  },

  // 取消
  cancel() {
    wx.showModal({
      title: '提示',
      content: '确定要取消发布吗？已填写的内容将不会保存',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },

  // 提交发布
  async submitPost() {
    const { postType, title, content, images, location, latitude, longitude, isEmergency, phone, wechat, userInfo, autoLocation } = this.data;
    
    // 验证必填项
    if (!title.trim()) {
      wx.showToast({
        title: '请输入标题,
        icon: 'none'
      });
      return;
    }
    
    if (!content.trim()) {
      wx.showToast({
        title: '请输入详细描述,
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '发布中...',
      mask: true
    });
    
    try {
      // 如果有图片，先上传图片
      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = await this.uploadImages(images);
      }
      
      // 构建帖子数据
      const postData = {
        postType: postType, // 帖子类型
        title: title.trim(),
        content: content.trim(),
        images: imageUrls,
        location: location,
        latitude: latitude,
        longitude: longitude,
        district: autoLocation?.district || '', // 区域信息（用于小区论坛筛选）
        author: userInfo ? userInfo.nickName : '匿名用户',
        authorAvatar: userInfo ? userInfo.avatarUrl : '/images/default-avatar.png',
        createTime: new Date().toISOString(),
        likes: 0,
        comments: 0,
        views: 0
      };
      
      // 只有救助帖才添加紧急状态和联系方式
      if (postType === 'rescue') {
        postData.isEmergency = isEmergency;
        postData.phone = phone;
        postData.wechat = wechat;
      }
      
      // 发送到后端
      await this.sendToBackend(postData);
      
      wx.hideLoading();
      wx.showToast({
        title: '发布成功',
        icon: 'success',
        duration: 2000
      });
      
      // 延迟返回，让用户看到成功提示
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      
    } catch (error) {
      console.error('发布失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '发布失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 上传图片
  uploadImages(images) {
    const uploadPromises = images.map(imagePath => {
      return new Promise((resolve, reject) => {
        // 如果使用微信云开发
        if (wx.cloud) {
          const cloudPath = `forum/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
          wx.cloud.uploadFile({
            cloudPath,
            filePath: imagePath,
            success: res => resolve(res.fileID),
            fail: reject
          });
        } else {
          // 使用自建服务器上传
          const apiManager = app.globalData.apiManager;
          const baseURL = apiManager && typeof apiManager.getBaseURL === 'function'
            ? apiManager.getBaseURL()
            : (apiManager && apiManager.baseURL ? apiManager.baseURL : '');
          if (!baseURL) {
            resolve(imagePath);
            return;
          }
          const uploadUrl = `${baseURL}/api/upload`;
          wx.uploadFile({
            url: uploadUrl,
            filePath: imagePath,
            name: "file",
            success: (res) => {
              try {
                const data = JSON.parse(res.data);
                if (data.url) {
                  resolve(data.url);
                } else {
                  resolve(imagePath);
                }
              } catch (e) {
                resolve(imagePath);
              }
            },
            fail: () => {
              resolve(imagePath);
            }
          });
        }
      });
    });

    return Promise.all(uploadPromises);
  },

  // 发送到后端
  async sendToBackend(postData) {
    const response = await app.globalData.apiManager.requestWithRetry('/api/forum', {
      method: 'POST',
      data: postData
    });
    if (!response?.success) {
      throw new Error(response?.data?.message || '发布失败');
    }
    return response.data;
  }
});



