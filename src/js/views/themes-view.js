import { Storage } from '../utils/storage.js';

/**
 * ThemesView 模块
 * 负责主题库界面的所有逻辑
 */
export class ThemesView {
    /**
     * @param {function(string, string): void} showMessageCallback - 显示通知的回调函数
     */
    constructor(showMessageCallback) {
        if (typeof showMessageCallback !== 'function') {
            throw new Error('ThemesView需要一个有效的回调函数来显示消息');
        }
        this.showMessage = showMessageCallback;
        this.init();
    }

    /**
     * 初始化主题库和事件监听器
     */
    init() {
        this.setupEventListeners();
        this.loadThemes();
        this.setupThemeEditor();
    }

    /**
     * 设置主题库界面的事件监听器
     */
    setupEventListeners() {
        // 新建主题按钮
        document.getElementById('create-theme')?.addEventListener('click', () => {
            this.openThemeEditor();
        });
    }

    /**
     * 加载主题库
     */
    loadThemes() {
        // 默认主题数据
        const defaultThemes = [
            {
                id: 'theme-elegant',
                name: '阅读——橙黄V.03',
                description: '优雅精致的设计风格',
                category: 'elegant',
                preview: '优雅、精致、高品质'
            },
            {
                id: 'theme-business',
                name: '商务风格',
                description: '专业的商务文档风格',
                category: 'business',
                preview: '专业、严谨、商务范'
            },
            {
                id: 'theme-creative',
                name: '创意风格',
                description: '富有创意的设计风格',
                category: 'creative',
                preview: '创意、活泼、个性化'
            },
            {
                id: 'theme-minimal',
                name: '简约风格',
                description: '干净简洁的设计风格',
                category: 'minimal',
                preview: '简约、优雅、专注内容'
            }
        ];

        const themes = Storage.loadJSON('qulome_themes', defaultThemes);
        this.renderThemesGrid(themes);
    }

