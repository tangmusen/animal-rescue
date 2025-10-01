// pages/import-data/import-data.js
Page({
  data: {
    importing: false,
    progress: 0,
    currentStep: '',
    importResult: null,
    excelData: null,
    processedData: []
  },

  onLoad() {
    // 初始化云开发
    wx.cloud.init({
      env: 'cloud1-9gkwqyphff2c9bfa',
      traceUser: true
    });
  },

  // 开始导入Excel数据
  async startImport() {
    this.setData({
      importing: true,
      progress: 0,
      currentStep: '准备导入...'
    });

    try {
      // 第一步：读取Excel文件
      await this.readExcelFile();
      
      // 第二步：处理数据
      await this.processData();
      
      // 第三步：上传到云数据库
      await this.uploadToCloud();
      
      this.setData({
        importing: false,
        progress: 100,
        currentStep: '导入完成！',
        importResult: {
          success: true,
          message: `成功导入${this.data.processedData.length}条猫咪档案`
        }
      });

    } catch (error) {
      console.error('导入失败:', error);
      this.setData({
        importing: false,
        importResult: {
          success: false,
          message: '导入失败：' + error.message
        }
      });
    }
  },

  // 读取Excel文件 - 包含所有32条完整数据
  async readExcelFile() {
    this.setData({
      currentStep: '读取Excel文件...',
      progress: 10
    });

    // 完整的32条海和院小区流浪猫数据
    const completeExcelData = [
      [
        "序号",
        "名称",
        "照片",
        "颜色&品种",
        "性别",
        "是否绝育",
        "常见地点",
        "特征及备注",
        "驱虫记录",
        "疫苗记录",
        "存续状态",
        "主要助养人",
        "体重记录",
        "猫咪身价"
      ],
      [
        "HHY001",
        "橘橘宝",
        null,
        "长毛橘白",
        "弟弟",
        "已绝育",
        "17-18单元南面草丛，36-38单元北面草丛",
        "亲人温顺，吃得多，无不良行为\n20241130已绝育\n202504发现皮肤病，治疗中",
        "2024.05-外驱\n2024.11-外驱+内驱\n2025.03-外驱+内驱",
        "2024.11.30-妙三多",
        "在小区",
        "17-102-Chloe",
        "20250316-\n11.6斤",
        300
      ],
      [
        "HHY002",
        "狸狸Lily",
        null,
        "短毛狸花",
        "未知",
        "未知",
        "17-18单元南面草丛，36-38单元北面草丛",
        "亲人温顺，不拒绝食物，无不良行为\n202506发现疑似口炎，等待抓捕",
        "未知",
        null,
        "在小区",
        "17-102-Chloe"
      ],
      [
        "HHY003",
        "花花",
        null,
        "短毛三花",
        "妹妹",
        "已绝育",
        "39-40单元南面，41单元楼道，到45单元北面",
        "2024年7月26日已生产，孩子为1三花，2橘猫，1狸猫\n20250124已绝育\n目前由17-502-Celine负责中转寄养",
        "未知",
        "2025.03.18-妙三多",
        "寄养中",
        null,
        null,
        790
      ],
      [
        "HHY004",
        "花小白",
        null,
        "短毛三花",
        "妹妹",
        "未绝育",
        "39单元南面花园地下排水沟，45单元附近",
        "2024年7月26日生，母亲为HHY003花花",
        "未知",
        null,
        "没见到"
      ],
      [
        "HHY005",
        "花狸",
        null,
        "短毛狸花",
        "妹妹",
        "未绝育",
        "39单元南面花园地下排水沟，45单元附近",
        "2024年7月26日生，母亲为HHY003花花",
        "未知",
        null,
        "没见到"
      ],
      [
        "HHY006",
        "花虎",
        null,
        "短毛橘白",
        "弟弟",
        "未绝育",
        "39单元南面花园地下排水沟，45单元附近",
        "2024年7月26日生，母亲为HHY003花花",
        "未知",
        null,
        "没见到"
      ],
      [
        "HHY007",
        "花橘",
        null,
        "短毛橘白",
        "弟弟",
        "未绝育",
        "39单元南面花园地下排水沟，45单元附近",
        "2024年7月26日生，母亲为HHY003花花",
        "未知",
        null,
        "没见到"
      ],
      [
        "HHY008",
        "佐佐",
        null,
        "短毛三花",
        "妹妹",
        "未绝育",
        "曾见于合院199楼下，地下停车场垃圾堆处",
        "有明确生育过，鼻头有黑色毛",
        "未知",
        null,
        "没见到"
      ],
      [
        "HHY009",
        "瑁瑁",
        null,
        "短毛玳瑁",
        "妹妹",
        "已绝育",
        "见于17、22、25单元",
        "生过宝宝，带着几只小猫，很警觉，怕人不接近\n20250208已绝育",
        "未知",
        null,
        "在小区",
        null,
        null,
        600
      ],
      [
        "HHY010",
        "布丁",
        null,
        "短毛橘白",
        "弟弟",
        "已绝育",
        "见于22单元",
        "很大一只，胖胖的\n20250113已绝育",
        "未知",
        null,
        "在小区",
        null,
        null,
        430
      ],
      [
        "HHY011",
        "米米",
        null,
        "短毛狸白",
        "弟弟",
        "未绝育",
        "见于23单元",
        "其他业主从新纪元带回小区，后弃养，2024年5月出生，目前已被53-302领养",
        "未知",
        null,
        "被领养",
        "53-302-越"
      ],
      [
        "HHY012",
        "圆脸橘",
        null,
        "短毛橘猫",
        "弟弟",
        "未绝育",
        "见于西门及22号附近",
        "浑身都是橘色，没有白色",
        "未知",
        null,
        "在小区"
      ],
      [
        "HHY013",
        "棉花糖",
        null,
        "短毛白猫",
        "妹妹",
        "未绝育",
        "39单元南面花园地下排水沟",
        "白色，小小只，目前是幼猫",
        "未知",
        null,
        "在小区"
      ],
      [
        "HHY014",
        "小奶牛",
        null,
        "短毛奶牛",
        "妹妹",
        "已绝育",
        "22号即附近草丛",
        "2024年8月出生，是瑁瑁的孩子\n20250219已绝育",
        "未知",
        null,
        "在小区",
        null,
        null,
        600
      ],
      [
        "HHY015",
        "萝卜",
        null,
        "短毛玳瑁",
        "妹妹",
        "已绝育",
        "22号即附近草丛",
        "2024年8月出生，是瑁瑁的孩子\n20250320已绝育",
        "未知",
        "2025.03.18-妙三多",
        "在小区",
        null,
        null,
        700
      ],
      [
        "HHY016",
        "彩彩",
        null,
        "短毛彩狸",
        "妹妹",
        "未绝育",
        "别墅区垃圾桶",
        "曾经有邻居见到在地库即将生育，后续未见到",
        "未知",
        null,
        "没见到"
      ],
      [
        "HHY017",
        "缘缘",
        null,
        "白色长毛品种猫",
        "妹妹",
        "已绝育",
        "91号门口天井、77号",
        "脖子有外伤，2025.02.18治疗成功，\n2025.03.27已绝育；2025.04.11被领养\n2025.04.14已回访；2025.04.24已回访\n2025.05.05已回访；",
        "2025.02.20-内驱2025.03.24-外驱",
        "2025.03.24-妙三多",
        "被领养",
        "被领养，领养人为陈家镇上自有住房的居民",
        null,
        2645
      ],
      [
        "HHY018",
        "佐牛",
        null,
        "短毛奶牛",
        "妹妹",
        "未绝育",
        "157号、69号、112号",
        null,
        "未知",
        null,
        "在小区"
      ],
      [
        "HHY019",
        "佐彩",
        null,
        "短毛彩狸",
        "妹妹",
        "未绝育",
        "157号、69号",
        null,
        "未知",
        null,
        "在小区"
      ],
      [
        "HHY020",
        "佐橘",
        null,
        "短毛橘白",
        "未知",
        "未绝育",
        "157号、69号",
        null,
        "未知",
        null,
        "在小区"
      ],
      [
        "HHY021",
        "妙妙",
        null,
        "短毛狸花",
        "未知",
        "未绝育",
        "112号、115号",
        null,
        "未知",
        null,
        "在小区"
      ],
      [
        "HHY022",
        "佐吉",
        null,
        "短毛橘白",
        "弟弟",
        "已绝育",
        "157号、69号",
        "20250222已绝育",
        "未知",
        null,
        "在小区",
        null,
        null,
        400
      ],
      [
        "HHY023",
        "小美",
        null,
        "短毛三花",
        "妹妹",
        "已绝育",
        "69号",
        "20250223已绝育",
        "未知",
        null,
        "在小区",
        null,
        null,
        600
      ],
      [
        "HHY024",
        "面包",
        null,
        "短毛橘猫",
        "未知",
        "未绝育",
        null,
        "全橘，没有白",
        "未知",
        null,
        "在小区"
      ],
      [
        "HHY025",
        "瑁小黑",
        null,
        "短毛黑猫",
        "妹妹",
        "已绝育",
        "23号、22号之间的车库进口处",
        "2024年8月出生，是瑁瑁的孩子\n20250320已绝育",
        "未知",
        "2025.03.17-妙三多",
        "在小区",
        null,
        null,
        700
      ],
      [
        "HHY026",
        "星儿",
        null,
        "短毛狸花",
        "妹妹",
        "已绝育",
        "23号",
        "20250311已绝育，\n目前由17-502-Celine负责中转寄养",
        "未知",
        "2025.03.09-妙三多",
        "寄养中",
        null,
        null,
        500
      ],
      [
        "HHY027",
        "酸奶",
        null,
        "短毛白猫",
        "未知",
        "未绝育",
        "196号",
        null,
        "未知",
        null,
        "在小区"
      ],
      [
        "HHY028",
        "灰灰",
        null,
        "长毛灰色缅因",
        "妹妹",
        "已绝育",
        "17号、洋房与合院交界处的路、北门门岗",
        "性格温顺，体型修长，较瘦，需要补充营养\n2025.04.25已绝育；2025.05.05被领养\n2025.05.12已回访；2025.05.20已回访",
        "2025.04.21-外驱",
        "2025.04.21-妙三多",
        "被领养",
        "领养人为裕鸿佳苑13期居民",
        null,
        700
      ],
      [
        "HHY029",
        "奶黄包",
        null,
        "短毛橘白",
        "未知",
        "未绝育",
        "合院331号",
        null,
        "未知",
        null,
        "在小区"
      ],
      [
        "HHY030",
        "浅浅",
        null,
        "短毛橘猫",
        "弟弟",
        "未绝育",
        "17号院子",
        "暂时未见攻击性，时常等待食物捡漏；来17号院子会遭狸狸驱赶",
        "未知",
        null,
        "在小区"
      ],
      [
        "HHY031",
        "小小橘",
        null,
        "短毛橘猫",
        "弟弟",
        "未绝育",
        "地下车库，原本有猫妈妈，后续未见猫妈妈",
        "2025年5月底在地下车库被发现，后被小吴救出；20-101及39-102等邻居轮流喂养。5月29日小小橘精神萎靡，去看医生，后续2025年5月30日凌晨去喵星",
        "未知",
        null,
        "去喵星"
      ],
      [
        "HHY032",
        "小花",
        null,
        "短毛三花",
        "妹妹",
        "未绝育",
        "27-28号院子，偶见于保安亭",
        "非常亲人，挺机灵，貌美",
        "未知",
        null,
        "在小区"
      ]
    ];

    this.setData({ excelData: completeExcelData });
  },

  // 处理数据
  async processData() {
    this.setData({
      currentStep: '处理数据格式...',
      progress: 30
    });

    const { excelData } = this.data;
    const processedData = [];

    // 跳过表头，处理每一行数据
    for (let i = 1; i < excelData.length; i++) {
      const row = excelData[i];
      if (!row[0] || !row[1]) continue; // 跳过无序号或无名称的记录

      const catProfile = {
        // 基本信息
        serialNumber: row[0] || '',
        name: row[1] || '',
        photos: [],
        colorBreed: row[3] || '',
        gender: this.normalizeGender(row[4]),
        isNeutered: this.normalizeNeutered(row[5]),
        
        // 位置信息
        commonLocation: row[6] || '',
        locationCoordinates: {
          latitude: null,
          longitude: null,
          address: row[6] || '',
          timestamp: null
        },
        
        // 特征和记录
        characteristics: row[7] || '',
        dewormingRecords: this.parseRecords(row[8]),
        vaccineRecords: this.parseRecords(row[9]),
        
        // 状态信息
        currentStatus: this.normalizeStatus(row[10]),
        mainCaretaker: row[11] || '',
        weightStatus: row[12] || '',
        totalExpenditure: this.parseExpenditure(row[13]),
        
        // 系统字段
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        isActive: true,
        source: 'excel_import_2025',
        
        // 扩展字段（兼容原系统）
        type: '猫',
        breed: this.extractBreed(row[3]),
        ageEstimate: this.estimateAge(row[7]),
        weight: this.extractWeight(row[12]),
        furColor: row[3] || '',
        distinguishingFeatures: row[7] || '',
        healthStatus: this.determineHealthStatus(row[7], row[8], row[9]),
        medicalRecords: this.parseRecords(row[8]).concat(this.parseRecords(row[9])),
        medicalHistory: row[7] || '',
        rescueDate: this.extractDate(row[7]) || null,
        rescueLocation: row[6] || '',
        rescuer: row[11] || '社区志愿者',
        rescueReason: '小区流浪猫救助',
        personality: this.extractPersonality(row[7]),
        suitableEnvironment: '小区环境',
        habits: '户外生活',
        isAdoptable: this.determineAdoptable(row[10]),
        adoptionRequirements: '需要有爱心和责任心的领养人',
        adoptedPersonName: this.extractAdoptedPerson(row[11]),
        adoptedPersonCity: '',
        adoptedPersonContact: '',
        remarks: row[7] || ''
      };

      processedData.push(catProfile);
    }

    this.setData({ processedData });
    
    // 更新进度显示处理的记录数
    this.setData({
      currentStep: `处理完成，共${processedData.length}条记录`,
      progress: 50
    });
  },

  // 标准化性别
  normalizeGender(gender) {
    if (!gender) return '未知';
    if (gender.includes('弟弟') || gender.includes('公') || gender.includes('雄')) return '公';
    if (gender.includes('妹妹') || gender.includes('母') || gender.includes('雌')) return '母';
    return '未知';
  },

  // 标准化绝育状态
  normalizeNeutered(neutered) {
    if (!neutered) return '未知';
    if (neutered.includes('已') || neutered.includes('是')) return '是';
    if (neutered.includes('未') || neutered.includes('否')) return '否';
    return '未知';
  },

  // 解析记录
  parseRecords(records) {
    if (!records || records === '未知') return [];
    return records.split('\n').filter(record => record.trim()).map(record => ({
      date: this.extractDate(record),
      content: record.trim(),
      createTime: new Date().toISOString()
    }));
  },

  // 提取日期
  extractDate(text) {
    if (!text) return null;
    const dateMatch = text.match(/(\d{4})[\.\/\-](\d{1,2})[\.\/\-]?(\d{1,2})?/);
    if (dateMatch) {
      const year = dateMatch[1];
      const month = dateMatch[2].padStart(2, '0');
      const day = dateMatch[3] ? dateMatch[3].padStart(2, '0') : '01';
      return `${year}-${month}-${day}`;
    }
    return null;
  },

  // 标准化状态
  normalizeStatus(status) {
    if (!status) return '在小区';
    if (status.includes('失踪') || status.includes('消失') || status.includes('没见到')) return '失踪';
    if (status.includes('死亡') || status.includes('去世') || status.includes('去喵星')) return '死亡';
    if (status.includes('领养') || status.includes('被领养')) return '已被领养';
    if (status.includes('寄养')) return '寄养中';
    return '在小区';
  },

  // 解析支出
  parseExpenditure(expenditure) {
    if (!expenditure) return 0;
    if (typeof expenditure === 'number') return expenditure;
    const match = String(expenditure).match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  },

  // 提取品种
  extractBreed(colorBreed) {
    if (!colorBreed) return '中华田园猫';
    if (colorBreed.includes('品种猫') || colorBreed.includes('缅因')) return '品种猫';
    return '中华田园猫';
  },

  // 估计年龄
  estimateAge(characteristics) {
    if (!characteristics) return '未知';
    if (characteristics.includes('幼猫') || characteristics.includes('小小只')) return '幼猫';
    if (characteristics.includes('2024年') && characteristics.includes('出生')) return '幼猫';
    if (characteristics.includes('2025年') && characteristics.includes('出生')) return '幼猫';
    return '成猫';
  },

  // 提取体重
  extractWeight(weightRecord) {
    if (!weightRecord) return null;
    const weightMatch = weightRecord.match(/(\d+\.?\d*)\s*斤/);
    if (weightMatch) {
      return (parseFloat(weightMatch[1]) * 0.5).toFixed(1) + 'kg'; // 斤转公斤
    }
    return null;
  },

  // 提取性格特点
  extractPersonality(characteristics) {
    if (!characteristics) return '待观察';
    if (characteristics.includes('亲人')) return '亲人、温顺';
    if (characteristics.includes('警觉') || characteristics.includes('怕人')) return '警觉、怕人';
    if (characteristics.includes('温顺')) return '温顺';
    if (characteristics.includes('机灵')) return '机灵、活泼';
    return '待观察';
  },

  // 提取领养人信息
  extractAdoptedPerson(caretaker) {
    if (!caretaker) return '';
    if (caretaker.includes('被领养') || caretaker.includes('领养人')) return '已有领养人';
    if (caretaker.includes('-')) return caretaker.split('-')[1] || '';
    return '';
  },

  // 判断健康状态
  determineHealthStatus(characteristics, dewormingRecords, vaccineRecords) {
    if (!characteristics) return '未知';
    if (characteristics.includes('皮肤病') || characteristics.includes('口炎') || characteristics.includes('外伤') || characteristics.includes('萎靡')) {
      return '需要治疗';
    }
    if (characteristics.includes('已绝育') && vaccineRecords && vaccineRecords !== '未知') return '良好';
    if (characteristics.includes('健康') || characteristics.includes('温顺')) return '良好';
    return '一般';
  },

  // 判断是否可领养
  determineAdoptable(status) {
    if (!status) return '否';
    if (status.includes('在小区') && !status.includes('死亡') && !status.includes('失踪') && !status.includes('没见到')) {
      return '可考虑';
    }
    if (status.includes('寄养')) return '可考虑';
    return '否';
  },

  // 上传到云数据库
  async uploadToCloud() {
    this.setData({
      currentStep: '上传到云数据库...',
      progress: 60
    });

    const db = wx.cloud.database();
    const collection = db.collection('cat_profiles');

    const { processedData } = this.data;
    let uploadedCount = 0;
    let updatedCount = 0;

    // 批量上传，每次上传5条记录
    const batchSize = 5;
    for (let i = 0; i < processedData.length; i += batchSize) {
      const batch = processedData.slice(i, i + batchSize);
      
      try {
        for (const cat of batch) {
          try {
            // 检查是否已存在相同序号的记录
            const existingCat = await collection.where({
              serialNumber: cat.serialNumber
            }).get();

            if (existingCat.data.length === 0) {
              // 不存在则添加
              await collection.add({
                data: cat
              });
              uploadedCount++;
              console.log(`新增猫咪档案: ${cat.name} (${cat.serialNumber})`);
            } else {
              // 存在则更新
              await collection.doc(existingCat.data[0]._id).update({
                data: {
                  ...cat,
                  updateTime: new Date().toISOString()
                }
              });
              updatedCount++;
              console.log(`更新猫咪档案: ${cat.name} (${cat.serialNumber})`);
            }
          } catch (error) {
            console.error(`处理猫咪档案失败: ${cat.name}`, error);
          }
        }

        // 更新进度
        const progress = 60 + (i + batchSize) / processedData.length * 35;
        this.setData({
          progress: Math.min(progress, 95),
          currentStep: `上传中... ${uploadedCount + updatedCount}/${processedData.length}`
        });

        // 添加延迟避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`批次上传失败:`, error);
        throw new Error(`上传第${Math.floor(i / batchSize) + 1}批数据失败: ${error.message}`);
      }
    }

    console.log(`数据导入完成: 新增${uploadedCount}条, 更新${updatedCount}条`);
    
    // 更新最终结果
    this.setData({
      importResult: {
        success: true,
        message: `导入完成！新增${uploadedCount}条，更新${updatedCount}条猫咪档案`
      }
    });
  },

  // 查看导入的数据
  async viewImportedData() {
    try {
      const db = wx.cloud.database();
      const result = await db.collection('cat_profiles')
        .orderBy('createTime', 'desc')
        .limit(10)
        .get();
      
      if (result.data.length === 0) {
        wx.showModal({
          title: '数据预览',
          content: '暂无数据，请先执行导入操作',
          showCancel: false
        });
        return;
      }

      const sampleNames = result.data.slice(0, 5).map(cat => `${cat.name}(${cat.serialNumber})`).join('\n');
      
      wx.showModal({
        title: '导入数据预览',
        content: `数据库中共有 ${result.data.length}+ 条记录\n\n最新导入的猫咪:\n${sampleNames}`,
        showCancel: false
      });
      
    } catch (error) {
      console.error('查看数据失败:', error);
      wx.showToast({
        title: '查看失败: ' + error.message,
        icon: 'none',
        duration: 3000
      });
    }
  },

  // 清空数据库（测试用）
  async clearDatabase() {
    wx.showModal({
      title: '⚠️ 危险操作',
      content: '确定要清空所有猫咪档案数据吗？\n\n此操作将删除云数据库中的所有记录，不可恢复！',
      confirmText: '确认清空',
      confirmColor: '#ff4444',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({
              title: '清空中...',
              mask: true
            });

            const db = wx.cloud.database();
            const collection = db.collection('cat_profiles');
            
            // 分批获取和删除数据
            let hasMore = true;
            let deletedCount = 0;
            
            while (hasMore) {
              const result = await collection.limit(20).get();
              
              if (result.data.length === 0) {
                hasMore = false;
                break;
              }
              
              // 批量删除
              for (const item of result.data) {
                await collection.doc(item._id).remove();
                deletedCount++;
              }
              
              if (result.data.length < 20) {
                hasMore = false;
              }
            }
            
            wx.hideLoading();
            wx.showToast({
              title: `清空完成，删除了${deletedCount}条记录`,
              icon: 'success',
              duration: 3000
            });
            
          } catch (error) {
            wx.hideLoading();
            console.error('清空数据库失败:', error);
            wx.showToast({
              title: '清空失败: ' + error.message,
              icon: 'none',
              duration: 3000
            });
          }
        }
      }
    });
  },

  // 获取数据库统计信息
  async getDbStats() {
    try {
      wx.showLoading({
        title: '统计中...',
        mask: true
      });

      const db = wx.cloud.database();
      const collection = db.collection('cat_profiles');

      // 获取总数
      const totalResult = await collection.count();
      const total = totalResult.total;

      if (total === 0) {
        wx.hideLoading();
        wx.showModal({
          title: '数据库统计',
          content: '数据库为空，请先导入数据',
          showCancel: false
        });
        return;
      }

      // 获取统计数据
      const allData = await collection.field({
        currentStatus: true,
        isNeutered: true,
        totalExpenditure: true,
        mainCaretaker: true
      }).get();

      // 统计各种状态
      const statusCount = {};
      const neuteredCount = { 是: 0, 否: 0, 未知: 0 };
      let totalExpenditure = 0;
      const caretakers = new Set();

      allData.data.forEach(cat => {
        // 状态统计
        const status = cat.currentStatus || '未知';
        statusCount[status] = (statusCount[status] || 0) + 1;

        // 绝育统计
        const neutered = cat.isNeutered || '未知';
        neuteredCount[neutered] = (neuteredCount[neutered] || 0) + 1;

        // 支出统计
        if (cat.totalExpenditure) {
          totalExpenditure += cat.totalExpenditure;
        }

        // 助养人统计
        if (cat.mainCaretaker && cat.mainCaretaker.trim()) {
          caretakers.add(cat.mainCaretaker);
        }
      });

      wx.hideLoading();

      const statusText = Object.entries(statusCount)
        .map(([status, count]) => `${status}: ${count}只`)
        .join('\n');

      wx.showModal({
        title: '📊 数据库统计',
        content: `总计: ${total}只猫咪\n\n状态分布:\n${statusText}\n\n绝育情况:\n已绝育: ${neuteredCount.是}只\n未绝育: ${neuteredCount.否}只\n未知: ${neuteredCount.未知}只\n\n总支出: ${totalExpenditure}元\n助养人数: ${caretakers.size}人`,
        showCancel: false
      });

    } catch (error) {
      wx.hideLoading();
      console.error('获取统计失败:', error);
      wx.showToast({
        title: '统计失败: ' + error.message,
        icon: 'none',
        duration: 3000
      });
    }
  }
});