# Qulome - 文字可以很美

一个专为微信文章排版设计的现代化编辑器，支持主题定制、图标管理和一键发布。

## 🌟 功能特性

### 核心功能
- **WYSIWYG编辑器**: 基于Quill.js的富文本编辑器，支持实时预览
- **主题系统**: 完整的CSS变量主题系统，支持实时预览和自定义
- **图标库**: SVG图标管理，支持颜色编辑和快速插入
- **草稿管理**: 自动保存和草稿管理功能
- **一键发布**: 支持一键复制到微信编辑器

### 技术特性
- **单页面应用(SPA)**: 基于哈希路由的现代化架构
- **模块化设计**: 清晰的服务层和视图层分离
- **本地存储**: 基于localStorage的数据持久化
- **响应式设计**: 适配不同屏幕尺寸
- **错误处理**: 完善的错误处理和用户反馈机制

## 📁 项目结构

```
Qulome/
├── index.html              # 主页面
├── src/
│   ├── js/
│   │   ├── app.js          # 主应用程序
│   │   ├── config.js       # 配置文件
│   │   ├── services/       # 服务层
│   │   │   ├── theme-service.js
│   │   │   ├── draft-service.js
│   │   │   ├── publish-service.js
│   │   │   └── icon-service.js
│   │   ├── views/          # 视图层
│   │   │   ├── editor-view.js
│   │   │   ├── themes-view.js
│   │   │   ├── icons-view.js
│   │   │   ├── drafts-view.js
│   │   │   ├── publish-view.js
│   │   │   └── theme-editor-view.js
│   │   └── utils/          # 工具类
│   │       ├── logger.js
│   │       ├── error-handler.js
│   │       ├── notification.js
│   │       └── performance-monitor.js
│   └── styles/             # 样式文件
│       ├── main.css
│       ├── views/          # 视图样式
│       └── components/     # 组件样式
├── docs/                   # 文档和部署文件
└── test.html              # 测试页面
```

## 🚀 快速开始

### 本地开发

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd Qulome
   ```

2. **启动本地服务器**
   ```bash
   # 使用Python
   python3 -m http.server 8000
   
   # 或使用Node.js
   npx serve .
   
   # 或使用PHP
   php -S localhost:8000
   ```

3. **访问应用**
   打开浏览器访问 `http://localhost:8000`

### 部署到GitHub Pages

1. **推送到GitHub**
   ```bash
   git add .
   git commit -m "feat: prepare for deployment"
   git push origin main
   ```

2. **启用GitHub Pages**
   - 进入GitHub仓库设置
   - 找到Pages选项
   - 选择部署分支（通常是main）
   - 选择部署目录（通常是docs或根目录）

3. **访问部署的应用**
   应用将在 `https://<username>.github.io/<repository-name>` 上线

## 🎨 主题系统

Qulome使用CSS变量实现主题系统，支持以下样式定制：

### 标题样式
- H1、H2、H3的颜色、字号、字重、对齐方式

### 正文样式
- 字体族、字号、颜色、行间距、段落间距、文本对齐

### 特殊文本
- 链接颜色、悬停效果、粗体、斜体、代码样式

### 块级元素
- 引用块、代码块的背景、边框、内边距

### 列表样式
- 有序/无序列表的样式和缩进

## 🔧 开发指南

### 添加新功能

1. **创建服务** (如果需要)
   ```javascript
   // src/js/services/new-service.js
   const NewService = {
       // 服务方法
   };
   window.NewService = NewService;
   ```

2. **创建视图** (如果需要)
   ```javascript
   // src/js/views/new-view.js
   window.NewView = {
       init: () => {
           // 初始化逻辑
       },
       cleanup: () => {
           // 清理逻辑
       }
   };
   ```

3. **更新路由** (在app.js中)
   ```javascript
   case '#new-view':
       document.getElementById('new-view').style.display = 'block';
       if (window.NewView) {
           window.NewView.init();
           currentActiveView = 'NewView';
       }
       break;
   ```

### 代码规范

- 使用ES6+语法
- 遵循模块化设计原则
- 添加适当的错误处理
- 使用JSDoc注释
- 保持代码简洁和可读性

## 🧪 测试

项目包含一个测试页面 `test.html`，用于验证基本功能：

- 基础功能测试
- 服务加载测试
- 主题系统测试
- 本地存储测试

## 📝 更新日志

### v1.0.0 (当前版本)
- ✅ 完整的编辑器功能
- ✅ 主题系统和编辑器
- ✅ 图标库管理
- ✅ 草稿和发布管理
- ✅ 一键复制功能
- ✅ 响应式设计
- ✅ 错误处理机制

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目。

## 📄 许可证

本项目采用MIT许可证。

## 🔗 相关链接

- [Quill.js](https://quilljs.com/) - 富文本编辑器
- [Showdown](https://showdownjs.com/) - Markdown转换器
- [Feather Icons](https://feathericons.com/) - 图标库

---

**Qulome** - 让文字更美丽 ✨ 