// utils/RoleManager.js - 角色管理器
class RoleManager {
  constructor() {
    this.currentRole = 'user';
    this.roleData = {
      user: {
        name: '普通用户',
        level: 1,
        permissions: ['view', 'create_profile', 'like', 'comment'],
        color: '#2196f3',
        icon: '👤',
        description: '可以创建档案和参与论坛互动'
      },
      volunteer: {
        name: '志愿者',
        level: 2,
        permissions: ['view', 'create_profile', 'like', 'comment', 'edit_others', 'moderate'],
        color: '#4caf50',
        icon: '🤝',
        description: '可以协助管理和编辑档案'
      },
      admin: {
        name: '管理员',
        level: 3,
        permissions: ['view', 'create_profile', 'like', 'comment', 'edit_others', 'moderate', 'delete', 'manage_users'],
        color: '#ff9800',
        icon: '👮',
        description: '拥有完整的管理权限'
      },
      super_admin: {
        name: '系统管理员',
        level: 4,
        permissions: ['*'],
        color: '#f44336',
        icon: '👑',
        description: '拥有所有系统权限'
      }
    };
    
    this.initialized = false;
  }

  // 初始化角色管理器
  init() {
    try {
      // 从本地存储读取当前角色
      const savedRole = wx.getStorageSync('user_role');
      if (savedRole && this.roleData[savedRole]) {
        this.currentRole = savedRole;
      } else {
        this.currentRole = 'user';
        this.saveCurrentRole();
      }
      
      this.initialized = true;
      console.log('🎭 角色管理器初始化完成:', this.currentRole);
      return true;
    } catch (error) {
      console.error('❌ 角色管理器初始化失败:', error);
      this.currentRole = 'user';
      this.initialized = true;
      return false;
    }
  }

  // 获取当前角色
  getCurrentRole() {
    return this.currentRole;
  }

  // 获取角色信息
  getRoleInfo(role = null) {
    const targetRole = role || this.currentRole;
    return this.roleData[targetRole] || this.roleData['user'];
  }

  // 获取所有角色列表
  getAllRoles() {
    return Object.keys(this.roleData).map(key => ({
      key,
      ...this.roleData[key]
    }));
  }

  // 切换角色
  switchRole(newRole) {
    if (!this.roleData[newRole]) {
      console.error('❌ 无效的角色:', newRole);
      return false;
    }

    try {
      const oldRole = this.currentRole;
      this.currentRole = newRole;
      this.saveCurrentRole();
      
      console.log(`🎭 角色切换: ${oldRole} → ${newRole}`);
      
      // 触发角色切换事件
      this.onRoleChanged(oldRole, newRole);
      
      return true;
    } catch (error) {
      console.error('❌ 角色切换失败:', error);
      return false;
    }
  }

  // 检查权限
  hasPermission(permission) {
    const roleInfo = this.getRoleInfo();
    
    // 超级管理员拥有所有权限
    if (roleInfo.permissions.includes('*')) {
      return true;
    }
    
    return roleInfo.permissions.includes(permission);
  }

  // 检查是否有编辑他人档案的权限
  canEditOthers() {
    return this.hasPermission('edit_others');
  }

  // 检查是否有删除权限
  canDelete() {
    return this.hasPermission('delete');
  }

  // 检查是否有管理权限
  canManage() {
    return this.hasPermission('manage_users');
  }

  // 检查是否有审核权限
  canModerate() {
    return this.hasPermission('moderate');
  }

  // 获取角色级别
  getRoleLevel() {
    return this.getRoleInfo().level;
  }

  // 比较角色级别
  isHigherRole(targetRole) {
    const currentLevel = this.getRoleLevel();
    const targetLevel = this.roleData[targetRole]?.level || 0;
    return currentLevel > targetLevel;
  }

  // 保存当前角色到本地存储
  saveCurrentRole() {
    try {
      wx.setStorageSync('user_role', this.currentRole);
      return true;
    } catch (error) {
      console.error('❌ 保存角色失败:', error);
      return false;
    }
  }

  // 角色切换事件回调
  onRoleChanged(oldRole, newRole) {
    try {
      // 可以在这里添加角色切换后的处理逻辑
      wx.showToast({
        title: `已切换为${this.getRoleInfo(newRole).name}`,
        icon: 'success',
        duration: 2000
      });

      // 通知其他页面角色已变更
      wx.getApp().globalData.currentRole = newRole;
      
    } catch (error) {
      console.error('❌ 角色切换事件处理失败:', error);
    }
  }

  // 获取角色显示样式
  getRoleStyle(role = null) {
    const roleInfo = this.getRoleInfo(role);
    return {
      color: roleInfo.color,
      icon: roleInfo.icon,
      name: roleInfo.name
    };
  }

  // 验证角色权限是否足够执行某个操作
  validatePermission(permission, showError = true) {
    if (this.hasPermission(permission)) {
      return true;
    }

    if (showError) {
      wx.showToast({
        title: '权限不足',
        icon: 'none',
        duration: 2000
      });
    }

    return false;
  }

  // 获取权限描述
  getPermissionDescription(permission) {
    const descriptions = {
      'view': '查看内容',
      'create_profile': '创建档案',
      'like': '点赞',
      'comment': '评论',
      'edit_others': '编辑他人档案',
      'moderate': '内容审核',
      'delete': '删除内容',
      'manage_users': '用户管理',
      '*': '所有权限'
    };

    return descriptions[permission] || permission;
  }

  // 重置角色为默认用户
  resetToUser() {
    return this.switchRole('user');
  }

  // 清除角色数据
  clearRoleData() {
    try {
      wx.removeStorageSync('user_role');
      this.currentRole = 'user';
      console.log('🎭 角色数据已清除');
      return true;
    } catch (error) {
      console.error('❌ 清除角色数据失败:', error);
      return false;
    }
  }

  // 导出角色配置（用于调试）
  exportConfig() {
    return {
      currentRole: this.currentRole,
      roleData: this.roleData,
      initialized: this.initialized
    };
  }
}

// 创建单例实例
const roleManager = new RoleManager();

module.exports = roleManager;