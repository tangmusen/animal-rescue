// pages/profile/profile.js
Page({
  data: {
    userInfo: {
      nickname: '微信用户',
      avatar: '/images/avatar.png',
      level: 1,
      levelText: '爱心人士',
      points: 0,
      profilesCount: 0,
      tasksCompleted: 0,
      openid: '',
      createTime: '',
      lastLoginTime: ''
    },
    badges: [
      { id: 1, icon: '🏆', name: '新手上路', active: true, desc: '完成首次建档' },
      { id: 2, icon: '⭐', name: '爱心大使', active: true, desc: '救助5只动物' },
      { id: 3, icon: '❤️', name: '领养达人', active: false, desc: '成功领养3只' },
      { id: 4, icon: '📷', name: '摄影达人', active: false, desc: '上传50张照片' }
    ],
    statistics: {
      totalRescued: 0,
      thisMonthRescued: 0,
      totalPhotos: 0,
      helpedCount: 0
    }
  },

  onLoad() {
    this.loadUserData();
    this.loadStatistics();
    this.checkNewBadges();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadUserData();
    this.loadStatistics();
  },

  // 加载用户数据
  loadUserData() {
    // 先从缓存读取
    let userInfo = wx.getStorageSync('userInfo');
    
    // 如果没有缓存，获取微信用户信息
    if (!userInfo || !userInfo.openid) {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          userInfo = {
            ...this.data.userInfo,
            nickname: res.userInfo.nickName,
            avatar: res.userInfo.avatarUrl,
            createTime: new Date().toISOString(),
            lastLoginTime: new Date().toISOString()
          };
          this.setData({ userInfo });
          wx.setStorageSync('userInfo', userInfo);
        },
        fail: () => {
          // 用户拒绝授权，使用默认信息
          console.log('用户拒绝授权');
        }
      });
    } else {
      // 更新最后登录时间
      userInfo.lastLoginTime = new Date().toISOString();
      this.setData({ userInfo });
      wx.setStorageSync('userInfo', userInfo);
    }

    // 加载我的档案数量
    this.loadMyProfilesCount();
  },

  // 加载我的档案数量
  loadMyProfilesCount() {
    const profiles = wx.getStorageSync('my_profiles') || [];
    const userInfo = this.data.userInfo;
    userInfo.profilesCount = profiles.length;
    this.setData({ userInfo });
  },

  // 加载统计数据
  loadStatistics() {
    const profiles = wx.getStorageSync('my_profiles') || [];
    const currentMonth = new Date().getMonth();
    
    let thisMonthCount = 0;
    profiles.forEach(profile => {
      if (profile.createTime) {
        const createMonth = new Date(profile.createTime).getMonth();
        if (createMonth === currentMonth) {
          thisMonthCount++;
        }
      }
    });

    const statistics = {
      totalRescued: profiles.length,
      thisMonthRescued: thisMonthCount,
      totalPhotos: profiles.reduce((sum, p) => sum + (p.images ? p.images.length : 0), 0),
      helpedCount: profiles.filter(p => p.status === '已领养').length
    };

    this.setData({ statistics });
  },

  // 检查新勋章
  checkNewBadges() {
    const badges = this.data.badges;
    const stats = this.data.statistics;
    const profiles = wx.getStorageSync('my_profiles') || [];

    // 检查是否获得新勋章
    badges.forEach(badge => {
      switch(badge.name) {
        case '新手上路':
          badge.active = profiles.length > 0;
          break;
        case '爱心大使':
          badge.active = profiles.length >= 5;
          break;
        case '领养达人':
          badge.active = stats.helpedCount >= 3;
          break;
        case '摄影达人':
          badge.active = stats.totalPhotos >= 50;
          break;
      }
    });

    this.setData({ badges });
  },

  // 跳转到我的档案
  goToMyProfiles() {
    wx.navigateTo({
      url: '/pages/my-profiles/my-profiles'
    });
  },

  // 跳转到我的任务
  goToMyTasks() {
    // 检查是否有任务页面
    wx.navigateTo({
      url: '/pages/tasks/tasks',
      fail: () => {
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到积分商城
  goToShop() {
    wx.navigateTo({
      url: '/pages/shop/shop',
      fail: () => {
        wx.showModal({
          title: '积分商城',
          content: '积分商城即将开放，敬请期待！\n\n当前积分：' + this.data.userInfo.points,
          showCancel: false
        });
      }
    });
  },

  // 数据统计
  goToStatistics() {
    const stats = this.data.statistics;
    wx.showModal({
      title: '我的数据统计',
      content: `总救助数：${stats.totalRescued}只\n本月救助：${stats.thisMonthRescued}只\n上传照片：${stats.totalPhotos}张\n成功领养：${stats.helpedCount}只\n\n获得积分：${this.data.userInfo.points}分\n完成任务：${this.data.userInfo.tasksCompleted}个`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 设置
  goToSettings() {
    const itemList = ['个人信息', '通知设置', '隐私设置', '清除缓存', '关于我们', '退出登录'];
    
    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        switch(res.tapIndex) {
          case 0:
            this.editUserInfo();
            break;
          case 1:
            this.notificationSettings();
            break;
          case 2:
            this.privacySettings();
            break;
          case 3:
            this.clearCache();
            break;
          case 4:
            this.showAbout();
            break;
          case 5:
            this.logout();
            break;
        }
      }
    });
  },

  // 编辑个人信息
  editUserInfo() {
    wx.showActionSheet({
      itemList: ['修改昵称', '更换头像'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 修改昵称
          wx.showModal({
            title: '修改昵称',
            editable: true,
            placeholderText: this.data.userInfo.nickname,
            success: (res) => {
              if (res.confirm && res.content) {
                const userInfo = this.data.userInfo;
                userInfo.nickname = res.content;
                this.setData({ userInfo });
                wx.setStorageSync('userInfo', userInfo);
                wx.showToast({
                  title: '修改成功',
                  icon: 'success'
                });
              }
            }
          });
        } else if (res.tapIndex === 1) {
          // 更换头像
          wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: (res) => {
              const userInfo = this.data.userInfo;
              userInfo.avatar = res.tempFilePaths[0];
              this.setData({ userInfo });
              wx.setStorageSync('userInfo', userInfo);
              wx.showToast({
                title: '更换成功',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  // 通知设置
  notificationSettings() {
    wx.showModal({
      title: '通知设置',
      content: '是否接收救助消息推送？',
      success: (res) => {
        if (res.confirm) {
          wx.requestSubscribeMessage({
            tmplIds: ['your-template-id'],
            success: () => {
              wx.showToast({
                title: '订阅成功',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  // 隐私设置
  privacySettings() {
    wx.showActionSheet({
      itemList: ['公开我的档案', '仅好友可见', '完全私密'],
      success: (res) => {
        const settings = ['public', 'friends', 'private'];
        wx.setStorageSync('privacySetting', settings[res.tapIndex]);
        wx.showToast({
          title: '设置成功',
          icon: 'success'
        });
      }
    });
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '清除缓存将删除所有本地数据，但不影响云端数据。确定要继续吗？',
      success: (res) => {
        if (res.confirm) {
          // 保留用户基本信息
          const userInfo = this.data.userInfo;
          wx.clearStorageSync();
          wx.setStorageSync('userInfo', userInfo);
          
          wx.showToast({
            title: '缓存已清除',
            icon: 'success'
          });
          
          // 重新加载数据
          this.onLoad();
        }
      }
    });
  },

  // 关于我们
  showAbout() {
    wx.navigateTo({
      url: '/pages/about/about',
      fail: () => {
        wx.showModal({
          title: '关于护生小程序',
          content: '版本：1.0.0\n更新时间：2024-01-01\n\n护生小程序致力于帮助流浪动物，建立救助网络。\n\n联系方式：\n邮箱：support@husheng.com\n\n感谢您的使用和支持！',
          showCancel: false,
          confirmText: '知道了'
        });
      }
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '退出登录将清除所有本地数据，确定要退出吗？',
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.reLaunch({
            url: '/pages/index/index'
          });
        }
      }
    });
  },

  // 查看勋章详情
  viewBadgeDetail(e) {
    const index = e.currentTarget.dataset.index;
    const badge = this.data.badges[index];
    wx.showModal({
      title: badge.name,
      content: badge.desc + (badge.active ? '\n\n已获得此勋章！' : '\n\n继续努力，即可获得此勋章！'),
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '护生小程序 - 一起关爱流浪动物',
      path: '/pages/index/index',
      imageUrl: '/images/share.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '护生小程序 - 一起关爱流浪动物',
      imageUrl: '/images/share.png'
    };
  }
});