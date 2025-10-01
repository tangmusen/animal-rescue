// pages/index/index.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    statistics: {
      totalAnimals: 0,
      adoptedCount: 0,
      helpedCount: 0,
      volunteerCount: 0
    },
    recentAnimals: [],
    bannerImages: [
      '/images/banner1.jpg',
      '/images/banner2.jpg',
      '/images/banner3.jpg'
    ]
  },

  onLoad() {
    this.getUserInfo();
    this.loadStatistics();
    this.loadRecentAnimals();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadStatistics();
    this.loadRecentAnimals();
  },

  // 获取用户信息
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
    }
  },

  // 加载统计数据
  async loadStatistics() {
    try {
      const response = await app.globalData.apiManager.requestWithRetry('/api/profiles?pageSize=1');
      if (response?.success && response.data?.stats) {
        this.setData({
          statistics: response.data.stats
        });
      }
    } catch (error) {
      console.log('加载统计数据失败', error);
    }
  },

  // 加载最近的动物
  async loadRecentAnimals() {
    try {
      const response = await app.globalData.apiManager.requestWithRetry('/api/profiles?pageSize=6');
      const animals = response?.data?.data;
      if (response?.success && Array.isArray(animals)) {
        this.setData({
          recentAnimals: animals.slice(0, 6)
        });
      }
      if (response?.data?.stats) {
        this.setData({
          statistics: response.data.stats
        });
      }
    } catch (error) {
      console.log('加载动物数据失败', error);
    }
  },
  // 智能识别动物（跳转到创建档案页面）
  goToRecognize() {
    wx.switchTab({
      url: '/pages/create-profile/create-profile'
    });
  },

  // 跳转到智能识别（同样的功能，以防wxml中用的是这个名字）
  goToIdentify() {
    wx.switchTab({
      url: '/pages/create-profile/create-profile'
    });
  },

  // 跳转到地图
  goToMap() {
    wx.switchTab({
      url: '/pages/map/map'
    });
  },

  // 跳转到论坛
  goToForum() {
    wx.switchTab({
      url: '/pages/forum/forum'
    });
  },

  // 跳转到我的档案
  goToMyProfiles() {
    wx.navigateTo({
      url: '/pages/my-profiles/my-profiles'
    });
  },

  // 查看动物详情
  viewAnimalDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/animal-detail/animal-detail?id=${id}`
    });
  },

  // 紧急救助
  emergencyHelp() {
    wx.makePhoneCall({
      phoneNumber: '110',
      fail: () => {
        wx.showModal({
          title: '紧急救助',
          content: '紧急情况请拨打110或联系当地动物救助站',
          showCancel: false
        });
      }
    });
  },

  // 快速发布
  quickPublish() {
    wx.switchTab({
      url: '/pages/forum/forum'
    });
  },

  // 查看所有动物
  viewAllAnimals() {
    wx.navigateTo({
      url: '/pages/animal-list/animal-list'
    });
  },

  // 登录
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        wx.setStorageSync('userInfo', res.userInfo);
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadStatistics();
    this.loadRecentAnimals();
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '护生小程序 - 一起帮助流浪动物',
      path: '/pages/index/index',
      imageUrl: '/images/share.jpg'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '护生小程序 - 一起帮助流浪动物',
      query: '',
      imageUrl: '/images/share.jpg'
    };
  }
});