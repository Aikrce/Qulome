# 🛡️ Qulome 编码规范与安全规则

## 📋 文档说明
本文档规定了 Qulome 项目开发过程中必须遵守的编码规范和安全规则，确保代码质量、项目稳定性和开发安全。

---

## 🚨 核心安全原则

### ⚠️ 禁止操作 (RED LINE - 绝对不允许)
```
❌ 删除现有文件
❌ 重命名核心文件 (index.html, app.js, main.css)
❌ 修改项目根目录结构
❌ 一次性修改超过3个文件
❌ 单个文件超过500行代码
❌ 破坏性重构现有功能
❌ 在项目目录外创建文件
❌ 修改package.json的核心配置
```

### ✅ 允许操作 (GREEN ZONE - 安全操作)
```
✅ 在指定目录下新建文件
✅ 增量式功能添加
✅ 样式微调和优化
✅ 新增工具函数
✅ 添加注释和文档
✅ 修复明确的bug
✅ 优化现有代码逻辑
```

---

## 📁 文件管理规范

### 🏗️ 目录结构限制
```
src/
├── index.html              # 🔴 禁止删除/重命名
├── styles/                 # 样式文件目录
│   ├── main.css           # 🔴 核心样式，谨慎修改
│   ├── components/        # ✅ 可新增组件样式
│   └── themes/            # ✅ 可新增主题文件
├── js/
│   ├── app.js             # 🔴 主控制器，谨慎修改
│   ├── views/             # ✅ 界面模块，可新增
│   ├── utils/             # ✅ 工具函数，可新增
│   └── components/        # ✅ 可新增组件目录
└── assets/                # ✅ 资源文件，可新增
```

### 📝 文件创建规则
1. **新文件位置**：必须在 `src/` 目录下的合适子目录中
2. **命名规范**：使用小写字母，单词间用连字符分隔 (kebab-case)
3. **文件大小**：单个文件不超过500行代码
4. **功能单一**：每个文件只负责一个明确的功能模块

### 🔄 文件修改规则
```
🔴 高风险文件 (需特别谨慎)
- src/index.html
- src/js/app.js  
- src/styles/main.css
修改前必须：备份 + 说明影响范围 + 逐步测试

🟡 中风险文件 (适度修改)
- src/js/views/*.js
- src/styles/components/*.css
修改时：小步修改 + 及时测试

🟢 低风险文件 (可自由修改)
- src/js/utils/*.js
- src/assets/*
- 新创建的文件
```

---

## 💻 代码结构规范

### 📏 代码长度限制
```javascript
// 单个函数不超过50行
function processData() {
  // 最多50行代码
  if (lines > 50) {
    // 拆分为多个小函数
  }
}

// 单个文件不超过500行
// 超过时必须拆分为多个模块
```

### 🧩 模块化要求
```javascript
// ✅ 良好的模块化示例
// utils/storage.js
export const storage = {
  save: (key, data) => { /* 实现 */ },
  load: (key) => { /* 实现 */ },
  remove: (key) => { /* 实现 */ }
};

// views/editor.js  
import { storage } from '../utils/storage.js';
export const EditorView = {
  init: () => { /* 实现 */ },
  render: () => { /* 实现 */ }
};
```

### 🏷️ 命名规范
```javascript
// 变量和函数：驼峰命名
const userName = 'qulome';
function getUserData() {}

// 常量：大写下划线
const MAX_FILE_SIZE = 500;
const API_ENDPOINTS = {};

// 类和构造函数：帕斯卡命名
class ThemeManager {}
function EditorView() {}

// 文件名：短横线命名
// theme-manager.js
// editor-view.js
```

---

## 🔄 开发流程规范

### 📋 单次修改限制
```
一次开发任务限制：
├── 最多修改 3 个现有文件
├── 最多新建 2 个文件
├── 单个文件修改不超过 100 行
└── 必须保持功能完整性
```

### ⚡ 渐进式开发流程
```
第1步：规划 → 说明本次要实现的功能
第2步：创建 → 先创建必要的新文件
第3步：实现 → 逐个文件实现功能
第4步：测试 → 每个文件完成后立即测试
第5步：整合 → 确保各模块协调工作
第6步：验证 → 完整功能测试
```

### 🚨 风险评估流程
```
修改前必须评估：
├── 风险等级：🔴高风险 / 🟡中风险 / 🟢低风险
├── 影响范围：列出可能受影响的功能
├── 回滚方案：如何快速恢复到修改前状态
└── 测试计划：如何验证修改是否成功
```

---

## 🎯 功能实现规范

### 🧱 组件化开发
```javascript
// 每个界面组件独立文件
// views/welcome-view.js
export class WelcomeView {
  constructor() {
    this.container = null;
    this.isInitialized = false;
  }
  
  init() { /* 初始化逻辑 */ }
  render() { /* 渲染逻辑 */ }
  destroy() { /* 清理逻辑 */ }
}
```

