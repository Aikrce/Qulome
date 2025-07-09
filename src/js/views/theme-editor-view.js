/**
 * Theme Editor View Module
 * 
 * 完整的主题编辑器，支持6个Tab分类和实时预览
 */
window.ThemeEditorView = {
    // 当前编辑的主题
    currentTheme: null,
    // 事件处理器追踪
    eventHandlers: new Map(),
    // 当前激活的Tab
    activeTab: 'basic',

    /**
     * 初始化主题编辑器
     * @param {Object} theme - 要编辑的主题
     */
    init(theme) {
        try {
            this.cleanup();
            this.currentTheme = JSON.parse(JSON.stringify(theme));
            
            // 渲染完整的编辑器界面
            this.renderEditor();
            
            // 绑定所有事件
            this.bindAllEvents();
            
            // 初始化预览
            this.updatePreview();
            
            window.Logger.debug('ThemeEditorView initialized successfully');
        } catch (error) {
            window.Logger.error('Failed to initialize ThemeEditorView', error);
            window.StandardErrorHandler.handle(error, 'ThemeEditorView.init', {
                recovery: () => {
                    window.location.hash = '#themes';
                }
            });
        }
    },

    /**
     * 渲染编辑器界面
     */
    renderEditor() {
        const container = document.getElementById('theme-editor-container');
        if (!container) return;
        
        container.innerHTML = this.getEditorHTML();
    },

    /**
     * 获取编辑器HTML结构
     */
    getEditorHTML() {
        const escape = window.ThemeUtils ? window.ThemeUtils.escapeHtml : (text) => text;
        
        return `
            <div class="theme-editor-content">
                <div class="theme-editor-header">
                    <h2>主题编辑器: ${escape(this.currentTheme.name)}</h2>
                    <button class="theme-editor-close" onclick="window.location.hash='#themes'">&times;</button>
                </div>
                <div class="theme-editor-body">
                    <div class="theme-editor-sidebar">
                        <div class="editor-tabs">
                            <button class="tab-btn active" data-tab="basic">基础设置</button>
                            <button class="tab-btn" data-tab="title">标题系统</button>
                            <button class="tab-btn" data-tab="text">正文系统</button>
                            <button class="tab-btn" data-tab="special">特殊文本</button>
                            <button class="tab-btn" data-tab="block">块级元素</button>
                            <button class="tab-btn" data-tab="layout">视觉分隔</button>
                        </div>
                        <div class="editor-form">
                            <div class="tab-content active" data-tab="basic">
                                ${this.getBasicSettingsHTML()}
                            </div>
                            <div class="tab-content" data-tab="title" style="display: none;">
                                ${this.getTitleSettingsHTML()}
                            </div>
                            <div class="tab-content" data-tab="text" style="display: none;">
                                ${this.getTextSettingsHTML()}
                            </div>
                            <div class="tab-content" data-tab="special" style="display: none;">
                                ${this.getSpecialTextSettingsHTML()}
                            </div>
                            <div class="tab-content" data-tab="block" style="display: none;">
                                ${this.getBlockSettingsHTML()}
                            </div>
                            <div class="tab-content" data-tab="layout" style="display: none;">
                                ${this.getLayoutSettingsHTML()}
                            </div>
                        </div>
                    </div>
                    <div class="theme-editor-preview">
                        <h3>实时预览</h3>
                        <div class="preview-content">
                            <h1 class="preview-h1">这是主标题 H1</h1>
                            <h2 class="preview-h2">这是章节标题 H2</h2>
                            <h3 class="preview-h3">这是小节标题 H3</h3>
                            <p class="preview-p">这是正文段落。排版需要考虑移动端阅读体验，字体、行高、颜色都很重要。这是一个<a href="#" class="preview-a">链接</a>，还有<strong class="preview-strong">粗体</strong>和<em class="preview-em">斜体</em>。</p>
                            <blockquote class="preview-blockquote">这是引用块。引用内容应与正文有明显视觉区分。</blockquote>
                            <pre class="preview-code-block"><code>// 这是代码块
function helloWorld() {
    console.log('Hello, World!');
}</code></pre>
                            <ul class="preview-ul"><li>无序列表项 1</li><li>无序列表项 2</li></ul>
                            <ol class="preview-ol"><li>有序列表项 1</li><li>有序列表项 2</li></ol>
                            <hr class="preview-hr">
                        </div>
                    </div>
                </div>
                <div class="theme-editor-footer">
                    <button id="reset-theme-edit" class="btn btn-secondary">恢复默认</button>
                    <div>
                        <button id="cancel-theme-edit" class="btn btn-secondary" onclick="window.location.hash='#themes'">取消</button>
                        <button id="save-theme-edit" class="btn btn-primary">保存主题</button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 获取基础设置HTML
     */
    getBasicSettingsHTML() {
        const getStyle = (key, defaultValue) => (this.currentTheme.styles || {})[key] || defaultValue;
        
        return `
            <div class="form-section">
                <h4>主题配色</h4>
                <div class="form-row">
                    <label>主题色:</label>
                    <input type="color" id="theme-primary" value="${getStyle('--theme-primary', '#0E2A73')}">
                    <span class="color-desc">用于重要标题和强调</span>
                </div>
                <div class="form-row">
                    <label>辅助色:</label>
                    <input type="color" id="theme-secondary" value="${getStyle('--theme-secondary', '#E0A26F')}">
                    <span class="color-desc">用于装饰和次级强调</span>
                </div>
                <div class="form-row">
                    <label>正文色:</label>
                    <input type="color" id="text-primary" value="${getStyle('--text-primary', '#333333')}">
                    <span class="color-desc">正文主要颜色</span>
                </div>
            </div>
        `;
    },

    /**
     * 获取标题系统设置HTML
     */
    getTitleSettingsHTML() {
        const getStyle = (key, defaultValue) => (this.currentTheme.styles || {})[key] || defaultValue;
        const getNum = (key, defaultValue) => parseFloat(getStyle(key, defaultValue));
        const getSelected = (key, value) => getStyle(key, '') === value ? 'selected' : '';
        
        return `
            <div class="form-section">
                <h4>H1 主标题</h4>
                <div class="form-row"><label>颜色:</label><input type="color" id="h1-color" value="${getStyle('--h1-color', '#1F2937')}"></div>
                <div class="form-row"><label>字号:</label><input type="range" id="h1-size" min="16" max="48" value="${getNum('--h1-font-size', 24)}"><span class="range-value">${getNum('--h1-font-size', 24)}px</span></div>
                <div class="form-row"><label>字重:</label><select id="h1-weight"><option value="400" ${getSelected('--h1-font-weight','400')}>400</option><option value="500" ${getSelected('--h1-font-weight','500')}>500</option><option value="600" ${getSelected('--h1-font-weight','600')}>600</option><option value="700" ${getSelected('--h1-font-weight','700')}>700</option><option value="800" ${getSelected('--h1-font-weight','800')}>800</option></select></div>
                <div class="form-row"><label>对齐:</label><select id="h1-align"><option value="left" ${getSelected('--h1-text-align','left')}>左对齐</option><option value="center" ${getSelected('--h1-text-align','center')}>居中</option><option value="right" ${getSelected('--h1-text-align','right')}>右对齐</option></select></div>
            </div>
            <div class="form-section">
                <h4>H2 章节标题</h4>
                <div class="form-row"><label>颜色:</label><input type="color" id="h2-color" value="${getStyle('--h2-color', '#374151')}"></div>
                <div class="form-row"><label>字号:</label><input type="range" id="h2-size" min="14" max="36" value="${getNum('--h2-font-size', 20)}"><span class="range-value">${getNum('--h2-font-size', 20)}px</span></div>
                <div class="form-row"><label>字重:</label><select id="h2-weight"><option value="400" ${getSelected('--h2-font-weight','400')}>400</option><option value="500" ${getSelected('--h2-font-weight','500')}>500</option><option value="600" ${getSelected('--h2-font-weight','600')}>600</option><option value="700" ${getSelected('--h2-font-weight','700')}>700</option></select></div>
            </div>
            <div class="form-section">
                <h4>H3 小节标题</h4>
                <div class="form-row"><label>颜色:</label><input type="color" id="h3-color" value="${getStyle('--h3-color', '#4B5563')}"></div>
                <div class="form-row"><label>字号:</label><input type="range" id="h3-size" min="12" max="28" value="${getNum('--h3-font-size', 18)}"><span class="range-value">${getNum('--h3-font-size', 18)}px</span></div>
                <div class="form-row"><label>字重:</label><select id="h3-weight"><option value="400" ${getSelected('--h3-font-weight','400')}>400</option><option value="500" ${getSelected('--h3-font-weight','500')}>500</option><option value="600" ${getSelected('--h3-font-weight','600')}>600</option><option value="700" ${getSelected('--h3-font-weight','700')}>700</option></select></div>
            </div>
        `;
    },

    /**
     * 获取正文系统设置HTML
     */
    getTextSettingsHTML() {
        const getStyle = (key, defaultValue) => (this.currentTheme.styles || {})[key] || defaultValue;
        const getNum = (key, defaultValue) => parseFloat(getStyle(key, defaultValue));
        const getSelected = (key, value) => getStyle(key, '') === value ? 'selected' : '';
        
        return `
            <div class="form-section">
                <h4>正文段落</h4>
                <div class="form-row"><label>颜色:</label><input type="color" id="p-color" value="${getStyle('--p-color', '#333333')}"></div>
                <div class="form-row"><label>字号:</label><input type="range" id="p-size" min="12" max="20" value="${getNum('--p-font-size', 16)}"><span class="range-value">${getNum('--p-font-size', 16)}px</span></div>
                <div class="form-row"><label>行高:</label><input type="range" id="p-line-height" min="1.2" max="2.5" step="0.1" value="${getNum('--p-line-height', 1.7)}"><span class="range-value">${getNum('--p-line-height', 1.7)}</span></div>
                <div class="form-row"><label>段落间距:</label><input type="range" id="p-margin" min="0" max="40" value="${getNum('--p-margin-bottom', 20)}"><span class="range-value">${getNum('--p-margin-bottom', 20)}px</span></div>
                <div class="form-row"><label>对齐方式:</label><select id="p-align"><option value="left" ${getSelected('--p-text-align','left')}>左对齐</option><option value="center" ${getSelected('--p-text-align','center')}>居中</option><option value="right" ${getSelected('--p-text-align','right')}>右对齐</option><option value="justify" ${getSelected('--p-text-align','justify')}>两端对齐</option></select></div>
            </div>
            <div class="form-section">
                <h4>字体设置</h4>
                <div class="form-row"><label>字体族:</label><select id="font-family">
                    <option value="system-ui, -apple-system, sans-serif" ${getSelected('--p-font-family','system-ui, -apple-system, sans-serif')}>系统默认</option>
                    <option value="'Helvetica Neue', Helvetica, Arial, sans-serif" ${getSelected('--p-font-family','\'Helvetica Neue\', Helvetica, Arial, sans-serif')}>Helvetica</option>
                    <option value="Georgia, 'Times New Roman', serif" ${getSelected('--p-font-family','Georgia, \'Times New Roman\', serif')}>Georgia</option>
                    <option value="'SF Pro Text', -apple-system, sans-serif" ${getSelected('--p-font-family','\'SF Pro Text\', -apple-system, sans-serif')}>SF Pro</option>
                    <option value="'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif" ${getSelected('--p-font-family','\'PingFang SC\', \'Hiragino Sans GB\', \'Microsoft YaHei\', sans-serif')}>中文优化</option>
                </select></div>
            </div>
        `;
    },

    /**
     * 获取特殊文本设置HTML
     */
    getSpecialTextSettingsHTML() {
        const getStyle = (key, defaultValue) => (this.currentTheme.styles || {})[key] || defaultValue;
        
        return `
            <div class="form-section">
                <h4>链接样式</h4>
                <div class="form-row"><label>链接颜色:</label><input type="color" id="a-color" value="${getStyle('--a-color', '#0000EE')}"></div>
                <div class="form-row"><label>悬停颜色:</label><input type="color" id="a-hover-color" value="${getStyle('--a-hover-color', '#EE0000')}"></div>
            </div>
            <div class="form-section">
                <h4>强调文本</h4>
                <div class="form-row"><label>粗体颜色:</label><input type="color" id="strong-color" value="${getStyle('--strong-color', '#000000')}"></div>
                <div class="form-row"><label>斜体颜色:</label><input type="color" id="em-color" value="${getStyle('--em-color', '#000000')}"></div>
            </div>
            <div class="form-section">
                <h4>行内代码</h4>
                <div class="form-row"><label>代码颜色:</label><input type="color" id="code-color" value="${getStyle('--code-color', '#E83E8C')}"></div>
                <div class="form-row"><label>代码背景:</label><input type="color" id="code-bg" value="${getStyle('--code-bg', '#F8F8F8')}"></div>
            </div>
        `;
    },

    /**
     * 获取块级元素设置HTML
     */
    getBlockSettingsHTML() {
        const getStyle = (key, defaultValue) => (this.currentTheme.styles || {})[key] || defaultValue;
        const getNum = (key, defaultValue) => parseFloat(getStyle(key, defaultValue));
        
        return `
            <div class="form-section">
                <h4>引用块样式</h4>
                <div class="form-row"><label>文字颜色:</label><input type="color" id="blockquote-color" value="${getStyle('--blockquote-color', '#666666')}"></div>
                <div class="form-row"><label>背景颜色:</label><input type="color" id="blockquote-bg" value="${getStyle('--blockquote-bg', '#F9F9F9')}"></div>
                <div class="form-row"><label>边框颜色:</label><input type="color" id="blockquote-border" value="${getStyle('--blockquote-border-color', '#CCCCCC')}"></div>
                <div class="form-row"><label>内边距:</label><input type="range" id="blockquote-padding" min="10" max="40" value="${getNum('--blockquote-padding', 20)}"><span class="range-value">${getNum('--blockquote-padding', 20)}px</span></div>
            </div>
            <div class="form-section">
                <h4>代码块样式</h4>
                <div class="form-row"><label>文字颜色:</label><input type="color" id="code-block-color" value="${getStyle('--code-block-color', '#FFFFFF')}"></div>
                <div class="form-row"><label>背景颜色:</label><input type="color" id="code-block-bg" value="${getStyle('--code-block-bg', '#282C34')}"></div>
                <div class="form-row"><label>内边距:</label><input type="range" id="code-block-padding" min="10" max="40" value="${getNum('--code-block-padding', 16)}"><span class="range-value">${getNum('--code-block-padding', 16)}px</span></div>
                <div class="form-row"><label>圆角大小:</label><input type="range" id="code-block-border-radius" min="0" max="16" value="${getNum('--code-block-border-radius', 6)}"><span class="range-value">${getNum('--code-block-border-radius', 6)}px</span></div>
            </div>
        `;
    },

    /**
     * 获取视觉分隔设置HTML
     */
    getLayoutSettingsHTML() {
        const getStyle = (key, defaultValue) => (this.currentTheme.styles || {})[key] || defaultValue;
        const getNum = (key, defaultValue) => parseFloat(getStyle(key, defaultValue));
        const getSelected = (key, value) => getStyle(key, '') === value ? 'selected' : '';
        
        return `
            <div class="form-section">
                <h4>分隔线样式</h4>
                <div class="form-row"><label>颜色:</label><input type="color" id="hr-color" value="${getStyle('--hr-color', '#EEEEEE')}"></div>
                <div class="form-row"><label>高度:</label><input type="range" id="hr-height" min="1" max="10" value="${getNum('--hr-height', 1)}"><span class="range-value">${getNum('--hr-height', 1)}px</span></div>
                <div class="form-row"><label>上下边距:</label><input type="range" id="hr-margin" min="10" max="60" value="${getNum('--hr-margin', 24)}"><span class="range-value">${getNum('--hr-margin', 24)}px</span></div>
            </div>
            <div class="form-section">
                <h4>列表样式</h4>
                <div class="form-row"><label>无序列表:</label><select id="ul-style">
                    <option value="disc" ${getSelected('--ul-list-style','disc')}>实心圆点</option>
                    <option value="circle" ${getSelected('--ul-list-style','circle')}>空心圆点</option>
                    <option value="square" ${getSelected('--ul-list-style','square')}>方块</option>
                    <option value="none" ${getSelected('--ul-list-style','none')}>无标记</option>
                </select></div>
                <div class="form-row"><label>有序列表:</label><select id="ol-style">
                    <option value="decimal" ${getSelected('--ol-list-style','decimal')}>数字</option>
                    <option value="decimal-leading-zero" ${getSelected('--ol-list-style','decimal-leading-zero')}>补零数字</option>
                    <option value="lower-roman" ${getSelected('--ol-list-style','lower-roman')}>小写罗马</option>
                    <option value="upper-roman" ${getSelected('--ol-list-style','upper-roman')}>大写罗马</option>
                    <option value="lower-alpha" ${getSelected('--ol-list-style','lower-alpha')}>小写字母</option>
                    <option value="upper-alpha" ${getSelected('--ol-list-style','upper-alpha')}>大写字母</option>
                </select></div>
                <div class="form-row"><label>列表缩进:</label><input type="range" id="list-padding" min="10" max="50" value="${getNum('--list-pl', 20)}"><span class="range-value">${getNum('--list-pl', 20)}px</span></div>
            </div>
        `;
    },

    /**
     * 绑定所有事件
     */
    bindAllEvents() {
        this.bindTabEvents();
        this.bindFormEvents();
        this.bindActionEvents();
    },

    /**
     * 绑定Tab切换事件
     */
    bindTabEvents() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });
    },

    /**
     * 切换Tab
     */
    switchTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            const shouldShow = content.dataset.tab === tabName;
            content.classList.toggle('active', shouldShow);
            content.style.display = shouldShow ? 'block' : 'none';
        });
        
        this.activeTab = tabName;
    },

    /**
     * 绑定表单事件
     */
    bindFormEvents() {
        const container = document.querySelector('.theme-editor-content');
        if (!container) return;
        
        // 监听所有输入变化
        container.addEventListener('input', (e) => {
            if (e.target.matches('input, select')) {
                this.handleInputChange(e.target);
            }
        });
        
        container.addEventListener('change', (e) => {
            if (e.target.matches('input, select')) {
                this.handleInputChange(e.target);
            }
        });
    },

    /**
     * 处理输入变化
     */
    handleInputChange(input) {
        const id = input.id;
        const value = input.value;
        
        // 更新range值显示
        if (input.type === 'range') {
            const rangeValue = input.parentElement.querySelector('.range-value');
            if (rangeValue) {
                const unit = id.includes('size') || id.includes('margin') || id.includes('padding') || id.includes('height') ? 'px' : '';
                rangeValue.textContent = value + unit;
            }
        }
        
        // 更新主题样式
        const styleKey = this.getStyleKey(id);
        if (styleKey) {
            const finalValue = this.formatStyleValue(id, value);
            this.currentTheme.styles[styleKey] = finalValue;
            this.updatePreview();
        }
    },

    /**
     * 获取样式键名
     */
    getStyleKey(inputId) {
        const keyMap = {
            'theme-primary': '--theme-primary',
            'theme-secondary': '--theme-secondary',
            'text-primary': '--text-primary',
            'h1-color': '--h1-color',
            'h1-size': '--h1-font-size',
            'h1-weight': '--h1-font-weight',
            'h1-align': '--h1-text-align',
            'h2-color': '--h2-color',
            'h2-size': '--h2-font-size',
            'h2-weight': '--h2-font-weight',
            'h3-color': '--h3-color',
            'h3-size': '--h3-font-size',
            'h3-weight': '--h3-font-weight',
            'p-color': '--p-color',
            'p-size': '--p-font-size',
            'p-line-height': '--p-line-height',
            'p-margin': '--p-margin-bottom',
            'p-align': '--p-text-align',
            'font-family': '--p-font-family',
            'a-color': '--a-color',
            'a-hover-color': '--a-hover-color',
            'strong-color': '--strong-color',
            'em-color': '--em-color',
            'code-color': '--code-color',
            'code-bg': '--code-bg',
            'blockquote-color': '--blockquote-color',
            'blockquote-bg': '--blockquote-bg',
            'blockquote-border': '--blockquote-border-color',
            'blockquote-padding': '--blockquote-padding',
            'code-block-color': '--code-block-color',
            'code-block-bg': '--code-block-bg',
            'code-block-padding': '--code-block-padding',
            'code-block-border-radius': '--code-block-border-radius',
            'hr-color': '--hr-color',
            'hr-height': '--hr-height',
            'hr-margin': '--hr-margin',
            'ul-style': '--ul-list-style',
            'ol-style': '--ol-list-style',
            'list-padding': '--list-pl'
        };
        
        return keyMap[inputId];
    },

    /**
     * 格式化样式值
     */
    formatStyleValue(inputId, value) {
        const pxFields = ['h1-size', 'h2-size', 'h3-size', 'p-size', 'p-margin', 'blockquote-padding', 'code-block-padding', 'code-block-border-radius', 'hr-height', 'hr-margin', 'list-padding'];
        
        if (pxFields.includes(inputId)) {
            return value + 'px';
        }
        
        return value;
    },

    /**
     * 绑定操作按钮事件
     */
    bindActionEvents() {
        const saveBtn = document.getElementById('save-theme-edit');
        const resetBtn = document.getElementById('reset-theme-edit');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.handleReset());
        }
    },

    /**
     * 处理保存
     */
    handleSave() {
        try {
            window.themeService.updateTheme(this.currentTheme);
            
            if (window.NotificationUtils) {
                window.NotificationUtils.showSuccess(`主题 "${this.currentTheme.name}" 已保存`);
            }
            
            window.location.hash = '#themes';
        } catch (error) {
            window.Logger.error('保存主题失败', error);
            if (window.NotificationUtils) {
                window.NotificationUtils.showError('保存失败');
            }
        }
    },

    /**
     * 处理重置
     */
    handleReset() {
        if (confirm('确定要重置为默认样式吗？')) {
            this.currentTheme.styles = window.themeService.getDefaultStyles();
            this.renderEditor();
            this.bindAllEvents();
            this.updatePreview();
        }
    },

    /**
     * 更新预览
     */
    updatePreview() {
        const previewContent = document.querySelector('.preview-content');
        if (!previewContent) return;
        
        const styles = this.currentTheme.styles;
        
        // 应用字体
        const fontFamily = styles['--p-font-family'] || 'system-ui, -apple-system, sans-serif';
        previewContent.style.fontFamily = fontFamily;
        
        // 应用各种样式
        const previewH1 = previewContent.querySelector('.preview-h1');
        if (previewH1) {
            previewH1.style.color = styles['--h1-color'] || '#1F2937';
            previewH1.style.fontSize = styles['--h1-font-size'] || '24px';
            previewH1.style.fontWeight = styles['--h1-font-weight'] || '700';
            previewH1.style.textAlign = styles['--h1-text-align'] || 'left';
        }
        
        const previewH2 = previewContent.querySelector('.preview-h2');
        if (previewH2) {
            previewH2.style.color = styles['--h2-color'] || '#374151';
            previewH2.style.fontSize = styles['--h2-font-size'] || '20px';
            previewH2.style.fontWeight = styles['--h2-font-weight'] || '600';
        }
        
        const previewH3 = previewContent.querySelector('.preview-h3');
        if (previewH3) {
            previewH3.style.color = styles['--h3-color'] || '#4B5563';
            previewH3.style.fontSize = styles['--h3-font-size'] || '18px';
            previewH3.style.fontWeight = styles['--h3-font-weight'] || '600';
        }
        
        const previewP = previewContent.querySelector('.preview-p');
        if (previewP) {
            previewP.style.color = styles['--p-color'] || '#333333';
            previewP.style.fontSize = styles['--p-font-size'] || '16px';
            previewP.style.lineHeight = styles['--p-line-height'] || '1.7';
            previewP.style.marginBottom = styles['--p-margin-bottom'] || '20px';
            previewP.style.textAlign = styles['--p-text-align'] || 'left';
        }
        
        const previewA = previewContent.querySelector('.preview-a');
        if (previewA) {
            previewA.style.color = styles['--a-color'] || '#0000EE';
        }
        
        const previewStrong = previewContent.querySelector('.preview-strong');
        if (previewStrong) {
            previewStrong.style.color = styles['--strong-color'] || '#000000';
        }
        
        const previewEm = previewContent.querySelector('.preview-em');
        if (previewEm) {
            previewEm.style.color = styles['--em-color'] || '#000000';
        }
        
        const previewBlockquote = previewContent.querySelector('.preview-blockquote');
        if (previewBlockquote) {
            previewBlockquote.style.color = styles['--blockquote-color'] || '#666666';
            previewBlockquote.style.backgroundColor = styles['--blockquote-bg'] || '#F9F9F9';
            previewBlockquote.style.borderLeft = `4px solid ${styles['--blockquote-border-color'] || '#CCCCCC'}`;
            previewBlockquote.style.padding = styles['--blockquote-padding'] || '20px';
        }
        
        const previewCodeBlock = previewContent.querySelector('.preview-code-block');
        if (previewCodeBlock) {
            previewCodeBlock.style.color = styles['--code-block-color'] || '#FFFFFF';
            previewCodeBlock.style.backgroundColor = styles['--code-block-bg'] || '#282C34';
            previewCodeBlock.style.padding = styles['--code-block-padding'] || '16px';
            previewCodeBlock.style.borderRadius = styles['--code-block-border-radius'] || '6px';
        }
        
        const previewHr = previewContent.querySelector('.preview-hr');
        if (previewHr) {
            previewHr.style.backgroundColor = styles['--hr-color'] || '#EEEEEE';
            previewHr.style.height = styles['--hr-height'] || '1px';
            previewHr.style.margin = styles['--hr-margin'] || '24px 0';
            previewHr.style.border = 'none';
        }
        
        const previewUl = previewContent.querySelector('.preview-ul');
        if (previewUl) {
            previewUl.style.listStyleType = styles['--ul-list-style'] || 'disc';
            previewUl.style.paddingLeft = styles['--list-pl'] || '20px';
        }
        
        const previewOl = previewContent.querySelector('.preview-ol');
        if (previewOl) {
            previewOl.style.listStyleType = styles['--ol-list-style'] || 'decimal';
            previewOl.style.paddingLeft = styles['--list-pl'] || '20px';
        }
    },

    /**
     * 清理资源
     */
    cleanup() {
        this.eventHandlers.forEach((handler, key) => {
            const element = document.getElementById(key);
            if (element) {
                element.removeEventListener('click', handler);
            }
        });
        this.eventHandlers.clear();
        this.currentTheme = null;
        this.activeTab = 'basic';
    }
};