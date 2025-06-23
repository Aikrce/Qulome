import { Storage } from '../utils/storage.js';

/**
 * IconsView 模块
 * 负责图标库界面的所有逻辑
 */
export class IconsView {
    /**
     * @param {function(string, string): void} showMessageCallback - 显示通知的回调函数
     */
    constructor(showMessageCallback) {
        if (typeof showMessageCallback !== 'function') {
            throw new Error('IconsView需要一个有效的回调函数来显示消息');
        }
        this.showMessage = showMessageCallback;
        this.currentCategory = 'all';
        this.allIcons = [];
        this.init();
    }

    /**
     * 初始化图标库和事件监听器
     */
    init() {
        this.setupEventListeners();
        this.loadIcons();
        this.createCategorySelector();
    }

    /**
     * 创建分类选择器
     */
    createCategorySelector() {
        const iconsHeader = document.querySelector('#icons-view .icons-grid-section h3');
        if (!iconsHeader) return;

        // 检查是否已存在选择器
        if (document.getElementById('category-selector')) return;

        const headerContainer = document.createElement('div');
        headerContainer.className = 'icons-header';
        
        const title = document.createElement('h3');
        title.textContent = '我的图标库';
        title.className = 'section-title';

        const categorySelector = document.createElement('div');
        categorySelector.className = 'category-selector';
        categorySelector.innerHTML = `
            <select id="category-selector" class="category-dropdown">
                <option value="all">全部图标</option>
                <option value="ui">UI图标</option>
                <option value="decoration">装饰图标</option>
                <option value="function">功能图标</option>
                <option value="custom">自定义</option>
            </select>
        `;

        headerContainer.appendChild(title);
        headerContainer.appendChild(categorySelector);

        // 替换原有标题
        iconsHeader.parentNode.replaceChild(headerContainer, iconsHeader);

        // 添加分类选择事件监听器
        document.getElementById('category-selector')?.addEventListener('change', (e) => {
            this.currentCategory = e.target.value;
            this.filterIconsByCategory();
        });
    }

    /**
     * 设置图标库界面的事件监听器
     */
    setupEventListeners() {
        // 保存新图标按钮
        document.getElementById('save-new-icon')?.addEventListener('click', () => {
            this.saveNewIcon();
        });

        // 监听图标网格的点击事件（使用事件委托）
        document.getElementById('saved-icons-grid')?.addEventListener('click', (e) => {
            this.handleIconGridClick(e);
        });
    }

    /**
     * 加载图标库
     */
    loadIcons() {
        // 默认图标数据
        const defaultIcons = [
            { id: 'icon-file', name: '文件', category: 'ui', svg: '<i class="fas fa-file-alt" style="font-size: 32px; color: #dc3545;"></i>' },
            { id: 'icon-chart', name: '图表', category: 'ui', svg: '<i class="fas fa-chart-bar" style="font-size: 32px; color: #28a745;"></i>' },
            { id: 'icon-volleyball', name: '排球', category: 'decoration', svg: '<i class="fas fa-volleyball-ball" style="font-size: 32px; color: #007bff;"></i>' },
            { id: 'icon-battery', name: '电池', category: 'function', svg: '<i class="fas fa-battery-three-quarters" style="font-size: 32px; color: #28a745;"></i>' },
            { id: 'icon-pointer', name: '点击', category: 'ui', svg: '<i class="fas fa-hand-pointer" style="font-size: 32px; color: #fd7e14;"></i>' },
            { id: 'icon-fist', name: '重击', category: 'decoration', svg: '<i class="fas fa-fist-raised" style="font-size: 32px; color: #343a40;"></i>' },
            { id: 'icon-arrow', name: '推进', category: 'ui', svg: '<i class="fas fa-arrow-right" style="font-size: 32px; color: #343a40;"></i>' },
            { id: 'icon-signin', name: '进入', category: 'function', svg: '<i class="fas fa-sign-in-alt" style="font-size: 32px; color: #007bff;"></i>' },
            { id: 'icon-border', name: '双框', category: 'decoration', svg: '<i class="fas fa-border-all" style="font-size: 32px; color: #6f42c1;"></i>' }
        ];

        // 从localStorage加载图标，如果没有则使用默认图标
        this.allIcons = Storage.loadJSON('qulome_icons', defaultIcons);
        this.filterIconsByCategory();
    }

    /**
     * 根据分类筛选图标
     */
    filterIconsByCategory() {
        let filteredIcons = this.allIcons;
        
        if (this.currentCategory !== 'all') {
            filteredIcons = this.allIcons.filter(icon => 
                icon.category === this.currentCategory
            );
        }
        
        this.renderIconsGrid(filteredIcons);
    }

