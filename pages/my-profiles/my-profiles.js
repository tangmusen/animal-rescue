// pages/my-profiles/my-profiles.js
Page({
  data: {
    myProfiles: [],
    backendProfiles: [],
    cloudProfiles: [],
    loading: true,
    refreshing: false,
    showDeleteModal: false,
    deleteProfileId: '',
    deleteProfileName: '',
    totalProfiles: 0,
    waitingProfiles: 0,
    adoptedProfiles: 0,
    backendConnected: false,
    showSyncButton: false,
    syncProgress: 0
  },

  async onLoad() {
    await this.loadProfiles();
  },

  async onShow() {
    // 每次显示页面时都重新加载，以确保数据是最新的
    await this.loadProfiles();
  },

  // 加载档案（完整前后端联动版本）
  async loadProfiles() {
    try {
      this.setData({ loading: true, refreshing: false });
      
      const app = getApp();
      
      // 确保myAnimalProfiles已初始化
      if (!app.globalData.myAnimalProfiles) {
        app.globalData.myAnimalProfiles = [];
      }
      
      // 加载本地档案
      const myProfiles = app.globalData.myAnimalProfiles || [];
      
      // 获取后端连接状态
      const backendConnected = app.globalData.backendConnected;
      
      let backendProfiles = [];
      let cloudProfiles = [];
      
      // 如果后端连接正常，加载后端数据
      if (backendConnected) {
        try {
          const backendResult = await app.globalData.apiManager.getProfiles({
            page: 1,
            limit: 50
          });
          
          if (backendResult && backendResult.success && backendResult.data && backendResult.data.profiles) {
            backendProfiles = backendResult.data.profiles;
            app.globalData.backendProfiles = backendProfiles;
            console.log('成功从后端加载档案:', backendProfiles.length, '条');
          }
        } catch (error) {
          console.log('后端档案加载失败:', error.message);
          // 尝试重新连接后端
          setTimeout(() => {
            app.initBackendConnection();
          }, 2000);
        }
      } else {
        console.log('后端未连接，使用缓存数据');
        backendProfiles = app.globalData.backendProfiles || [];
      }
      
      // 加载云端数据（如果可用）
      try {
        cloudProfiles = app.globalData.cloudCatProfiles || [];
      } catch (error) {
        console.log('云端数据获取失败:', error);
      }
      
      // 合并所有档案数据
      const allProfiles = [...backendProfiles, ...cloudProfiles, ...myProfiles];
      
      // 去重（基于ID）
      const uniqueProfiles = this.deduplicateProfiles(allProfiles);
      
      // 计算统计数据
      const totalProfiles = uniqueProfiles.length;
      const waitingProfiles = uniqueProfiles.filter(p => p.currentStatus === '等待领养').length;
      const adoptedProfiles = uniqueProfiles.filter(p => p.currentStatus === '已被领养').length;
      
      // 检查是否需要显示同步按钮
      const showSyncButton = backendConnected && myProfiles.some(p => !p.backendId);
      
      this.setData({
        myProfiles: myProfiles,
        backendProfiles: backendProfiles,
        cloudProfiles: cloudProfiles,
        loading: false,
        refreshing: false,
        totalProfiles: totalProfiles,
        waitingProfiles: waitingProfiles,
        adoptedProfiles: adoptedProfiles,
        backendConnected: backendConnected,
        showSyncButton: showSyncButton
      });
      
    } catch (error) {
      console.error('加载档案失败:', error);
      this.setData({ 
        loading: false,
        refreshing: false,
        myProfiles: [],
        backendProfiles: [],
        cloudProfiles: []
      });
    }
  },

  // 去重档案（避免重复显示）
  deduplicateProfiles(profiles) {
    const seen = new Set();
    return profiles.filter(profile => {
      const key = profile.id || profile._id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  },

  // 手动刷新数据
  async refreshData() {
    this.setData({ refreshing: true });
    
    const app = getApp();
    
    // 重新检查后端连接并加载数据
    await app.refreshBackendData();
    
    // 重新加载页面数据
    await this.loadProfiles();
  },

  // 同步本地数据到后端
  async syncToBackend() {
    const app = getApp();
    
    if (!app.globalData.backendConnected) {
      wx.showToast({
        title: '后端未连接，无法同步',
        icon: 'none'
      });
      return;
    }
    
    const unsyncedProfiles = this.data.myProfiles.filter(p => !p.backendId);
    
    if (unsyncedProfiles.length === 0) {
      wx.showToast({
        title: '所有数据已同步',
        icon: 'success'
      });
      return;
    }
    
    try {
      wx.showLoading({ title: '同步中...' });
      
      const syncResults = await app.globalData.apiManager.syncLocalData(unsyncedProfiles);
      
      wx.hideLoading();
      
      if (syncResults.profiles.success > 0) {
        wx.showToast({
          title: `成功同步${syncResults.profiles.success}条档案`,
          icon: 'success'
        });
        
        // 刷新数据
        await this.loadProfiles();
      } else {
        wx.showModal({
          title: '同步失败',
          content: `同步失败: ${syncResults.errors.join('\n')}`,
          showCancel: false
        });
      }
      
    } catch (error) {
      wx.hideLoading();
      console.error('同步失败:', error);
      wx.showToast({
        title: '同步失败: ' + error.message,
        icon: 'none'
      });
    }
  },

  // 查看档案详情
  viewProfile(e) {
    const profileId = e.currentTarget.dataset.id;
    const profileType = e.currentTarget.dataset.type || 'local';
    
    wx.navigateTo({
      url: `/pages/animal-detail/animal-detail?id=${profileId}&type=${profileType}`
    });
  },

  // 编辑档案
  editProfile(e) {
    e.stopPropagation();
    const profileId = e.currentTarget.dataset.id;
    const profileType = e.currentTarget.dataset.type || 'local';
    
    wx.navigateTo({
      url: `/pages/create-profile/create-profile?mode=edit&id=${profileId}&type=${profileType}`
    });
  },

  // 确认删除
  confirmDelete(e) {
    e.stopPropagation();
    const profileId = e.currentTarget.dataset.id;
    const profileName = e.currentTarget.dataset.name;
    const profileType = e.currentTarget.dataset.type || 'local';
    
    // 只允许删除本地创建的档案
    if (profileType !== 'local') {
      wx.showToast({
        title: '只能删除自己创建的档案',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      showDeleteModal: true,
      deleteProfileId: profileId,
      deleteProfileName: profileName
    });
  },

  // 取消删除
  cancelDelete() {
    this.setData({
      showDeleteModal: false,
      deleteProfileId: '',
      deleteProfileName: ''
    });
  },

  // 确认删除档案
  async confirmDeleteProfile() {
    try {
      wx.showLoading({ title: '删除中...' });
      
      const app = getApp();
      const success = await app.deleteMyProfile(this.data.deleteProfileId);
      
      wx.hideLoading();
      
      if (success) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        
        // 重新加载数据
        await this.loadProfiles();
      } else {
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        });
      }
      
    } catch (error) {
      wx.hideLoading();
      console.error('删除失败:', error);
      wx.showToast({
        title: '删除失败: ' + error.message,
        icon: 'none'
      });
    }
    
    this.cancelDelete();
  },

  // 创建新档案
  createNewProfile() {
    wx.navigateTo({
      url: '/pages/create-profile/create-profile'
    });
  },

  // 搜索档案
  async searchProfiles(e) {
    const searchText = e.detail.value.trim();
    
    if (!searchText) {
      await this.loadProfiles();
      return;
    }
    
    try {
      this.setData({ loading: true });
      
      const app = getApp();
      
      // 本地搜索
      const localResults = this.data.myProfiles.filter(profile => 
        profile.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (profile.rescueLocation && profile.rescueLocation.toLowerCase().includes(searchText.toLowerCase()))
      );
      
      // 后端搜索（如果连接）
      let backendResults = [];
      if (app.globalData.backendConnected) {
        try {
          const searchResult = await app.globalData.apiManager.searchProfiles({
            search: searchText,
            limit: 20
          });
          
          if (searchResult.success && searchResult.data && searchResult.data.profiles) {
            backendResults = searchResult.data.profiles;
          }
        } catch (error) {
          console.log('后端搜索失败:', error);
        }
      }
      
      // 合并搜索结果
      const allResults = [...backendResults, ...localResults];
      const uniqueResults = this.deduplicateProfiles(allResults);
      
      this.setData({
        myProfiles: localResults,
        backendProfiles: backendResults,
        totalProfiles: uniqueResults.length,
        loading: false
      });
      
    } catch (error) {
      console.error('搜索失败:', error);
      this.setData({ loading: false });
    }
  },

  // 按类型筛选
  filterByType(e) {
    const type = e.currentTarget.dataset.type;
    
    if (type === 'all') {
      this.loadProfiles();
      return;
    }
    
    const filteredMyProfiles = this.data.myProfiles.filter(p => p.type === type);
    const filteredBackendProfiles = this.data.backendProfiles.filter(p => p.type === type);
    
    this.setData({
      myProfiles: filteredMyProfiles,
      backendProfiles: filteredBackendProfiles,
      totalProfiles: filteredMyProfiles.length + filteredBackendProfiles.length
    });
  },

  // 按状态筛选
  filterByStatus(e) {
    const status = e.currentTarget.dataset.status;
    
    if (status === 'all') {
      this.loadProfiles();
      return;
    }
    
    const filteredMyProfiles = this.data.myProfiles.filter(p => p.currentStatus === status);
    const filteredBackendProfiles = this.data.backendProfiles.filter(p => p.currentStatus === status);
    
    this.setData({
      myProfiles: filteredMyProfiles,
      backendProfiles: filteredBackendProfiles,
      totalProfiles: filteredMyProfiles.length + filteredBackendProfiles.length
    });
  },

  // 查看连接状态
  viewConnectionStatus() {
    const app = getApp();
    const stats = app.getProfileStatistics();
    
    const content = `后端连接: ${stats.backendConnected ? '✅ 已连接' : '❌ 未连接'}
    
数据源统计:
• 后端档案: ${stats.backendCount}条
• 云端档案: ${stats.cloudCount}条  
• 本地档案: ${stats.localCount}条
• 总计: ${stats.total}条`;
    
    wx.showModal({
      title: '连接状态',
      content: content,
      showCancel: false
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多
  async onReachBottom() {
    // 实现分页加载逻辑
    const app = getApp();
    
    if (!app.globalData.backendConnected) {
      return;
    }
    
    try {
      const currentPage = Math.floor(this.data.backendProfiles.length / 20) + 1;
      
      const result = await app.globalData.apiManager.getProfiles({
        page: currentPage + 1,
        limit: 20
      });
      
      if (result.success && result.data && result.data.profiles.length > 0) {
        const newProfiles = [...this.data.backendProfiles, ...result.data.profiles];
        
        this.setData({
          backendProfiles: newProfiles,
          totalProfiles: this.data.myProfiles.length + newProfiles.length + this.data.cloudProfiles.length
        });
      }
      
    } catch (error) {
      console.error('加载更多失败:', error);
    }
  }
});