### 🔗 接口设计规范
```javascript
// 统一的接口设计模式
export const ThemeManager = {
  // 数据操作
  create: (themeData) => {},
  read: (themeId) => {},
  update: (themeId, data) => {},
  delete: (themeId) => {},
  
  // 业务逻辑
  apply: (themeId) => {},
  preview: (themeData) => {},
  export: (themeId) => {}
};
```

### 📊 状态管理规范
```javascript
// 集中的状态管理
// utils/state-manager.js
export const StateManager = {
  state: {
    currentView: 'welcome',
    unsavedChanges: false,
    currentTheme: null
  },
  
  setState: (key, value) => {
    this.state[key] = value;
    this.notifyChange(key, value);
  },
  
  getState: (key) => this.state[key]
};
```

---

## 🎨 样式编写规范

### 📐 CSS 组织结构
```css
/* styles/main.css - 基础样式 */
:root {
  --primary-color: #7a6bff;
  --bg-color: #ffffff;
  --sidebar-width: 200px;
}

/* styles/components/ - 组件样式 */
/* welcome.css */
.welcome-container { /* 欢迎界面样式 */ }

/* editor.css */  
.editor-container { /* 编辑器样式 */ }
```

### 🎯 样式命名规范
```css
/* BEM 命名规范 */
.component-name { /* 组件 */ }
.component-name__element { /* 元素 */ }
.component-name--modifier { /* 修饰符 */ }

/* 示例 */
.theme-card { }
.theme-card__title { }
.theme-card__button { }
.theme-card--selected { }
```

---

## 🔍 代码质量要求

### 📝 注释规范
```javascript
/**
 * 函数说明
 * @param {string} param1 - 参数说明
 * @param {Object} param2 - 参数说明
 * @returns {boolean} 返回值说明
 */
function exampleFunction(param1, param2) {
  // 重要逻辑的行内注释
  const result = processData(param1);
  
  // 复杂算法的解释注释
  if (complexCondition) {
    // 为什么这样处理的说明
  }
  
  return result;
}
```

### 🧪 错误处理规范
```javascript
// 必须包含错误处理
function saveData(data) {
  try {
    const result = localStorage.setItem('key', JSON.stringify(data));
    return { success: true, data: result };
  } catch (error) {
    console.error('保存数据失败:', error);
    return { success: false, error: error.message };
  }
}

// 用户友好的错误提示
function showError(message) {
  // 显示用户可理解的错误信息
  alert(`操作失败: ${message}`);
}
```

---

## 🚦 开发检查清单

### ✅ 代码提交前检查
```
□ 代码符合命名规范
□ 函数长度不超过50行
□ 文件长度不超过500行
□ 包含必要的注释
□ 包含错误处理
□ 测试核心功能正常
□ 没有控制台错误
□ 界面显示正常
```

### 🔄 每次修改后验证
```
□ 原有功能未受影响
□ 新功能按预期工作
□ 界面切换流畅
□ 数据保存正常
□ 没有JavaScript错误
□ CSS样式正确应用
```

---

## 🚨 应急处理流程

### 🔙 问题回滚步骤
```
1. 立即停止当前修改
2. 识别问题根源
3. 恢复到上一个工作版本
4. 重新规划实现方案
5. 小步骤重新实现
```

### 📞 寻求帮助的情况
```
遇到以下情况必须暂停并寻求指导：
├── 核心功能完全失效
├── 界面无法正常显示
├── 数据丢失风险
├── 不确定修改影响范围
└── 超出当前技术能力范围
```

---

## 📋 开发任务模板

### 📝 任务开始模板
```
🎯 任务目标: [具体要实现的功能]
📊 风险评估: 🟢低风险 / 🟡中风险 / 🔴高风险
📁 涉及文件: [列出要修改/创建的文件]
🔄 实现步骤: 
  1. [第一步]
  2. [第二步] 
  3. [第三步]
⚠️ 风险点: [可能的问题和应对方案]
🧪 测试计划: [如何验证功能]
```

### ✅ 任务完成模板
```
✅ 已完成: [实现的功能]
📁 修改文件: [实际修改的文件列表]
🆕 新增文件: [新创建的文件列表]
🧪 测试结果: [测试情况说明]
⚠️ 注意事项: [使用时需要注意的点]
```

---

## 🎯 总结

### 🏆 编码原则优先级
1. **安全第一** - 不破坏现有功能
2. **渐进开发** - 小步快跑，及时测试
3. **代码质量** - 可读性和可维护性
4. **用户体验** - 功能完整性和流畅性

### 🎪 记住关键点
- 📏 **控制规模**: 一次少改，多次迭代
- 🧪 **及时测试**: 每步完成立即验证
- 📝 **文档同步**: 重要修改及时记录
- 🤝 **沟通确认**: 不确定时主动询问

---

**⚡ 核心提醒**: 宁可多花时间规划，也不要急于求成导致项目不稳定！ 