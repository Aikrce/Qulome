/**
 * Theme Editor View Module
 * 
 * 负责主题编辑器的渲染、事件绑定和交互逻辑。
 * - 使用静态HTML结构
 * - 通过URL参数获取主题ID
 * - 实时预览主题样式
 * - 统一事件绑定管理
 * - 错误处理和用户反馈
 */
window.ThemeEditorView = {
    // State management
    isInitialized: false,
    currentTheme: null,
    eventHandlers: new Map(),

    /**
     * 初始化主题编辑器视图
     * @param {Object} theme - 要编辑的主题对象
     */
    init: (theme) => {
        try {
            if (window.ThemeEditorView.isInitialized) {
                window.Logger.debug('ThemeEditorView already initialized, refreshing...');
                window.ThemeEditorView.loadTheme(theme);
                return;
            }

            window.ThemeEditorView.currentTheme = theme;
            window.ThemeEditorView.setupForm();
            window.ThemeEditorView.bindEvents();
            window.ThemeEditorView.isInitialized = true;
            window.Logger.debug('ThemeEditorView initialized successfully');
        } catch (error) {
            window.Logger.error('Failed to initialize ThemeEditorView', error);
            window.ThemeEditorView.showError('主题编辑器初始化失败，请刷新页面重试');
        }
    },

    /**
     * 清理事件处理器和资源
     */
    cleanup: () => {
        window.ThemeEditorView.eventHandlers.forEach((handler, element) => {
            if (element && typeof element.removeEventListener === 'function') {
                element.removeEventListener(handler.event, handler.callback);
            }
        });
        window.ThemeEditorView.eventHandlers.clear();
        window.ThemeEditorView.isInitialized = false;
        window.ThemeEditorView.currentTheme = null;
        window.Logger.debug('ThemeEditorView cleaned up');
    },

    /**
     * 添加事件处理器并跟踪以便清理
     */
    addEventHandler: (element, event, callback) => {
        if (!element) return;
        
        // 移除现有处理器（如果存在）
        const existingHandler = window.ThemeEditorView.eventHandlers.get(element);
        if (existingHandler && existingHandler.event === event) {
            element.removeEventListener(event, existingHandler.callback);
        }

        // 添加新处理器
        element.addEventListener(event, callback);
        window.ThemeEditorView.eventHandlers.set(element, { event, callback });
    },

    /**
     * 设置表单内容
     */
    setupForm: () => {
        try {
            const theme = window.ThemeEditorView.currentTheme;
            if (!theme) {
                throw new Error('主题对象未找到');
            }

            // 更新标题
            const titleElement = document.getElementById('theme-editor-title');
            if (titleElement) {
                titleElement.textContent = `编辑主题: ${theme.name}`;
            }

            // 设置表单字段值
            const formFields = [
                '--h1-color', '--h2-color', '--h3-color',
                '--p-color', '--p-font-size', '--a-color',
                '--blockquote-bg', '--code-bg', '--p-margin-bottom'
            ];

            formFields.forEach(fieldId => {
                const input = document.getElementById(fieldId);
                if (input && theme.styles[fieldId]) {
                    if (input.type === 'range') {
                        // 处理范围输入
                        const value = theme.styles[fieldId].replace('px', '');
                        input.value = value;
                        const rangeValue = input.nextElementSibling;
                        if (rangeValue) {
                            rangeValue.textContent = `${value}px`;
                        }
                    } else {
                        input.value = theme.styles[fieldId];
                    }
                }
            });

            // 更新预览
            window.ThemeEditorView.updatePreview();
            
            window.Logger.debug('Theme editor form setup completed');
        } catch (error) {
            window.Logger.error('Failed to setup form', error);
            window.ThemeEditorView.showError('表单设置失败');
        }
    },

    /**
     * 加载主题数据
     */
    loadTheme: (theme) => {
        try {
            window.ThemeEditorView.currentTheme = theme;
            window.ThemeEditorView.setupForm();
            window.Logger.debug('Theme loaded successfully', theme.name);
        } catch (error) {
            window.Logger.error('Failed to load theme', error);
            window.ThemeEditorView.showError('主题加载失败');
        }
    },

    /**
     * 绑定事件处理器
     */
    bindEvents: () => {
        try {
            // 绑定标签页切换
            const tabButtons = document.querySelectorAll('.tab-btn');
            tabButtons.forEach(button => {
                window.ThemeEditorView.addEventHandler(button, 'click', (event) => {
                    window.ThemeEditorView.switchTab(event.target.dataset.tab);
                });
            });

            // 绑定表单输入变化
            const form = document.getElementById('theme-editor-form');
            if (form) {
                window.ThemeEditorView.addEventHandler(form, 'input', (event) => {
                    window.ThemeEditorView.handleInputChange(event);
                });
                window.ThemeEditorView.addEventHandler(form, 'change', (event) => {
                    window.ThemeEditorView.handleInputChange(event);
                });
            }

            // 绑定保存按钮
            const saveButton = document.getElementById('save-theme-btn');
            if (saveButton) {
                window.ThemeEditorView.addEventHandler(saveButton, 'click', () => {
                    window.ThemeEditorView.saveTheme();
                });
            }

            window.Logger.debug('ThemeEditorView events bound successfully');
        } catch (error) {
            window.Logger.error('Failed to bind events', error);
            window.ThemeEditorView.showError('事件绑定失败');
        }
    },

    /**
     * 切换标签页
     */
    switchTab: (tabName) => {
        try {
            // 移除所有活动状态
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            // 激活选中的标签页
            const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
            const activeContent = document.getElementById(`${tabName}-tab`);

            if (activeButton) activeButton.classList.add('active');
            if (activeContent) activeContent.classList.add('active');

            window.Logger.debug(`Switched to tab: ${tabName}`);
        } catch (error) {
            window.Logger.error('Failed to switch tab', error);
        }
    },

    /**
     * 处理输入变化
     */
    handleInputChange: (event) => {
        try {
            const input = event.target;
            const fieldName = input.name;
            let value = input.value;

            // 处理范围输入
            if (input.type === 'range') {
                value = `${value}px`;
                const rangeValue = input.nextElementSibling;
                if (rangeValue) {
                    rangeValue.textContent = value;
                }
            }

            // 更新主题样式
            if (window.ThemeEditorView.currentTheme && fieldName) {
                window.ThemeEditorView.currentTheme.styles[fieldName] = value;
                window.Logger.debug(`Updated theme style: ${fieldName} = ${value}`);
            }

            // 使用节流更新预览，防止频繁更新导致卡死
            if (window.PerformanceMonitor) {
                window.PerformanceMonitor.throttle(() => {
                    window.ThemeEditorView.updatePreview();
                }, window.QulomeConfig?.performance?.previewUpdateDelay || 300)();
            } else {
                window.ThemeEditorView.updatePreview();
            }
        } catch (error) {
            window.Logger.error('Failed to handle input change', error);
        }
    },

    /**
     * 更新预览
     */
    updatePreview: () => {
        try {
            const theme = window.ThemeEditorView.currentTheme;
            if (!theme) return;
            const previewPane = document.getElementById('theme-preview-pane');
            if (!previewPane) return;
            // 结构：h1/h2/h3前后加span用于左右竖线
            previewPane.innerHTML = `
                <h1>
                  <span class="h1-decor left" style="display:${theme.styles['--h1-border-left-show']==='none'?'none':'inline-block'}"></span>
                  这是主标题样式 H1
                  <span class="h1-decor right" style="display:${theme.styles['--h1-border-right-show']==='inline-block'?'inline-block':'none'}"></span>
                </h1>
                <h2>
                  <span class="h2-decor left" style="display:${theme.styles['--h2-border-left-show']==='none'?'none':'inline-block'}"></span>
                  这是章节标题样式 H2
                  <span class="h2-decor right" style="display:${theme.styles['--h2-border-right-show']==='inline-block'?'inline-block':'none'}"></span>
                </h2>
                <h3>
                  <span class="h3-decor left" style="display:${theme.styles['--h3-border-left-show']==='none'?'none':'inline-block'}"></span>
                  这是小节标题样式 H3
                  <span class="h3-decor right" style="display:${theme.styles['--h3-border-right-show']==='inline-block'?'inline-block':'none'}"></span>
                </h3>
                <p>这是正文段落样式。微信文章排版需要考虑移动端阅读体验，字体大小、行高、颜色对比度都很重要。这里有一个<a href="#">链接样式</a>的示例，还有<strong>相体强调</strong>和<em>斜体强调</em>。</p>
                <blockquote>这是引用块的样式示例。引用内容应与正文有明显的视觉区分，通常使用左侧竖线和背景色。</blockquote>
                <ul><li>这是无序列表项目一</li><li>这是无序列表项目二</li></ul>
                <ol><li>这是有序列表项目一</li><li>这是有序列表项目二</li></ol>
                <hr />
            `;
            // 应用主题样式到预览区域
            Object.entries(theme.styles).forEach(([key, value]) => {
                previewPane.style.setProperty(key, value);
            });
        } catch (error) {
            window.Logger.error('Failed to update preview', error);
        }
    },

    /**
     * 保存主题
     */
    saveTheme: () => {
        try {
            const theme = window.ThemeEditorView.currentTheme;
            if (!theme) {
                throw new Error('主题对象未找到');
            }

            // 更新主题
            window.themeService.updateTheme(theme);
            
            // 显示成功消息
            window.ThemeEditorView.showSuccess(`主题 "${theme.name}" 保存成功！`);
            
            // 返回主题库
            setTimeout(() => {
                window.location.hash = '#themes';
            }, 1000);

            window.Logger.debug('Theme saved successfully', theme.name);
        } catch (error) {
            window.Logger.error('Failed to save theme', error);
            window.ThemeEditorView.showError(error.message || '保存主题失败');
        }
    },

    /**
     * 显示成功消息
     */
    showSuccess: (message) => {
        // 简单的成功提示，可以后续改进为更好的通知系统
        alert(`✅ ${message}`);
    },

    /**
     * 显示错误消息
     */
    showError: (message) => {
        alert(`❌ ${message}`);
    }
}; 