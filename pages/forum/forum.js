// pages/forum/forum.js
Page({
  data: {
    posts: [
      {
        id: '1',
        title: '发现一只受伤的小猫',
        content: '在小区花园发现一只受伤的小猫，需要救助',
        author: '热心市民',
        authorAvatar: '/images/default-avatar.png',
        createTime: '2024-01-20 10:30',
        isEmergency: true,
        likes: 5,
        comments: 3,
        images: []
      },
      {
        id: '2',
        title: '寻找走失的狗狗',
        content: '我家狗狗昨天走失了，棕色泰迪，脖子上有蓝色项圈',
        author: '狗狗主人',
        authorAvatar: '/images/default-avatar.png',
        createTime: '2024-01-20 09:15',
        isEmergency: false,
        likes: 12,
        comments: 8,
        images: []
      },
      {
        id: '3',
        title: '流浪猫喂养点建议',
        content: '想在小区建立流浪猫喂养点，大家有什么建议吗？',
        author: '猫咪义工',
        authorAvatar: '/images/default-avatar.png',
        createTime: '2024-01-19 15:20',
        isEmergency: false,
        likes: 28,
        comments: 15,
        images: []
      }
    ],
    loading: false,
    userInfo: null,
    currentTab: 'all'
  },

  onLoad() {
    console.log('论坛页面加载');
    this.getUserInfo();
    this.loadPosts();
  },

  onShow() {
    console.log('论坛页面显示');
    // 设置自定义tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
    // 重新加载帖子（从发布页面返回时刷新）
    this.loadPosts();
  },

  // 获取用户信息
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    } else {
      // 直接设置默认用户
      const defaultUser = {
        nickName: '访客用户',
        avatarUrl: '/images/default-avatar.png',
        userId: 'visitor_' + Date.now()
      };
      this.setData({ userInfo: defaultUser });
      wx.setStorageSync('userInfo', defaultUser);
    }
  },

  // 点击发布按钮 - 跳转到发布页面
  goToPublish() {
    console.log('跳转到发布页面');
    
    // 跳转到 publish-forum 页面
    wx.navigateTo({
      url: '/pages/publish-forum/publish-forum',
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 切换分类标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    console.log('切换到标签：', tab);
    
    this.setData({
      currentTab: tab
    });
    
    wx.showToast({
      title: tab === 'all' ? '所有论坛' : tab === 'nearby' ? '附近论坛' : '小区论坛',
      icon: 'none'
    });
  },

  // 分享帖子
  sharePost(e) {
    const postId = e.currentTarget.dataset.id;
    console.log('分享帖子：', postId);
    
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    });
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    const urls = e.currentTarget.dataset.urls;
    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  // 点赞帖子（纯本地）
  likePost(e) {
    const postId = e.currentTarget.dataset.id;
    const posts = this.data.posts;
    const postIndex = posts.findIndex(p => p.id === postId);
    
    if (postIndex === -1) return;
    
    // 更新点赞数
    posts[postIndex].likes = (posts[postIndex].likes || 0) + 1;
    posts[postIndex].isLiked = true;
    
    this.setData({ posts });
    wx.setStorageSync('forum_posts', posts);
    
    wx.showToast({
      title: '点赞成功',
      icon: 'success',
      duration: 1000
    });
  },

  // 查看帖子详情
  viewPost(e) {
    const postId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/forum-detail/forum-detail?id=${postId}`,
      fail: () => {
        wx.showToast({
          title: '详情页开发中',
          icon: 'none'
        });
      }
    });
  },

  // 加载帖子（从本地）
  loadPosts() {
    const savedPosts = wx.getStorageSync('forum_posts');
    if (savedPosts && savedPosts.length > 0) {
      this.setData({ posts: savedPosts });
    }
    // 如果没有保存的数据，使用 data 中的默认数据
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadPosts();
    setTimeout(() => {
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '已刷新',
        icon: 'success'
      });
    }, 1000);
  }
});