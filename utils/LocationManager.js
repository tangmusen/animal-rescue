// utils/LocationManager.js - 位置管理器
class LocationManager {
  constructor() {
    this.currentLocation = null;
    this.isLocating = false;
    this.lastUpdateTime = null;
    this.updateInterval = 5 * 60 * 1000; // 5分钟更新一次
    
    // 腾讯地图API配置
    this.tencentMapKey = '3KJBZ-QIFKH-P7EDB-WMGJA-VLW57-VQBZM';
    this.tencentMapURL = 'https://apis.map.qq.com/ws/geocoder/v1/';
  }

  // 获取当前位置
  async getCurrentLocation(forceUpdate = false) {
    // 检查是否需要更新位置
    if (!forceUpdate && this.currentLocation && this.lastUpdateTime) {
      const timeDiff = Date.now() - this.lastUpdateTime;
      if (timeDiff < this.updateInterval) {
        console.log('📍 使用缓存位置数据');
        return this.currentLocation;
      }
    }

    // 防止重复定位
    if (this.isLocating) {
      console.log('📍 正在定位中，等待完成...');
      return this.waitForLocation();
    }

    return this.updateLocation();
  }

  // 更新位置信息
  async updateLocation() {
    this.isLocating = true;
    
    try {
      console.log('📍 开始获取位置信息...');
      
      // 1. 获取GPS坐标
      const coords = await this.getGPSLocation();
      console.log('📍 GPS坐标获取成功:', coords);
      
      // 2. 进行逆地理编码
      const addressInfo = await this.reverseGeocode(coords.latitude, coords.longitude);
      console.log('📍 地址解析成功:', addressInfo);
      
      // 3. 整合位置信息
      this.currentLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        ...addressInfo,
        updateTime: new Date().toISOString()
      };
      
      this.lastUpdateTime = Date.now();
      console.log('📍 位置信息更新完成:', this.currentLocation);
      
      return this.currentLocation;
      
    } catch (error) {
      console.error('❌ 位置获取失败:', error);
      throw new Error(`定位失败: ${error.message}`);
    } finally {
      this.isLocating = false;
    }
  }

  // 获取GPS坐标
  getGPSLocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02', // 返回可以用于wx.openLocation的坐标
        highAccuracyExpireTime: 10000, // 高精度定位超时时间
        isHighAccuracy: true, // 开启高精度定位
        success: (res) => {
          resolve({
            latitude: res.latitude,
            longitude: res.longitude,
            speed: res.speed,
            accuracy: res.accuracy,
            altitude: res.altitude,
            verticalAccuracy: res.verticalAccuracy,
            horizontalAccuracy: res.horizontalAccuracy
          });
        },
        fail: (error) => {
          console.error('GPS定位失败:', error);
          reject(new Error(error.errMsg || 'GPS定位失败'));
        }
      });
    });
  }

  // 逆地理编码 - 使用腾讯地图API
  // 逆地理编码
