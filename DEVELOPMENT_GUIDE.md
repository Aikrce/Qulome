# 🚀 Qulome 开发指南

## 📋 项目概述

**项目名称**: 微信文章排版工具 - Qulome  
**核心目标**: 解决微信公众号文章排版门槛高、样式丑、不简洁的问题  
**用户特点**: 专注内容创造，对呈现形式有极高审美要求

## 🎯 核心功能架构

### 6个主要界面
1. **欢迎界面** (`welcome-view`) - κύλημα艺术字 + 双路径选择
2. **主视图** (`editor-view`) - Quill富文本编辑 + 实时预览
3. **图标库** (`icons-view`) - 32px图标管理 + 自定义SVG导入
4. **主题库** (`themes-view`) - 2×2主题网格 + 手风琴编辑器
5. **草稿仓** (`drafts-view`) - MD批量导入 + 复选框批量操作
6. **发布仓** (`publish-view`) - 成品预览 + HTML导出

### 数据存储策略
- **存储方式**: 浏览器 localStorage
- **数据结构**: JSON格式
- **存储键名**: 统一前缀 `qulome_`

## 🛡️ 开发规则（严格遵守）

### 1. 修改原则
```
✅ DO - 允许的操作
- 增量式功能添加
- 样式微调优化
- 新增独立模块
- 修复明确的bug

❌ DON'T - 禁止的操作
- 删除现有功能
- 重构整体架构
- 修改核心数据结构
- 破坏性更改
```

### 2. 文件修改优先级
```
🔴 高风险 - 需特别谨慎
- src/index.html (主结构)
- js/app.js (主控制器)
- styles/main.css (基础样式)

🟡 中风险 - 可适度修改
- js/views/*.js (功能模块)
- styles/sidebar.css (界面样式)

🟢 低风险 - 可自由修改
- js/utils/*.js (工具函数)
- assets/* (资源文件)
- 新增文件
```

### 3. 代码提交规范
```bash
# 功能开发
feat: 添加图标库搜索功能

# 样式调整
style: 优化侧边栏按钮间距

# 修复问题
fix: 修复MD导入解析错误

# 文档更新
docs: 更新开发指南
```

## 🔄 开发流程

### 阶段1: 基础框架 ✅ (已完成)
```
✅ 创建欢迎界面 (κύλημα艺术字 + 按钮)
✅ 实现界面路由系统 (欢迎界面 ↔ 功能界面)
✅ 设计侧边栏 (200px固定宽度 + Logo返回功能)
✅ 建立本地存储系统
```

### 阶段2: 核心功能 🔄 (进行中)
```
🔄 集成Quill富文本编辑器
🔄 实现基础主题系统 (适配富文本)
🔄 创建图标插入功能 (工具栏按钮 + 浮层选择)
□ MD文档批量导入解析
```

### 阶段3: 高级功能 📋 (计划中)
```
□ 完善主题库 (手风琴编辑器 + 实时预览)
□ 实现草稿仓和发布仓
□ 添加MD导入转换功能
□ 批量操作系统 (复选框多选)
```

## 📁 文件结构规范

```
src/
├── index.html                 # 主入口 (🔴高风险) - 6个界面单页应用
├── styles/
│   ├── main.css              # 基础样式 (🔴高风险) - 欢迎界面+基础样式
│   ├── wechat-styles.css     # 微信样式 (🟡中风险) - 导出兼容样式
│   └── themes/               # 主题样式目录 (🟢低风险)
├── js/
│   ├── app.js                # 主控制器 (🔴高风险) - 界面路由+状态管理
│   ├── views/                # 界面模块 (🟡中风险)
│   │   ├── welcome.js        # 欢迎界面 - κύλημα艺术字
│   │   ├── editor.js         # 主视图 - Quill富文本编辑器
│   │   ├── icons.js          # 图标库 - 32px图标+分类管理
│   │   ├── themes.js         # 主题库 - 2×2网格+手风琴编辑器
│   │   ├── drafts.js         # 草稿仓 - MD批量导入+复选框操作
│   │   └── publish.js        # 发布仓 - 成品预览+HTML导出
│   └── utils/                # 工具函数 (🟢低风险)
│       ├── storage.js        # 存储管理 - localStorage封装
│       ├── markdown.js       # MD解析 - 清除空行+HTML转换
│       └── icons.js          # 图标处理 - 简化标记转换
└── assets/                   # 资源文件 (🟢低风险)
    ├── icons/                # 预设图标资源
    └── templates/            # 主题模板文件
```

## 🎨 UI/UX 设计原则

