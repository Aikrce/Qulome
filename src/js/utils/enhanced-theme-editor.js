/**
 * Enhanced Theme Editor - 增强的主题编辑器
 * 
 * 解决内联样式问题，提供更好的主题编辑体验
 */

window.EnhancedThemeEditor = {
    // 当前编辑的主题
    currentTheme: null,
    
    // 预览样式表
    previewStyleSheet: null,
    
    // 表单控件映射
    formControls: new Map(),
    
    // 防抖计时器
    updateTimer: null,

    /**
     * 初始化增强主题编辑器
     * @param {Object} theme - 要编辑的主题
     */
    init(theme) {
        if (!theme) {
            throw new Error('Theme is required for theme editor');
        }

        this.currentTheme = JSON.parse(JSON.stringify(theme)); // 深拷贝
        this.setupPreviewStyleSheet();
        this.renderEditor();
        this.bindEvents();
        this.updatePreview();
        
        window.Logger.debug('Enhanced theme editor initialized');
    },

    /**
     * 设置预览样式表
     */
    setupPreviewStyleSheet() {
        // 移除现有的预览样式表
        if (this.previewStyleSheet) {
            this.previewStyleSheet.remove();
        }

        // 创建新的样式表
        this.previewStyleSheet = document.createElement('style');
        this.previewStyleSheet.id = 'theme-preview-styles';
        document.head.appendChild(this.previewStyleSheet);
    },

    /**
     * 渲染编辑器界面
     */
    renderEditor() {
        const container = document.getElementById('theme-editor-form');
        if (!container) {
            throw new Error('Theme editor form container not found');
        }

        const formHTML = this.generateFormHTML();
        container.innerHTML = formHTML;
        
        // 初始化表单控件
        this.initializeFormControls();
    },

    /**
     * 生成表单HTML
     */
    generateFormHTML() {
        const sections = this.getFormSections();
        let html = '<div class="theme-editor-tabs">';
        
        // 生成标签页
        const tabIds = Object.keys(sections);
        tabIds.forEach((sectionId, index) => {
            const isActive = index === 0 ? 'active' : '';
            html += `<button class="tab-btn ${isActive}" data-tab="${sectionId}">${sections[sectionId].title}</button>`;
        });
        
        html += '</div><div class="theme-editor-content">';
        
        // 生成内容区域
        tabIds.forEach((sectionId, index) => {
            const section = sections[sectionId];
            const isActive = index === 0 ? 'active' : '';
            
            html += `<div class="tab-pane ${isActive}" id="${sectionId}-pane">`;
            html += `<h4>${section.title}</h4>`;
            
            section.fields.forEach(field => {
                html += this.generateFieldHTML(field);
            });
            
            html += '</div>';
        });
        
        html += '</div>';
        return html;
    },

    /**
     * 获取表单节
     */
    getFormSections() {
        return {
            typography: {
                title: '字体排版',
                fields: [
                    { key: '--h1-font-size', label: 'H1 字号', type: 'range', min: 16, max: 48, unit: 'px' },
                    { key: '--h1-color', label: 'H1 颜色', type: 'color' },
                    { key: '--h1-font-weight', label: 'H1 字重', type: 'select', options: ['normal', 'bold', '600', '700'] },
                    { key: '--h2-font-size', label: 'H2 字号', type: 'range', min: 14, max: 36, unit: 'px' },
                    { key: '--h2-color', label: 'H2 颜色', type: 'color' },
                    { key: '--h2-font-weight', label: 'H2 字重', type: 'select', options: ['normal', 'bold', '600', '700'] },
                    { key: '--h3-font-size', label: 'H3 字号', type: 'range', min: 12, max: 28, unit: 'px' },
                    { key: '--h3-color', label: 'H3 颜色', type: 'color' },
                    { key: '--h3-font-weight', label: 'H3 字重', type: 'select', options: ['normal', 'bold', '600', '700'] }
                ]
            },
            content: {
                title: '正文内容',
                fields: [
                    { key: '--p-font-family', label: '字体族', type: 'select', options: ['sans-serif', 'serif', '"Heiti SC", sans-serif', '"Microsoft YaHei", sans-serif'] },
                    { key: '--p-font-size', label: '字号', type: 'range', min: 12, max: 24, unit: 'px' },
                    { key: '--p-color', label: '文字颜色', type: 'color' },
                    { key: '--p-line-height', label: '行间距', type: 'range', min: 1.2, max: 2.5, step: 0.1 },
                    { key: '--p-margin-bottom', label: '段落间距', type: 'range', min: 8, max: 48, unit: 'px' },
                    { key: '--p-text-align', label: '对齐方式', type: 'select', options: ['left', 'center', 'right', 'justify'] }
                ]
            },
            special: {
                title: '特殊元素',
                fields: [
                    { key: '--a-color', label: '链接颜色', type: 'color' },
                    { key: '--a-hover-color', label: '链接悬停', type: 'color' },
                    { key: '--strong-color', label: '粗体颜色', type: 'color' },
                    { key: '--em-color', label: '斜体颜色', type: 'color' },
                    { key: '--code-bg', label: '代码背景', type: 'color' },
                    { key: '--code-color', label: '代码颜色', type: 'color' }
                ]
            },
            blocks: {
                title: '块级元素',
                fields: [
                    { key: '--blockquote-bg', label: '引用背景', type: 'color' },
                    { key: '--blockquote-border-color', label: '引用边框', type: 'color' },
                    { key: '--blockquote-color', label: '引用文字', type: 'color' },
                    { key: '--blockquote-padding', label: '引用内边距', type: 'text' },
                    { key: '--code-block-bg', label: '代码块背景', type: 'color' },
                    { key: '--code-block-color', label: '代码块文字', type: 'color' }
                ]
            }
        };
    },

    /**
     * 生成字段HTML
     */
    generateFieldHTML(field) {
        const value = this.currentTheme.styles[field.key] || '';
        let inputHTML = '';

        switch (field.type) {
            case 'color':
                inputHTML = `<input type="color" id="${field.key}" value="${value}" data-style-key="${field.key}">`;
                break;
            case 'range':
                const numValue = parseFloat(value) || field.min || 0;
                inputHTML = `
                    <div class="range-input-group">
                        <input type="range" id="${field.key}" 
                               min="${field.min}" max="${field.max}" 
                               step="${field.step || 1}" 
                               value="${numValue}" 
                               data-style-key="${field.key}"
                               data-unit="${field.unit || ''}">
                        <span class="range-value">${numValue}${field.unit || ''}</span>
                    </div>
                `;
                break;
            case 'select':
                const options = field.options.map(opt => 
                    `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
                ).join('');
                inputHTML = `<select id="${field.key}" data-style-key="${field.key}">${options}</select>`;
                break;
            default:
                inputHTML = `<input type="text" id="${field.key}" value="${value}" data-style-key="${field.key}">`;
        }

        return `
            <div class="form-field">
                <label for="${field.key}">${field.label}</label>
                ${inputHTML}
            </div>
        `;
    },

    /**
     * 初始化表单控件
     */
    initializeFormControls() {
        this.formControls.clear();
        
        // 收集所有控件
        const inputs = document.querySelectorAll('#theme-editor-form [data-style-key]');
        inputs.forEach(input => {
            const styleKey = input.dataset.styleKey;
            this.formControls.set(styleKey, input);
        });
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 标签页切换
        const tabBtns = document.querySelectorAll('.theme-editor-tabs .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 表单控件事件
        this.formControls.forEach((input, styleKey) => {
            const eventType = input.type === 'color' || input.type === 'range' ? 'input' : 'change';
            
            input.addEventListener(eventType, (e) => {
                this.handleInputChange(styleKey, e.target);
            });
        });

        // 保存按钮
        const saveBtn = document.getElementById('save-theme-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveTheme();
            });
        }
    },

    /**
     * 获取当前编辑的样式
     * @returns {Object} 样式对象
     */
    getCurrentStyles() {
        const styles = {};
        
        this.formControls.forEach((input, styleKey) => {
            styles[styleKey] = input.value;
        });
        
        return styles;
    },
    
    /**
     * 处理输入改变
     */
    handleInputChange(styleKey, input) {
        // 更新主题数据
        this.currentTheme.styles[styleKey] = input.value;
        
        // 防抖更新预览
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }
        
        this.updateTimer = setTimeout(() => {
            this.updatePreview();
        }, 150); // 150ms 防抖
    },
        // 更新按钮状态
        document.querySelectorAll('.theme-editor-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // 更新面板显示
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabId}-pane`);
        });
    },

    /**
     * 处理输入变化
     */
    handleInputChange(styleKey, input) {
        let value = input.value;
        
        // 处理范围输入的单位
        if (input.type === 'range' && input.dataset.unit) {
            value = value + input.dataset.unit;
            
            // 更新显示值
            const valueDisplay = input.parentNode.querySelector('.range-value');
            if (valueDisplay) {
                valueDisplay.textContent = value;
            }
        }

        // 更新主题数据
        this.currentTheme.styles[styleKey] = value;

        // 防抖更新预览
        this.debouncedUpdatePreview();
    },

    /**
     * 防抖更新预览
     */
    debouncedUpdatePreview() {
        clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(() => {
            this.updatePreview();
        }, 150);
    },

    /**
     * 更新预览
     */
    updatePreview() {
        if (!this.previewStyleSheet) return;

        // 生成CSS规则
        const cssRules = Object.entries(this.currentTheme.styles)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ');

        // 应用到预览区域
        this.previewStyleSheet.textContent = `
            #theme-preview-pane {
                ${cssRules}
            }
            #theme-preview-pane h1,
            #theme-preview-pane h2,
            #theme-preview-pane h3,
            #theme-preview-pane p,
            #theme-preview-pane a,
            #theme-preview-pane blockquote,
            #theme-preview-pane code {
                ${cssRules}
            }
        `;

        window.Logger.debug('Theme preview updated');
    },

    /**
     * 保存主题
     */
    saveTheme() {
        try {
            if (!window.themeService) {
                throw new Error('Theme service not available');
            }

            // 保存主题
            window.themeService.updateTheme(this.currentTheme);
            
            // 显示成功消息
            this.showSuccessMessage('主题保存成功！');
            
            // 延迟返回主题库
            setTimeout(() => {
                window.location.hash = '#themes';
            }, 1000);
            
        } catch (error) {
            window.Logger.error('Failed to save theme', error);
            window.ErrorHandler.handle(error, 'EnhancedThemeEditor.saveTheme');
        }
    },

    /**
     * 显示成功消息
     */
    showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'theme-editor-notification success';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2000);
    },

    /**
     * 重置主题到默认值
     */
    resetToDefaults() {
        const confirmReset = confirm('确定要重置所有设置到默认值吗？此操作无法撤销。');
        if (!confirmReset) return;

        // 获取默认主题样式
        const defaultStyles = window.QulomeConfig?.theme?.defaultStyles || {};
        
        // 更新当前主题
        this.currentTheme.styles = { ...defaultStyles };
        
        // 重新渲染表单
        this.renderEditor();
        this.bindEvents();
        this.updatePreview();
        
        window.Logger.debug('Theme reset to defaults');
    },

    /**
     * 清理资源
     */
    cleanup() {
        clearTimeout(this.updateTimer);
        
        if (this.previewStyleSheet) {
            this.previewStyleSheet.remove();
            this.previewStyleSheet = null;
        }
        
        this.formControls.clear();
        this.currentTheme = null;
        
        window.Logger.debug('Enhanced theme editor cleaned up');
    }
};