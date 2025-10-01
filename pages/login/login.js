// pages/login/login.js
Page({
  data: {
    canIUseGetUserProfile: false,
    canIUseNicknameInput: false,
    userInfo: {
      nickName: '',
      avatarUrl: '/images/default-avatar.png'
    },
    hasUserInfo: false
  },

  onLoad() {
    // 检查是否支持 getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    // 检查是否已经登录
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.nickName) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
    }
  },

  // 获取用户信息（新版本）
  getUserProfile(e) {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('获取用户信息成功：', res);
        const userInfo = res.userInfo;
        
        // 保存用户信息
        this.saveUserInfo(userInfo);
      },
      fail: (err) => {
        console.error('获取用户信息失败：', err);
        wx.showToast({
          title: '需要授权才能使用',
          icon: 'none'
        });
      }
    });
  },

  // 获取用户信息（兼容旧版本）
  getUserInfo(e) {
    if (e.detail.userInfo) {
      const userInfo = e.detail.userInfo;
      this.saveUserInfo(userInfo);
    } else {
      wx.showToast({
        title: '需要授权才能使用',
        icon: 'none'
      });
    }
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({
      'userInfo.nickName': e.detail.value
    });
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      'userInfo.avatarUrl': avatarUrl
    });
  },

  // 手动输入方式登录
  manualLogin() {
    const { nickName, avatarUrl } = this.data.userInfo;
    
    if (!nickName.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    
    const userInfo = {
      nickName: nickName.trim(),
      avatarUrl: avatarUrl,
      userId: 'user_' + Date.now(),
      loginTime: new Date().toISOString()
    };
    
    this.saveUserInfo(userInfo);
  },

  // 保存用户信息
  saveUserInfo(userInfo) {
    // 添加额外信息
    userInfo.userId = userInfo.userId || 'wx_' + Date.now();
    userInfo.loginTime = new Date().toISOString();
    
    // 保存到本地存储
    wx.setStorageSync('userInfo', userInfo);
    
    // 更新页面数据
    this.setData({
      userInfo: userInfo,
      hasUserInfo: true
    });
    
    // 显示登录成功
    wx.showToast({
      title: '登录成功',
      icon: 'success',
      duration: 1500
    });
    
    // 延迟返回上一页
    setTimeout(() => {
      // 获取页面栈
      const pages = getCurrentPages();
      if (pages.length > 1) {
        // 返回上一页
        wx.navigateBack();
      } else {
        // 如果没有上一页，跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    }, 1500);
  },

  // 快速测试登录（开发用）
  quickTestLogin() {
    const testUserInfo = {
      nickName: '测试用户' + Math.floor(Math.random() * 1000),
      avatarUrl: '/images/default-avatar.png',
      userId: 'test_' + Date.now(),
      loginTime: new Date().toISOString()
    };
    
    this.saveUserInfo(testUserInfo);
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          wx.removeStorageSync('userInfo');
          
          // 重置页面数据
          this.setData({
            userInfo: {
              nickName: '',
              avatarUrl: '/images/default-avatar.png'
            },
            hasUserInfo: false
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});