    /**
     * 渲染主题网格
     * @param {Array} themes - 主题数组
     */
    renderThemesGrid(themes) {
        const themesGrid = document.getElementById('themes-grid');
        if (!themesGrid) return;

        // 定义主题卡片的渐变背景色
        const themeColors = {
            'theme-elegant': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
            'theme-business': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'theme-creative': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'theme-minimal': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        };

        themesGrid.innerHTML = '';
        themes.forEach(theme => {
            const themeCard = document.createElement('div');
            themeCard.className = 'theme-card';
            themeCard.dataset.themeId = theme.id;
            
            // 设置渐变背景
            const gradientBg = themeColors[theme.id] || 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
            
            themeCard.innerHTML = `
                <div class="theme-preview" style="background: ${gradientBg};">
                    <div class="theme-preview-content">
                        <h4>标题样式</h4>
                        <p>这是一段示例文本，展示主题的整体风格。</p>
                        <a href="#" class="theme-link">链接样式</a>
                        <blockquote>引用样式展示</blockquote>
                        <ul><li>列表项目</li></ul>
                    </div>
                </div>
                <div class="theme-info">
                    <div class="theme-title">${theme.name}</div>
                    <div class="theme-description">${theme.description}</div>
                    <div class="theme-actions">
                        <button class="theme-btn theme-btn-primary" data-action="apply" data-theme="${theme.id}">
                            <i class="fas fa-play"></i>
                            开始
                        </button>
                        <button class="theme-btn theme-btn-danger" data-action="delete" data-theme="${theme.id}">
                            <i class="fas fa-trash"></i>
                            删除
                        </button>
                    </div>
                </div>
            `;

            // 添加卡片点击事件（点击卡片其他区域进入编辑）
            themeCard.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                this.editTheme(theme.id);
            });

            // 按钮事件
            themeCard.querySelectorAll('.theme-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    const themeId = btn.dataset.theme;
                    
                    switch (action) {
                        case 'apply':
                            this.applyTheme(themeId);
                            break;
                        case 'delete':
                            this.deleteTheme(themeId);
                            break;
                    }
                });
            });

            themesGrid.appendChild(themeCard);
        });
    }

    /**
     * 设置主题编辑器
     */
    setupThemeEditor() {
        // 手风琴展开/折叠
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const target = header.dataset.target;
                const content = document.getElementById(target);
                const isActive = header.classList.contains('active');

                // 关闭所有其他手风琴
                document.querySelectorAll('.accordion-header').forEach(h => {
                    h.classList.remove('active');
                });
                document.querySelectorAll('.accordion-content').forEach(c => {
                    c.classList.remove('active');
                });

                // 切换当前手风琴
                if (!isActive) {
                    header.classList.add('active');
                    content.classList.add('active');
                }
            });
        });

        // 关闭主题编辑器
        document.getElementById('close-theme-editor')?.addEventListener('click', () => {
            this.closeThemeEditor();
        });

        // 滑块值实时更新
        this.setupRangeInputs();
        
        // 颜色选择器
        this.setupColorPickers();
        
        // 样式选项
        this.setupStyleOptions();
        
        // 保存和重置
        document.getElementById('save-theme')?.addEventListener('click', () => {
            this.saveCustomTheme();
        });
        
        document.getElementById('reset-theme')?.addEventListener('click', () => {
            this.resetThemeEditor();
        });
    }

    /**
     * 设置滑块输入
     */
    setupRangeInputs() {
        const rangeInputs = document.querySelectorAll('.form-range');
        rangeInputs.forEach(input => {
            const valueDisplay = document.getElementById(input.id + '-value');
            
            input.addEventListener('input', () => {
                const value = input.value;
                const unit = input.id.includes('size') || input.id.includes('margin') || input.id.includes('padding') || input.id.includes('width') ? 'px' : '';
                
                if (valueDisplay) {
                    valueDisplay.textContent = value + unit;
                }
                
                this.updateThemePreview();
            });
        });
    }

    /**
     * 设置颜色选择器
     */
    setupColorPickers() {
        const colorInputs = document.querySelectorAll('.color-input');
        colorInputs.forEach(input => {
            const textInput = document.getElementById(input.id.replace('-color', '-color-text'));
            
            input.addEventListener('change', () => {
                if (textInput) {
                    textInput.value = input.value;
                }
                this.updateThemePreview();
            });
            
            if (textInput) {
                textInput.addEventListener('change', () => {
                    input.value = textInput.value;
                    this.updateThemePreview();
                });
            }
        });

        // 预设颜色
        document.querySelectorAll('.preset-color').forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.dataset.color;
                const colorInput = preset.closest('.form-group').querySelector('.color-input');
                const textInput = preset.closest('.form-group').querySelector('[id$="-color-text"]');
                
                if (colorInput) colorInput.value = color;
                if (textInput) textInput.value = color;
                
                // 更新活动状态
                preset.closest('.preset-colors').querySelectorAll('.preset-color').forEach(p => {
                    p.classList.remove('active');
                });
                preset.classList.add('active');
                
                this.updateThemePreview();
            });
        });
    }

    /**
     * 设置样式选项
     */
    setupStyleOptions() {
        document.querySelectorAll('.style-option').forEach(option => {
            option.addEventListener('click', () => {
                // 更新同组选项的活动状态
                option.closest('.style-options').querySelectorAll('.style-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');
                
                this.updateThemePreview();
            });
        });
    }

    /**
     * 打开主题编辑器
     */
    openThemeEditor() {
        const editor = document.getElementById('themes-editor');
        if (editor) {
            editor.classList.add('active');
            this.updateThemePreview();
        }
    }

    /**
     * 关闭主题编辑器
     */
    closeThemeEditor() {
        const editor = document.getElementById('themes-editor');
        if (editor) {
            editor.classList.remove('active');
        }
    }

    /**
     * 选择主题
     * @param {string} themeId - 主题ID
     */
    selectTheme(themeId) {
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.remove('active');
        });
        
        const selectedCard = document.querySelector(`[data-theme="${themeId}"]`)?.closest('.theme-card');
        if (selectedCard) {
            selectedCard.classList.add('active');
        }
    }

    /**
     * 应用主题
     * @param {string} themeId - 主题ID
     */
    applyTheme(themeId) {
        const themes = Storage.loadJSON('qulome_themes', []);
        const theme = themes.find(t => t.id === themeId);
        
        if (!theme) {
            this.showMessage('主题不存在', 'error');
            return;
        }

        // 保存当前应用的主题
        Storage.saveJSON('qulome_current_theme', theme);
        
        this.showMessage(`主题"${theme.name}"已应用，正在跳转到编辑器...`, 'success');
        
        // 延迟跳转到编辑器
        setTimeout(() => {
            // 触发界面切换到编辑器
            const editorBtn = document.querySelector('.sidebar-nav .nav-item[data-view="editor"]');
            if (editorBtn) {
                editorBtn.click();
            }
        }, 1000);
    }

    /**
     * 编辑主题
     * @param {string} themeId - 主题ID
     */
    editTheme(themeId) {
        this.openThemeEditor();
        this.showMessage(`正在编辑主题: ${themeId}`, 'info');
    }

    /**
     * 预览主题
     * @param {string} themeId - 主题ID
     */
    previewTheme(themeId) {
        this.showMessage(`预览主题: ${themeId}`, 'info');
        // 这里可以添加主题预览逻辑
    }

    /**
     * 更新主题预览
     */
    updateThemePreview() {
        const previewContent = document.getElementById('theme-preview-content');
        if (!previewContent) return;

        const settings = this.getCurrentStyles();
        const applyStyles = (element, styles) => Object.assign(element.style, styles);

        const h1 = previewContent.querySelector('h1');
        if (h1) applyStyles(h1, {
            fontSize: settings.titleSize,
            fontWeight: settings.titleWeight,
            color: settings.titleColor,
            lineHeight: settings.titleLineHeight
        });

        previewContent.querySelectorAll('p').forEach(p => applyStyles(p, {
            fontSize: settings.bodySize,
            lineHeight: settings.bodyLineHeight,
            marginBottom: settings.bodyMargin,
            color: settings.bodyColor
        }));

        const link = previewContent.querySelector('a');
        if (link) link.style.color = settings.linkColor;

        const code = previewContent.querySelector('code');
        if (code) applyStyles(code, {
            backgroundColor: settings.codeBgColor,
            color: settings.codeTextColor,
            padding: settings.codePadding,
            borderRadius: settings.codeRadius
        });

        const hr = previewContent.querySelector('hr');
        if (hr) applyStyles(hr, {
            borderColor: settings.dividerColor,
            borderWidth: settings.dividerWidth,
            margin: settings.dividerMargin + ' 0'
        });
    }

    /**
     * 获取当前样式设置
     * @returns {Object} 样式设置对象
     */
    getCurrentStyles() {
        const getValue = (id, defaultValue = '') => {
            const element = document.getElementById(id);
            return element ? element.value : defaultValue;
        };

        return {
            titleSize: getValue('title-size', '24') + 'px',
            titleWeight: getValue('title-weight', '600'),
            titleColor: getValue('title-color', '#1d1d1f'),
            titleLineHeight: getValue('title-line-height', '1.4'),
            bodySize: getValue('body-size', '16') + 'px',
            bodyLineHeight: getValue('body-line-height', '1.6'),
            bodyMargin: getValue('body-margin', '16') + 'px',
            bodyColor: getValue('body-color', '#333333'),
            linkColor: getValue('link-color', '#667eea'),
            codeBgColor: getValue('code-bg-color', '#f5f5f5'),
            codeTextColor: getValue('code-text-color', '#333333'),
            codePadding: getValue('code-padding', '4') + 'px',
            codeRadius: getValue('code-radius', '4') + 'px',
            dividerColor: getValue('divider-color', '#e0e0e0'),
            dividerWidth: getValue('divider-width', '1') + 'px',
            dividerMargin: getValue('divider-margin', '20') + 'px'
        };
    }

    /**
     * 保存自定义主题
     */
    saveCustomTheme() {
        const newTheme = {
            id: 'custom-' + Date.now(),
            name: '自定义主题 ' + new Date().toLocaleString(),
            description: '用户自定义主题',
            category: 'custom',
            preview: '自定义样式预览',
            styles: this.getCurrentStyles(),
            createdAt: new Date().toISOString()
        };

        const themes = Storage.loadJSON('qulome_themes', []);
        themes.push(newTheme);
        const result = Storage.saveJSON('qulome_themes', themes);

        if (result.success) {
            this.showMessage('主题已保存', 'success');
            this.loadThemes();
            this.closeThemeEditor();
        } else {
            this.showMessage(`保存失败: ${result.error}`, 'error');
        }
    }

    /**
     * 重置主题编辑器
     */
    resetThemeEditor() {
        // 重置所有表单控件到默认值
        const resetValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        };

        // 重置标题样式
        resetValue('title-size', '24');
        resetValue('title-weight', '600');
        resetValue('title-color', '#1d1d1f');
        resetValue('title-line-height', '1.4');

        // 重置正文样式
        resetValue('body-size', '16');
        resetValue('body-line-height', '1.6');
        resetValue('body-margin', '16');
        resetValue('body-color', '#333333');

        // 重置链接样式
        resetValue('link-color', '#667eea');

        // 重置代码样式
        resetValue('code-bg-color', '#f5f5f5');
        resetValue('code-text-color', '#333333');
        resetValue('code-padding', '4');
        resetValue('code-radius', '4');

        // 重置分隔线样式
        resetValue('divider-color', '#e0e0e0');
        resetValue('divider-width', '1');
        resetValue('divider-margin', '20');

        // 更新显示值
        document.querySelectorAll('.form-range').forEach(input => {
            const valueDisplay = document.getElementById(input.id + '-value');
            if (valueDisplay) {
                const unit = input.id.includes('size') || input.id.includes('margin') || input.id.includes('padding') || input.id.includes('width') ? 'px' : '';
                valueDisplay.textContent = input.value + unit;
            }
        });

        // 重置样式选项
        document.querySelectorAll('.style-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelectorAll('.style-option[data-style="none"]').forEach(option => {
            option.classList.add('active');
        });

        this.updateThemePreview();
        this.showMessage('已重置为默认设置', 'info');
    }

    /**
     * 删除主题
     * @param {string} themeId - 主题ID
     */
    deleteTheme(themeId) {
        const themes = Storage.loadJSON('qulome_themes', []);
        const themeIndex = themes.findIndex(t => t.id === themeId);
        
        if (themeIndex === -1) {
            this.showMessage('主题不存在', 'error');
            return;
        }

        const theme = themes[themeIndex];
        
        // 确认删除
        if (!confirm(`确定要删除主题"${theme.name}"吗？此操作无法撤销。`)) {
            return;
        }

        // 从数组中移除
        themes.splice(themeIndex, 1);
        
        // 保存到localStorage
        const result = Storage.saveJSON('qulome_themes', themes);
        
        if (result.success) {
            this.showMessage(`主题"${theme.name}"已删除`, 'success');
            this.renderThemesGrid(themes); // 重新渲染网格
        } else {
            this.showMessage(`删除失败: ${result.error}`, 'error');
        }
    }

    /**
     * 刷新主题库显示
     */
    refresh() {
        this.loadThemes();
    }
} 