    /**
     * 渲染图标网格
     * @param {Array} icons - 图标数组
     */
    renderIconsGrid(icons) {
        const grid = document.getElementById('saved-icons-grid');
        if (!grid) return;

        if (icons.length === 0) {
            grid.innerHTML = '<div class="no-icons">当前分类下暂无图标</div>';
            return;
        }

        grid.innerHTML = '';
        icons.forEach(icon => {
            const card = document.createElement('div');
            card.className = 'icon-card';
            card.dataset.iconId = icon.id;
            card.innerHTML = `
                <div class="icon-display">${icon.svg}</div>
                <div class="icon-name">${icon.name}</div>
                <div class="icon-actions">
                    <button class="btn-copy" data-action="copy" data-icon-id="${icon.id}">复制</button>
                    <button class="btn-delete" data-action="delete" data-icon-id="${icon.id}">删除</button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    /**
     * 处理图标网格的点击事件
     * @param {Event} event - 点击事件
     */
    handleIconGridClick(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const iconId = button.dataset.iconId;

        switch (action) {
            case 'copy':
                this.copyIcon(iconId);
                break;
            case 'delete':
                this.deleteIcon(iconId);
                break;
        }
    }

    /**
     * 复制图标到剪贴板
     * @param {string} iconId - 图标ID
     */
    copyIcon(iconId) {
        const icon = this.allIcons.find(i => i.id === iconId);
        
        if (!icon) {
            this.showMessage('图标不存在', 'error');
            return;
        }

        // 创建简化标记格式
        const iconMark = `[icon:${icon.name}]`;
        
        try {
            // 复制到剪贴板
            navigator.clipboard.writeText(iconMark).then(() => {
                this.showMessage(`图标标记已复制: ${iconMark}`, 'success');
            }).catch(() => {
                // 降级方案：使用传统方法
                this.fallbackCopyToClipboard(iconMark);
            });
        } catch (error) {
            this.fallbackCopyToClipboard(iconMark);
        }
    }

    /**
     * 降级复制方案
     * @param {string} text - 要复制的文本
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showMessage(`图标标记已复制: ${text}`, 'success');
        } catch (error) {
            this.showMessage('复制失败，请手动复制', 'error');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    /**
     * 删除图标
     * @param {string} iconId - 图标ID
     */
    deleteIcon(iconId) {
        const iconIndex = this.allIcons.findIndex(i => i.id === iconId);
        
        if (iconIndex === -1) {
            this.showMessage('图标不存在', 'error');
            return;
        }

        const icon = this.allIcons[iconIndex];
        
        // 确认删除
        if (!confirm(`确定要删除图标 "${icon.name}" 吗？`)) {
            return;
        }

        // 从数组中移除
        this.allIcons.splice(iconIndex, 1);
        
        // 保存到localStorage
        const result = Storage.saveJSON('qulome_icons', this.allIcons);
        
        if (result.success) {
            this.showMessage(`图标 "${icon.name}" 已删除`, 'success');
            this.filterIconsByCategory(); // 重新筛选和渲染
        } else {
            this.showMessage(`删除失败: ${result.error}`, 'error');
        }
    }

    /**
     * 保存新图标
     */
    saveNewIcon() {
        const nameInput = document.getElementById('new-icon-name');
        const svgInput = document.getElementById('new-icon-svg');
        
        if (!nameInput || !svgInput) {
            this.showMessage('找不到输入框', 'error');
            return;
        }

        const name = nameInput.value.trim();
        const svg = svgInput.value.trim();

        // 验证输入
        if (!name) {
            this.showMessage('请输入图标名称', 'warning');
            nameInput.focus();
            return;
        }

        if (!svg) {
            this.showMessage('请输入SVG代码', 'warning');
            svgInput.focus();
            return;
        }

        // 简单的SVG格式验证
        if (!svg.includes('<svg') && !svg.includes('<i class=')) {
            this.showMessage('请输入有效的SVG代码或Font Awesome图标代码', 'warning');
            svgInput.focus();
            return;
        }

        // 检查是否已存在同名图标
        if (this.allIcons.some(icon => icon.name === name)) {
            this.showMessage(`图标名称 "${name}" 已存在`, 'warning');
            nameInput.focus();
            return;
        }

        // 创建新图标对象
        const newIcon = {
            id: `icon-${Date.now()}`,
            name: name,
            category: 'custom', // 新添加的图标默认为自定义分类
            svg: svg,
            createdAt: new Date().toISOString()
        };

        // 添加到数组开头
        this.allIcons.unshift(newIcon);
        
        // 保存到localStorage
        const result = Storage.saveJSON('qulome_icons', this.allIcons);
        
        if (result.success) {
            this.showMessage(`图标 "${name}" 已保存`, 'success');
            this.filterIconsByCategory(); // 重新筛选和渲染
            
            // 清空输入框
            nameInput.value = '';
            svgInput.value = '';
        } else {
            this.showMessage(`保存失败: ${result.error}`, 'error');
        }
    }

    /**
     * 根据名称获取图标
     * @param {string} iconName - 图标名称
     * @returns {Object|null} 图标对象或null
     */
    getIconByName(iconName) {
        const icons = Storage.loadJSON('qulome_icons', []);
        return icons.find(icon => icon.name === iconName) || null;
    }

    /**
     * 刷新图标库显示
     */
    refresh() {
        this.loadIcons();
    }
} 