async reverseGeocode(latitude, longitude) {
  try {
    // 不使用 URLSearchParams
    const params = {
      location: `${latitude},${longitude}`,
      key: this.tencentMapKey,
      get_poi: 1
    };
    
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const url = `https://apis.map.qq.com/ws/geocoder/v1/?${queryString}`;
      
      console.log('🗺️ 请求腾讯地图API:', url);

      return new Promise((resolve, reject) => {
        wx.request({
          url: url,
          method: 'GET',
          success: (res) => {
            console.log('🗺️ 腾讯地图API响应:', res.data);
            
            if (res.statusCode === 200 && res.data.status === 0) {
              const result = res.data.result;
              const addressInfo = this.parseLocationResult(result);
              resolve(addressInfo);
            } else {
              const errorMsg = res.data.message || '地址解析失败';
              reject(new Error(errorMsg));
            }
          },
          fail: (error) => {
            console.error('腾讯地图API请求失败:', error);
            reject(new Error(error.errMsg || '网络请求失败'));
          }
        });
      });
      
    } catch (error) {
      console.error('逆地理编码失败:', error);
      throw error;
    }
  }

  // 解析腾讯地图返回的位置信息
  parseLocationResult(result) {
    const addressComponent = result.address_component;
    const formattedAddresses = result.formatted_addresses;
    
    // 提取详细地址信息
    const locationInfo = {
      // 完整地址
      address: result.address,
      formattedAddress: formattedAddresses?.recommend || result.address,
      
      // 行政区划
      province: addressComponent.province,
      city: addressComponent.city,
      district: addressComponent.district,
      
      // 街道信息
      street: addressComponent.street,
      streetNumber: addressComponent.street_number,
      
      // 推荐地址
      roughAddress: formattedAddresses?.rough || '',
      
      // 附近地标
      nearbyPois: [],
      
      // 位置名称（用于显示）
      name: '',
      shortName: ''
    };

    // 处理附近POI
    if (result.pois && result.pois.length > 0) {
      locationInfo.nearbyPois = result.pois.slice(0, 5).map(poi => ({
        name: poi.title,
        address: poi.address,
        distance: poi._distance,
        category: poi.category
      }));
      
      // 使用最近的有意义POI作为位置名称
      const nearestPoi = result.pois[0];
      if (nearestPoi && nearestPoi._distance < 500) {
        locationInfo.name = nearestPoi.title;
        locationInfo.shortName = nearestPoi.title;
      }
    }

    // 如果没有找到合适的POI，使用地址组件生成名称
    if (!locationInfo.name) {
      if (addressComponent.street && addressComponent.street_number) {
        locationInfo.name = `${addressComponent.street}${addressComponent.street_number}`;
        locationInfo.shortName = addressComponent.street;
      } else if (addressComponent.district) {
        locationInfo.name = addressComponent.district;
        locationInfo.shortName = addressComponent.district;
      } else {
        locationInfo.name = addressComponent.city || '未知位置';
        locationInfo.shortName = addressComponent.city || '未知';
      }
    }

    console.log('📍 位置解析结果:', locationInfo);
    return locationInfo;
  }

  // 等待定位完成
  async waitForLocation() {
    return new Promise((resolve) => {
      const checkLocation = () => {
        if (!this.isLocating && this.currentLocation) {
          resolve(this.currentLocation);
        } else {
          setTimeout(checkLocation, 100);
        }
      };
      checkLocation();
    });
  }

  // 计算两点间距离
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 距离（米）
  }

  // 格式化距离显示
  formatDistance(distance) {
    if (distance < 1000) {
      return `${Math.round(distance)}米`;
    } else {
      return `${(distance / 1000).toFixed(1)}公里`;
    }
  }

  // 检查定位权限
  async checkLocationPermission() {
    return new Promise((resolve) => {
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.userLocation'] !== undefined) {
            resolve(res.authSetting['scope.userLocation']);
          } else {
            resolve(null); // 用户还未授权
          }
        },
        fail: () => {
          resolve(false);
        }
      });
    });
  }

  // 请求定位权限
  async requestLocationPermission() {
    return new Promise((resolve) => {
      wx.authorize({
        scope: 'scope.userLocation',
        success: () => {
          console.log('📍 定位权限授权成功');
          resolve(true);
        },
        fail: () => {
          console.log('📍 定位权限授权失败');
          // 引导用户手动开启
          wx.showModal({
            title: '需要定位权限',
            content: '为了给您推荐附近的流浪动物信息，需要获取您的位置',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    resolve(settingRes.authSetting['scope.userLocation'] === true);
                  }
                });
              } else {
                resolve(false);
              }
            }
          });
        }
      });
    });
  }

  // 清除位置缓存
  clearLocationCache() {
    this.currentLocation = null;
    this.lastUpdateTime = null;
    console.log('📍 位置缓存已清除');
  }

  // 获取位置摘要信息
  getLocationSummary() {
    if (!this.currentLocation) {
      return '位置未知';
    }

    return {
      name: this.currentLocation.name || '当前位置',
      shortName: this.currentLocation.shortName || '位置',
      district: this.currentLocation.district,
      city: this.currentLocation.city,
      updateTime: this.currentLocation.updateTime
    };
  }
}

// 创建单例实例
const locationManager = new LocationManager();

module.exports = locationManager;