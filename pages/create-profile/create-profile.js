// pages/create-profile/create-profile.js
Page({
  data: {
    animalType: 'cat', // 默认选择猫
    animalTypes: [
      { value: 'cat', label: '猫', emoji: '🐱' },
      { value: 'dog', label: '狗', emoji: '🐕' }
    ],
    name: '',
    location: '',
    description: '',
    images: [],
    isEmergency: false,
    latitude: null,
    longitude: null
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '创建动物档案'
    });
    // 自动获取位置
    this.getAutoLocation();
  },

  onShow() {
    // 设置 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2  // 发现页是第3个，索引为2
      });
    }
  },

  // 自动获取位置
  getAutoLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          location: `纬度:${res.latitude.toFixed(6)}, 经度:${res.longitude.toFixed(6)}`
        });
        wx.showToast({
          title: '定位成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.log('获取位置失败:', err);
        // 如果用户拒绝了位置权限，提示用户
        if (err.errMsg.indexOf('auth deny') !== -1) {
          wx.showModal({
            title: '提示',
            content: '需要获取您的位置信息用于标记动物位置',
            confirmText: '去设置',
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

  // 选择动物类型
  selectAnimalType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      animalType: type
    });
  },

  // 输入名字
  inputName(e) {
    this.setData({
      name: e.detail.value
    });
  },

  // 输入位置
  inputLocation(e) {
    this.setData({
      location: e.detail.value
    });
  },

  // 输入描述
  inputDescription(e) {
    this.setData({
      description: e.detail.value
    });
  },

  // 切换紧急状态
  toggleEmergency() {
    this.setData({
      isEmergency: !this.data.isEmergency
    });
  },

  // 选择图片
  chooseImage() {
    const that = this;
    wx.chooseImage({
      count: 9 - this.data.images.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const images = that.data.images.concat(res.tempFilePaths);
        that.setData({
          images: images
        });
      }
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '提示',
      content: '确定要删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          const images = this.data.images;
          images.splice(index, 1);
          this.setData({ images });
        }
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.images
    });
  },

  // 获取当前位置
  getLocation() {
    const that = this;
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          location: `纬度:${res.latitude.toFixed(6)}, 经度:${res.longitude.toFixed(6)}`
        });
        wx.showToast({
          title: '定位成功',
          icon: 'success'
        });
      },
      fail() {
        wx.showToast({
          title: '定位失败',
          icon: 'none'
        });
      }
    });
  },

  // 提交档案
  submitProfile() {
    const { animalType, name, location, description, images, isEmergency, latitude, longitude } = this.data;
    
    if (!location.trim()) {
      wx.showToast({
        title: '请输入位置',
        icon: 'none'
      });
      return;
    }
    
    if (!description.trim()) {
      wx.showToast({
        title: '请输入描述',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '创建中...',
      mask: true
    });
    
    // 创建档案数据
    const profile = {
      id: 'profile_' + Date.now(),
      animalType,
      name: name || '未命名',
      location,
      latitude,
      longitude,
      description,
      images,
      isEmergency,
      createTime: new Date().toLocaleString(),
      creator: wx.getStorageSync('userInfo')?.nickName || '匿名用户',
      status: 'waiting', // waiting: 待救助, rescued: 已救助, adopted: 已领养
      views: 0,
      likes: 0
    };
    
    // 保存到本地存储
    let profiles = wx.getStorageSync('animal_profiles') || [];
    profiles.unshift(profile);
    wx.setStorageSync('animal_profiles', profiles);
    
    wx.hideLoading();
    
    wx.showToast({
      title: '创建成功',
      icon: 'success',
      duration: 1500
    });
    
    // 重置表单
    setTimeout(() => {
      this.setData({
        animalType: 'cat',
        name: '',
        location: '',
        description: '',
        images: [],
        isEmergency: false
      });
    }, 1500);
  }
});