import { Storage } from './utils/storage.js';
import { WelcomeView } from './views/welcome-view.js';
import { EditorView } from './views/editor-view.js';
import { IconsView } from './views/icons-view.js';
import { ThemesView } from './views/themes-view.js';
import { DraftsView } from './views/drafts-view.js';
import { PublishView } from './views/publish-view.js';

// Qulome - 微信文章排版工具主应用
class QulomeApp {
    constructor() {
        this.currentView = 'welcome';
        this.sidebarVisible = false;
        
        // 模块实例
        this.welcomeView = null;
        this.editorView = null;
        this.iconsView = null;
        this.themesView = null;
        this.draftsView = null;
        this.publishView = null;

        this.init();
    }

    init() {
        // 初始化所有视图模块
        this.initializeViews();
        this.setupEventListeners();
        this.setupSidebarHover();
    }

    /**
     * 初始化所有视图模块
     */
    initializeViews() {
        try {
            // 初始化各个视图模块，传入消息显示回调
            this.welcomeView = new WelcomeView((view) => this.switchView(view));
            this.editorView = new EditorView((msg, type) => this.showMessage(msg, type));
            this.iconsView = new IconsView((msg, type) => this.showMessage(msg, type));
            this.themesView = new ThemesView((msg, type) => this.showMessage(msg, type));
            this.draftsView = new DraftsView((msg, type) => this.showMessage(msg, type));
            this.publishView = new PublishView((msg, type) => this.showMessage(msg, type));
            
            console.log('✅ 所有视图模块初始化成功');
            
            // 验证关键功能
            this.validateFeatures();
        } catch (error) {
            console.error('❌ 视图模块初始化失败:', error);
            this.showMessage('应用初始化失败，请刷新页面重试', 'error');
        }
    }

    /**
     * 验证关键功能是否正常
     */
    validateFeatures() {
        const checks = [
            {
                name: '图标库分类筛选',
                test: () => document.getElementById('category-selector') !== null
            },
            {
                name: '编辑器图标插入',
                test: () => document.getElementById('icon-selector-overlay') !== null
            },
            {
                name: '草稿仓批量导入',
                test: () => document.getElementById('batch-md-input') !== null
            },
            {
                name: '主题库网格展示',
                test: () => document.getElementById('themes-grid') !== null
            },
            {
                name: '本地存储功能',
                test: () => {
                    try {
                        Storage.saveJSON('test_key', { test: true });
                        const result = Storage.loadJSON('test_key');
                        Storage.remove('test_key');
                        return result && result.test === true;
                    } catch {
                        return false;
                    }
                }
            }
        ];

        const results = checks.map(check => ({
            name: check.name,
            passed: check.test()
        }));

        const passed = results.filter(r => r.passed).length;
        const total = results.length;

        console.log(`🔧 功能检查完成: ${passed}/${total} 项通过`);
        
        results.forEach(result => {
            console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
        });

        if (passed === total) {
            this.showMessage('应用已准备就绪，所有功能正常', 'success');
        } else {
            this.showMessage(`部分功能可能存在问题 (${passed}/${total})`, 'warning');
        }
    }

    // 设置全局事件监听器
    setupEventListeners() {
        // 侧边栏菜单项
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                if (view) {
                    this.switchView(view);
                }
            });
        });
    }

    // 设置侧边栏悬停效果
    setupSidebarHover() {
        const sidebar = document.getElementById('sidebar');
        const hoverTrigger = document.getElementById('hover-trigger');
        const mainContent = document.getElementById('main-content');
        
        let hoverTimeout;

        // 鼠标进入左侧边缘
        hoverTrigger.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            this.showSidebar();
        });

        // 鼠标进入侧边栏
        sidebar.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            this.showSidebar();
        });

        // 鼠标离开侧边栏
        sidebar.addEventListener('mouseleave', () => {
            hoverTimeout = setTimeout(() => {
                this.hideSidebar();
            }, 300);
        });

        // 鼠标离开检测区域
        hoverTrigger.addEventListener('mouseleave', () => {
            hoverTimeout = setTimeout(() => {
                this.hideSidebar();
            }, 300);
        });
    }

    // 显示侧边栏
    showSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        
        sidebar.classList.add('show');
        
        // 在欢迎界面时不推动主内容
        if (this.currentView !== 'welcome') {
            mainContent.classList.add('sidebar-open');
        }
        
        this.sidebarVisible = true;
    }

    // 隐藏侧边栏
    hideSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        
        sidebar.classList.remove('show');
        mainContent.classList.remove('sidebar-open');
        
        this.sidebarVisible = false;
    }

    // 切换视图
    switchView(viewName) {
        // 隐藏所有视图
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // 显示目标视图
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
        }

        // 更新侧边栏活动状态
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeMenuItem = document.querySelector(`[data-view="${viewName}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }

        // 如果切换到欢迎界面，隐藏侧边栏
        if (viewName === 'welcome') {
            this.hideSidebar();
        }

        // 如果切换到编辑器，确保Quill编辑器正确初始化
        if (viewName === 'editor' && this.editorView) {
            setTimeout(() => {
                this.editorView.focus();
            }, 100);
        }
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transition: all 0.3s ease;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        `;

        document.body.appendChild(messageEl);

        // 3秒后自动移除
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                document.body.removeChild(messageEl);
            }, 300);
        }, 3000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new QulomeApp();
}); 