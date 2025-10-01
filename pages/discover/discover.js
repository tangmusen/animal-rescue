// pages/discover/discover.js
Page({
  onLoad() {
    // 页面加载时直接跳转到创建档案页面
    wx.redirectTo({
      url: '/pages/create-profile/create-profile'
    });
  },

  onShow() {
    // 如果用户返回到这个页面，再次跳转
    wx.redirectTo({
      url: '/pages/create-profile/create-profile'
    });
  }
});