### 审美标准 (已确认)
- **和谐**: 浅紫色系渐变 (#f8f4ff → #7a6bff) 统一色彩
- **协调**: 200px固定侧边栏 + 主内容区200px左边距
- **一致**: 白色背景 + 浅紫色主题色 + 统一交互模式
- **简洁**: κύλημα艺术字 + 简洁按钮 + 清晰界面分割

### 交互原则 (已实现)
- **即时反馈**: 按钮三态设计 + 实时预览 + 状态提醒
- **流畅切换**: 单页应用无刷新 + 界面路由系统
- **容错设计**: 未保存提醒 + 切换确认 + 批量操作确认
- **智能保存**: 停止输入2-3秒后自动保存

## 🔧 技术实现细节

### 本地存储结构 (已确认)
```javascript
// 存储键名规范
qulome_drafts     // 草稿数据 - MD批量导入生成
qulome_themes     // 主题数据 - 手风琴编辑器配置
qulome_icons      // 自定义图标 - 32px SVG + 分类
qulome_settings   // 用户设置 - 界面状态等
qulome_publish    // 发布内容 - 成品HTML

// 草稿数据格式
{
  id: 'unique_id',
  title: '文章标题',
  content: 'quill_html_content', // Quill富文本HTML
  theme: 'theme_id',
  createdAt: timestamp,
  updatedAt: timestamp,
  isUnsaved: boolean // 未保存状态标记
}

// 主题数据格式
{
  id: 'theme_id',
  name: '主题名称',
  version: 'V.03',
  styles: {
    primaryColor: '#07c160',
    textColor: '#333',
    headingStyles: { fontSize: '24px', fontWeight: 'bold' },
    paragraphStyles: { lineHeight: '1.6', margin: '16px 0' }
  }
}

// 图标数据格式
{
  id: 'icon_id',
  name: '图标名称',
  category: 'UI图标',
  svgCode: '<svg>...</svg>',
  createdAt: timestamp
}
```

### 图标插入系统 (已确认)
```javascript
// 编辑器显示简化标记
insertIconMark('[icon:文件]');

// 预览时转换为SVG
function convertIconMarkToSVG(content) {
  return content.replace(/\[icon:(\w+)\]/g, (match, iconName) => {
    const icon = getIconByName(iconName);
    return icon ? icon.svgCode : match;
  });
}

// 导出时转换为微信兼容HTML
function exportForWechat(content) {
  const htmlContent = convertIconMarkToSVG(content);
  return addWechatCompatibleStyles(htmlContent);
}
```

## ⚡ 即时反馈机制

### 修改反馈流程
1. **修改说明** - 简要说明本次修改内容
2. **影响范围** - 说明可能影响的功能
3. **预览效果** - 立即展示修改结果
4. **回滚方案** - 如有问题，提供快速回滚

### 沟通模板
```
🔧 修改内容: [简要描述]
📊 影响范围: [具体功能]
⚠️ 风险等级: 🟢低风险 / 🟡中风险 / 🔴高风险
🎯 预期效果: [期望达到的效果]
```

## 🚨 紧急处理流程

### 如果出现问题
1. **立即停止** - 停止当前修改
2. **问题定位** - 快速定位问题原因
3. **回滚操作** - 恢复到上一个稳定版本
4. **重新规划** - 调整实现方案

### 预防措施
- 每个功能模块独立开发
- 重要节点及时Git提交
- 保持小步快跑的开发节奏
- 优先实现核心功能

## 📝 开发日志

### 记录格式
```
日期: 2024-XX-XX
阶段: 基础框架
完成: ✅ 项目结构搭建
进行: 🔄 侧边栏样式开发
计划: 📋 界面切换功能
问题: ⚠️ 无
```

---

## 🎯 当前任务清单

### 立即执行 (阶段2 - 当前)
- [x] ✅ 欢迎界面 (κύλημα艺术字完成)
- [x] ✅ 侧边栏导航 (200px固定宽度)
- [x] ✅ 界面路由系统 (6个界面切换)
- [ ] 🔄 Quill富文本编辑器集成
- [ ] 🔄 图标插入功能 (工具栏按钮 + 浮层)

### 下一步计划 (阶段3)
- [ ] 📋 主题库 (2×2网格 + 手风琴编辑器)
- [ ] 📋 图标库 (32px网格 + 分类筛选)
- [ ] 📋 草稿仓 (MD批量导入 + 复选框操作)
- [ ] 📋 发布仓 (HTML导出功能)

---

## 📚 相关文档

- **[交互逻辑设计定稿](INTERACTION_FINAL.md)** - 完整的交互逻辑和界面设计
- **[编码规范与安全规则](CODING_RULES.md)** - 开发过程中必须遵守的编码规范
- **[项目说明](README.md)** - 项目概述和使用指南

---

**⚡ 关键提醒**: 
1. 严格遵循已确认的交互逻辑设计
2. 保持小步快跑，每次修改后立即预览
3. 优先实现核心功能，完善细节优化
4. 所有设计变更需要更新相关文档 