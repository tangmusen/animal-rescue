// 引入核心管理器
const LocationManager = require('./utils/LocationManager');
const ApiManager = require('./utils/ApiManager');
const RoleManager = require('./utils/RoleManager');

App({
  globalData: {
    userInfo: null,
    userPoints: 2880,
    userLevel: 3,

    // 位置相关数据
    userLocation: null,
    locationManager: LocationManager,

    // 云数据库配置
    cloudEnv: 'cloud1-9gkwqyphff2c9bfa',
    catCollection: 'cat_profiles',

    // 云端缓存
    cloudCatProfiles: [],
    lastSyncTime: null,

    // 本地创建的档案
    myAnimalProfiles: [],

    // 后端缓存
    backendProfiles: [],
    backendProfilesPagination: null,

    // 示例任务
    tasks: [
      {
        id: 1,
        title: '救助小区流浪猫',
        description: '发现一只受伤的橘猫需要救治',
        location: '海和院小区',
        status: '进行中',
        progress: 75,
        points: 150,
        deadline: '2025-08-25',
        priority: 'high'
      },
      {
        id: 2,
        title: '协助动物领养',
        description: '帮助小黑找到合适的领养家庭',
        location: '动物收容所',
        status: '进行中',
        progress: 30,
        points: 100,
        deadline: '2025-08-30',
        priority: 'medium'
      }
    ],

    // 论坛缓存
    forumPosts: [],
    forumPagination: null,

    // 管理器实例
    apiManager: ApiManager,
    roleManager: RoleManager,

    // 后端连接状态
    backendConnected: false
  },

  onLaunch() {
    console.log('🚀 应用启动，开始初始化...');

    // 1. 初始化角色管理器
    this.initRoleManager();

    // 2. 初始化云数据库
    this.initCloudDatabase();

    // 3. 初始化基础数据
    this.initData();
    this.loadMyProfiles();

    // 4. 初始化位置功能
    this.initUserLocation();

    // 5. 延迟尝试连接后端
    setTimeout(() => {
      this.initBackendConnection();
    }, 1000);
  },

  // 初始化角色管理器
  initRoleManager() {
    try {
      if (this.globalData.roleManager) {
        this.globalData.roleManager.init();
        console.log('✅ 角色管理系统初始化完成', {
          currentRole: this.globalData.roleManager.getCurrentRole(),
          roleInfo: this.globalData.roleManager.getRoleInfo()
        });
      }
    } catch (error) {
      console.error('❌ 角色管理系统初始化失败', error);
    }
  },

  // 初始化云开发
  initCloudDatabase() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    try {
      wx.cloud.init({
        env: this.globalData.cloudEnv,
        traceUser: true,
      });
      console.log('☁️ 云开发初始化完成');

      // 立即预加载云端档案
      this.loadCloudProfiles();
    } catch (error) {
      console.error('❌ 云开发初始化失败:', error);
    }
  },

  // 初始化后端连接
  async initBackendConnection() {
    console.log('🔗 正在连接后端 API...');

    try {
      const healthCheck = await this.globalData.apiManager.healthCheck();

      if (healthCheck.success) {
        this.globalData.backendConnected = true;
        console.log('✅ 后端连接成功', {
          responseTime: `${healthCheck.responseTime}ms`,
          timestamp: new Date().toISOString()
        });

        await this.loadAllBackendData();
      } else {
        throw new Error('后端健康检查失败');
      }
    } catch (error) {
      this.globalData.backendConnected = false;
      console.warn('⚠️ 后端连接失败，使用本地模式', error.message || error);
    }
  },

  // 加载全部后端数据
  async loadAllBackendData() {
    console.log('🔥 开始加载后端数据...');
    try {
      const [profilesResult, forumResult] = await Promise.allSettled([
        this.loadBackendProfiles(),
        this.loadBackendForum()
      ]);

      console.log('📊 后端数据加载完成', {
        profiles: profilesResult.status === 'fulfilled' ? '成功' : '失败',
        forum: forumResult.status === 'fulfilled' ? '成功' : '失败'
      });
    } catch (error) {
      console.error('❌ 后端数据加载失败:', error);
    }
  },

  // 加载后端档案数据
  async loadBackendProfiles() {
    const result = await this.globalData.apiManager.getProfiles({
      page: 1,
      limit: 100,
      includeInactive: false
    });

    if (result.success && result.data) {
      const profiles = Array.isArray(result.data.profiles) ? result.data.profiles : [];
      this.globalData.backendProfiles = profiles;
      this.globalData.backendProfilesPagination = result.data.pagination || null;
      console.log(`📦 后端档案加载成功: ${profiles.length} 条`);
    } else {
      const message = result.error || '获取后端档案失败';
      console.error('❌ 后端档案加载失败:', message);
      throw new Error(message);
    }
  },

  // 加载后端论坛数据
  async loadBackendForum() {
    const result = await this.globalData.apiManager.getForumPosts({
      page: 1,
      limit: 50
    });

    if (result.success && result.data) {
      const posts = Array.isArray(result.data.posts) ? result.data.posts : [];
      this.globalData.forumPosts = posts;
      this.globalData.forumPagination = result.data.pagination || null;
      console.log(`📝 后端论坛加载成功: ${posts.length} 条`);
    } else {
      const message = result.error || '获取论坛数据失败';
      console.error('❌ 后端论坛加载失败:', message);
      throw new Error(message);
    }
  },

  // 初始化基础数据
  initData() {
    this.globalData.userInfo = {
      avatarUrl: '../../images/default-avatar.png',
      nickName: '爱心志愿者',
      level: this.globalData.userLevel,
      points: this.globalData.userPoints,
      totalProfiles: 0,
      totalTasks: this.globalData.tasks.length
    };
  },

  // 初始化用户位置
  initUserLocation() {
    setTimeout(async () => {
      try {
        await this.updateUserLocation();
      } catch (error) {
        console.error('❌ 初始化位置失败', error);
      }
    }, 500);
  },

  // 更新用户位置
  async updateUserLocation() {
    try {
      if (!this.globalData.locationManager) {
        throw new Error('定位管理器未初始化');
      }

      const location = await this.globalData.locationManager.getCurrentLocation();
      if (!location) {
        throw new Error('无法获取位置信息');
      }

      this.globalData.userLocation = location;
      console.log('📍 用户位置更新成功:', location.name || location.address);
    } catch (error) {
      console.error('❌ 更新位置失败:', error);
      this.globalData.userLocation = {
        latitude: 31.2304,
        longitude: 121.4737,
        name: '上海市',
        address: '位置获取失败'
      };
    }
  },

  // 加载我的档案
  loadMyProfiles() {
    try {
      const savedProfiles = wx.getStorageSync('my_animal_profiles') || [];
      this.globalData.myAnimalProfiles = savedProfiles;
      console.log(`📁 本地档案加载: ${savedProfiles.length} 条`);
    } catch (error) {
      console.error('❌ 加载我的档案失败:', error);
      this.globalData.myAnimalProfiles = [];
    }
  },

  // 加载云端档案
  async loadCloudProfiles() {
    try {
      const db = wx.cloud.database();
      const result = await db.collection(this.globalData.catCollection)
        .where({ isActive: true })
        .orderBy('createTime', 'desc')
        .limit(20)
        .get();

      const data = Array.isArray(result.data) ? result.data : [];
      if (data.length) {
        this.globalData.cloudCatProfiles = data;
        this.globalData.lastSyncTime = new Date().toISOString();
        console.log(`☁️ 从云端加载了 ${data.length} 条猫咪档案`);
      }
    } catch (error) {
      console.error('❌ 加载云端档案失败:', error);
    }
  },

  // 聚合所有档案
  getAllProfiles() {
    const backendProfiles = Array.isArray(this.globalData.backendProfiles) ? this.globalData.backendProfiles : [];
    const cloudProfiles = Array.isArray(this.globalData.cloudCatProfiles) ? this.globalData.cloudCatProfiles : [];
    const myProfiles = Array.isArray(this.globalData.myAnimalProfiles) ? this.globalData.myAnimalProfiles : [];

    let allProfiles = [];

    if (this.globalData.backendConnected && backendProfiles.length) {
      allProfiles = [...backendProfiles];
      console.log('✅ 使用后端数据模式');
    } else if (cloudProfiles.length) {
      allProfiles = [...cloudProfiles];
      console.log('☁️ 使用云端缓存模式');
    }

    if (myProfiles.length) {
      allProfiles = [...allProfiles, ...myProfiles];
    }

    if (!allProfiles.length) {
      console.log('📦 使用离线数据模式');
    }

    return allProfiles;
  },

  // 保存我的档案
  saveMyProfile(profile) {
    try {
      this.globalData.myAnimalProfiles.unshift(profile);
      wx.setStorageSync('my_animal_profiles', this.globalData.myAnimalProfiles);
      console.log('✅ 档案保存成功:', profile.name);
      return true;
    } catch (error) {
      console.error('❌ 保存档案失败:', error);
      return false;
    }
  },

  // 删除我的档案
  deleteMyProfile(profileId) {
    try {
      this.globalData.myAnimalProfiles = this.globalData.myAnimalProfiles.filter(
        (profile) => profile.id !== profileId
      );
      wx.setStorageSync('my_animal_profiles', this.globalData.myAnimalProfiles);
      console.log('✅ 档案删除成功:', profileId);
      return true;
    } catch (error) {
      console.error('❌ 删除档案失败:', error);
      return false;
    }
  },

  // 获取当前角色
  getCurrentRole() {
    if (this.globalData.roleManager) {
      return this.globalData.roleManager.getCurrentRole();
    }
    return 'user';
  },

  // 切换用户角色
  switchRole(newRole) {
    if (this.globalData.roleManager) {
      return this.globalData.roleManager.switchRole(newRole);
    }
    return false;
  }
});
