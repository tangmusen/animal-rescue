// pages/map/map.js
const app = getApp();

Page({
  data: {
    latitude: 39.90923,
    longitude: 116.397428,
    scale: 14,
    markers: [],
    controls: [],
    showDetail: false,
    selectedAnimal: null
  },

  onLoad() {
    this.getLocation();
    this.loadAnimalMarkers();
  },

  onShow() {
    // 设置自定义tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      });
    }
  },

  // 获取当前位置
  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude
        });
      },
      fail: () => {
        wx.showToast({
          title: '获取位置失败',
          icon: 'none'
        });
      }
    });
  },

  // 加载动物标记
  async loadAnimalMarkers() {
    try {
      const response = await app.globalData.apiManager.requestWithRetry('/api/profiles?pageSize=100');
      const animals = response?.data?.data;
      if (!response?.success || !Array.isArray(animals)) {
        this.setData({ markers: [] });
        return;
      }
      const markers = animals.map((animal, index) => {
        if (animal.location) {
          const [lat, lng] = animal.location.split(',').map(Number);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return {
              id: index,
              latitude: lat,
              longitude: lng,
              iconPath: '/images/marker.png',
              width: 30,
              height: 30,
              callout: {
                content: animal.name || '未命名',
                display: 'BYCLICK',
                padding: 5,
                borderRadius: 5,
                bgColor: '#ffffff'
              },
              animalData: animal
            };
          }
        }
        if (animal.latitude && animal.longitude) {
          const lat = Number(animal.latitude);
          const lng = Number(animal.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return {
              id: index,
              latitude: lat,
              longitude: lng,
              iconPath: '/images/marker.png',
              width: 30,
              height: 30,
              callout: {
                content: animal.name || '未命名',
                display: 'BYCLICK',
                padding: 5,
                borderRadius: 5,
                bgColor: '#ffffff'
              },
              animalData: animal
            };
          }
        }
        return null;
      }).filter(Boolean);
      this.setData({ markers });
    } catch (error) {
      console.log('加载动物标记失败', error);
      this.setData({ markers: [] });
    }
  },
  // 标记点击事件
  markerTap(e) {
    const markerId = e.detail.markerId;
    const marker = this.data.markers.find(m => m.id === markerId);
    
    if (marker && marker.animalData) {
      this.setData({
        showDetail: true,
        selectedAnimal: marker.animalData
      });
    }
  },

  // 关闭详情
  closeDetail() {
    this.setData({
      showDetail: false,
      selectedAnimal: null
    });
  },

  // 查看详情
  viewDetail() {
    const id = this.data.selectedAnimal.id;
    wx.navigateTo({
      url: `/pages/animal-detail/animal-detail?id=${id}`
    });
  },

  // 回到当前位置
  moveToLocation() {
    const mapCtx = wx.createMapContext('animalMap');
    mapCtx.moveToLocation();
  },

  // 地图视野变化
  regionChange(e) {
    // 可以在这里处理地图区域变化事件
  },

  // 刷新标记
  refreshMarkers() {
    wx.showLoading({
      title: '刷新中...'
    });
    
    this.loadAnimalMarkers();
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    }, 1000);
  }
}); 