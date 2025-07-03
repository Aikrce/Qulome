/**
 * Theme Editor View Module
 * 
 * 负责主题编辑器的创建、渲染和事件处理
 * - 动态生成编辑器HTML
 * - 绑定所有编辑器内部事件
 * - 调用其他模块处理具体逻辑（如预览、保存）
 */
window.ThemeEditorView = {

    /**
     * 渲染主题编辑表单
     * @param {HTMLElement} container - 挂载表单的容器
     * @param {Object} theme - 当前主题对象
     * @param {Function} onChange - 表单变动时的回调，参数为表单数据对象
     */
    render: (container, theme, onChange) => {
        if (!container) return;
        container.innerHTML = window.ThemeEditorView.getEditorFormHTML(theme);
        // 绑定所有 input/select/range 事件
        const inputs = container.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const events = input.type === 'range' ? ['input'] : ['input', 'change'];
            events.forEach(event => {
                input.addEventListener(event, () => {
                    if (typeof onChange === 'function') {
                        onChange(window.ThemeEditorView.collectFormData(container));
                    }
                });
            });
        });
    },

    /**
     * 生成表单HTML
     */
    getEditorFormHTML: (theme) => {
        // 只生成表单部分，不包含预览区
        // 可复用 getBasicSettingsHTML、getTitleSettingsHTML 等
        return `
            <div class="tab-content active" data-tab="basic">
                ${window.ThemeEditorView.getBasicSettingsHTML(theme)}
            </div>
            <div class="tab-content" data-tab="title" style="display: none;">
                ${window.ThemeEditorView.getTitleSettingsHTML(theme)}
            </div>
            <div class="tab-content" data-tab="text" style="display: none;">
                ${window.ThemeEditorView.getTextSettingsHTML(theme)}
            </div>
            <div class="tab-content" data-tab="special" style="display: none;">
                ${window.ThemeEditorView.getSpecialTextSettingsHTML(theme)}
            </div>
            <div class="tab-content" data-tab="block" style="display: none;">
                ${window.ThemeEditorView.getBlockSettingsHTML(theme)}
            </div>
            <div class="tab-content" data-tab="layout" style="display: none;">
                ${window.ThemeEditorView.getLayoutSettingsHTML(theme)}
            </div>
        `;
    },

    /**
     * 收集表单数据
     */
    collectFormData: (container) => {
        const data = {};
        const inputs = container.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                data[input.id || input.name] = input.checked;
            } else {
                data[input.id || input.name] = input.value;
            }
        });
        return data;
    },

    /**
     * 生成编辑器的HTML结构
     * @param {Object} theme - 主题对象
     * @returns {string} HTML字符串
     */
    getEditorHTML: (theme) => {
        const styles = theme.styles || {};
        const escape = window.ThemeUtils.escapeHtml;

        // Helper for getting style values with defaults
        const getStyle = (key, defaultValue) => styles[key] || defaultValue;
        const getPx = (key, defaultValue) => parseInt(getStyle(key, defaultValue)) + 'px';
        const getNum = (key, defaultValue) => parseFloat(getStyle(key, defaultValue));

        return `
            <div class="theme-editor-content">
                <div class="theme-editor-header">
                    <h2>主题编辑器: ${escape(theme.name)}</h2>
                    <button class="theme-editor-close">&times;</button>
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
                            <!-- Basic Settings -->
                            <div class="tab-content active" data-tab="basic">
                                ${window.ThemeEditorView.getBasicSettingsHTML(theme)}
                            </div>
                            <!-- Title System -->
                            <div class="tab-content" data-tab="title" style="display: none;">
                                ${window.ThemeEditorView.getTitleSettingsHTML(theme)}
                            </div>
                             <!-- Text System -->
                            <div class="tab-content" data-tab="text" style="display: none;">
                                ${window.ThemeEditorView.getTextSettingsHTML(theme)}
                            </div>
                             <!-- Special Text -->
                            <div class="tab-content" data-tab="special" style="display: none;">
                                ${window.ThemeEditorView.getSpecialTextSettingsHTML(theme)}
                            </div>
                            <!-- Block Elements -->
                            <div class="tab-content" data-tab="block" style="display: none;">
                                ${window.ThemeEditorView.getBlockSettingsHTML(theme)}
                            </div>
                            <!-- Layout & Separators -->
                            <div class="tab-content" data-tab="layout" style="display: none;">
                                ${window.ThemeEditorView.getLayoutSettingsHTML(theme)}
                            </div>
                        </div>
                    </div>
                    <div class="theme-editor-preview">
                        <div class="preview-content">
                            <h1 class="preview-h1">这是主标题 H1</h1>
                            <h2 class="preview-h2">这是章节标题 H2</h2>
                            <h3 class="preview-h3">这是小节标题 H3</h3>
                            <p class="preview-p">这是正文段落。排版需要考虑移动端阅读体验，字体、行高、颜色都很重要。这是一个<a href="#" class="preview-a">链接</a>，还有<strong class="preview-strong">粗体</strong>和<em class="preview-em">斜体</em>。</p>
                            <blockquote class="preview-blockquote">这是引用块。引用内容应与正文有明显视觉区分。</blockquote>
                            <pre class="preview-code-block"><code>// 这是代码块
function helloWorld() {
  
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
                        <button id="cancel-theme-edit" class="btn btn-secondary">取消</button>
                        <button id="save-theme-edit" class="btn btn-primary">保存主题</button>
                    </div>
                </div>
            </div>
        `;
    },

    getBasicSettingsHTML: (theme) => {
        // 生成主题配色和智能颜色映射两块内容
        const themeColorInputs = `
            <div class="color-inputs">
                <div class="form-row">
                    <label>主题色:</label>
                    <input type="color" id="theme-primary" value="${(theme.styles || {})['--theme-primary'] || '#0E2A73'}">
                    <span class="color-desc">用于重要标题和强调</span>
                </div>
                <div class="form-row">
                    <label>辅助色:</label>
                    <input type="color" id="theme-secondary" value="${(theme.styles || {})['--theme-secondary'] || '#E0A26F'}">
                    <span class="color-desc">用于装饰和次级强调</span>
                </div>
                <div class="form-row">
                    <label>正文色:</label>
                    <input type="color" id="text-primary" value="${(theme.styles || {})['--text-primary'] || '#333333'}">
                    <span class="color-desc">正文主要颜色</span>
                </div>
            </div>
        `;
        const smartColorModule = `
            <div class="image-color-extraction">
                <div class="extraction-header">
                    <h5>🎨 智能颜色映射</h5>
                    <p class="extraction-desc">上传图片，自动提取配色方案并一键应用到主题</p>
                </div>
                <div class="image-upload-area">
                    <input type="file" id="image-upload" accept="image/*" style="display: none;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('image-upload').click()">
                        📷 选择图片
                    </button>
                    <img id="uploaded-preview" style="display: none; max-width: 100%; height: auto; margin-top: 12px; border-radius: 8px;">
                </div>
                <div class="extraction-actions">
                    <button type="button" id="extract-colors-btn" class="btn btn-primary" disabled>
                        🔍 提取图片配色
                    </button>
                    <button type="button" id="apply-colors-btn" class="btn btn-accent" disabled>
                        ✨ 一键应用到主题
                    </button>
                </div>
                <div class="color-palette" id="color-palette"></div>
                <div class="color-adjustment-panel" id="color-adjustment-panel" style="display: none;">
                    <h6>🎯 颜色微调</h6>
                    <div class="color-adjuster" id="color-adjuster">
                        <div class="current-color-preview" id="current-color-preview"></div>
                        <div class="hsl-controls">
                            <div class="hsl-control">
                                <label>色相 (H)</label>
                                <input type="range" id="hue-slider" min="0" max="360" value="0">
                                <span class="hsl-value" id="hue-value">0°</span>
                            </div>
                            <div class="hsl-control">
                                <label>饱和度 (S)</label>
                                <input type="range" id="saturation-slider" min="0" max="100" value="50">
                                <span class="hsl-value" id="saturation-value">50%</span>
                            </div>
                            <div class="hsl-control">
                                <label>亮度 (L)</label>
                                <input type="range" id="lightness-slider" min="0" max="100" value="50">
                                <span class="hsl-value" id="lightness-value">50%</span>
                            </div>
                        </div>
                        <div class="adjuster-actions">
                            <button type="button" id="apply-adjustment-btn" class="btn btn-primary btn-sm">应用调整</button>
                            <button type="button" id="cancel-adjustment-btn" class="btn btn-secondary btn-sm">取消</button>
                        </div>
                    </div>
                </div>
                <div class="mapping-info" style="display: none;">
                    <small>💡 提示：系统会自动将提取的颜色映射到主色、辅助色、点缀色等主题变量</small>
                </div>
            </div>
        `;
        // 宽屏下纵向堆叠，窄屏下分栏，交给 CSS 控制
        return `
            <div class="form-section theme-color-responsive">
                <h4>主题配色</h4>
                <div class="theme-color-stack">
                    ${themeColorInputs}
                    ${smartColorModule}
                </div>
            </div>
        `;
    },

    getTitleSettingsHTML: (theme) => {
        const getStyle = (key, defaultValue) => (theme.styles || {})[key] || defaultValue;
        const getNum = (key, defaultValue) => parseFloat(getStyle(key, defaultValue));
        const getChecked = (key) => getStyle(key, 'false') === 'true' ? 'checked' : '';
        const getSelected = (key, value) => getStyle(key, '') === value ? 'selected' : '';
        return `
            <div class="form-section">
                <h4>H1 主标题</h4>
                <div class="form-row"><label>颜色:</label><input type="color" id="h1-color" name="--h1-color" value="${getStyle('--h1-color', '#1F2937')}"></div>
                <div class="form-row"><label>字号:</label><input type="range" id="h1-size" name="--h1-font-size" min="16" max="48" value="${getNum('--h1-font-size', 24)}"><span class="range-value">${getNum('--h1-font-size', 24)}px</span></div>
                <div class="form-row"><label>字重:</label><select id="h1-weight" name="--h1-font-weight"><option value="400" ${getSelected('--h1-font-weight','400')}>400</option><option value="500" ${getSelected('--h1-font-weight','500')}>500</option><option value="600" ${getSelected('--h1-font-weight','600')}>600</option><option value="700" ${getSelected('--h1-font-weight','700')}>700</option><option value="800" ${getSelected('--h1-font-weight','800')}>800</option></select></div>
                <div class="form-row"><label>对齐:</label><select id="h1-align" name="--h1-text-align"><option value="left" ${getSelected('--h1-text-align','left')}>左对齐</option><option value="center" ${getSelected('--h1-text-align','center')}>居中</option><option value="right" ${getSelected('--h1-text-align','right')}>右对齐</option></select></div>
                <div class="form-row border-control">
                    <label>竖线装饰:</label>
                    <input type="checkbox" id="h1-border-enabled" name="--h1-border-enabled" ${getChecked('--h1-border-enabled')}>
                    <select id="h1-border-position" name="--h1-border-position"><option value="left" ${getSelected('--h1-border-position','left')}>左侧</option><option value="right" ${getSelected('--h1-border-position','right')}>右侧</option><option value="both" ${getSelected('--h1-border-position','both')}>两侧</option></select>
                    <input type="color" id="h1-border-color" name="--h1-border-color" value="${getStyle('--h1-border-color', '#1F2937')}">
                    <input type="range" id="h1-border-width" name="--h1-border-width" min="1" max="5" value="${getNum('--h1-border-width', 2)}"><span class="range-value">${getNum('--h1-border-width', 2)}px</span>
                </div>
            </div>
            <div class="form-section">
                <h4>H2 章节标题</h4>
                <div class="form-row"><label>颜色:</label><input type="color" id="h2-color" name="--h2-color" value="${getStyle('--h2-color', '#374151')}"></div>
                <div class="form-row"><label>字号:</label><input type="range" id="h2-size" name="--h2-font-size" min="14" max="36" value="${getNum('--h2-font-size', 20)}"><span class="range-value">${getNum('--h2-font-size', 20)}px</span></div>
                <div class="form-row"><label>字重:</label><select id="h2-weight" name="--h2-font-weight"><option value="400" ${getSelected('--h2-font-weight','400')}>400</option><option value="500" ${getSelected('--h2-font-weight','500')}>500</option><option value="600" ${getSelected('--h2-font-weight','600')}>600</option><option value="700" ${getSelected('--h2-font-weight','700')}>700</option></select></div>
                <div class="form-row border-control">
                    <label>竖线装饰:</label>
                    <input type="checkbox" id="h2-border-enabled" name="--h2-border-enabled" ${getChecked('--h2-border-enabled')}>
                    <select id="h2-border-position" name="--h2-border-position"><option value="left" ${getSelected('--h2-border-position','left')}>左侧</option><option value="right" ${getSelected('--h2-border-position','right')}>右侧</option><option value="both" ${getSelected('--h2-border-position','both')}>两侧</option></select>
                    <input type="color" id="h2-border-color" name="--h2-border-color" value="${getStyle('--h2-border-color', '#374151')}">
                    <input type="range" id="h2-border-width" name="--h2-border-width" min="1" max="5" value="${getNum('--h2-border-width', 2)}"><span class="range-value">${getNum('--h2-border-width', 2)}px</span>
                </div>
            </div>
            <div class="form-section">
                <h4>H3 小节标题</h4>
                <div class="form-row"><label>颜色:</label><input type="color" id="h3-color" name="--h3-color" value="${getStyle('--h3-color', '#4B5563')}"></div>
                <div class="form-row"><label>字号:</label><input type="range" id="h3-size" name="--h3-font-size" min="12" max="28" value="${getNum('--h3-font-size', 18)}"><span class="range-value">${getNum('--h3-font-size', 18)}px</span></div>
                <div class="form-row"><label>字重:</label><select id="h3-weight" name="--h3-font-weight"><option value="400" ${getSelected('--h3-font-weight','400')}>400</option><option value="500" ${getSelected('--h3-font-weight','500')}>500</option><option value="600" ${getSelected('--h3-font-weight','600')}>600</option><option value="700" ${getSelected('--h3-font-weight','700')}>700</option></select></div>
                <div class="form-row border-control">
                    <label>竖线装饰:</label>
                    <input type="checkbox" id="h3-border-enabled" name="--h3-border-enabled" ${getChecked('--h3-border-enabled')}>
                    <select id="h3-border-position" name="--h3-border-position"><option value="left" ${getSelected('--h3-border-position','left')}>左侧</option><option value="right" ${getSelected('--h3-border-position','right')}>右侧</option><option value="both" ${getSelected('--h3-border-position','both')}>两侧</option></select>
                    <input type="color" id="h3-border-color" name="--h3-border-color" value="${getStyle('--h3-border-color', '#4B5563')}">
                    <input type="range" id="h3-border-width" name="--h3-border-width" min="1" max="5" value="${getNum('--h3-border-width', 2)}"><span class="range-value">${getNum('--h3-border-width', 2)}px</span>
                </div>
            </div>
        `;
    },

    getTextSettingsHTML: (theme) => {
        const getStyle = (key, defaultValue) => (theme.styles || {})[key] || defaultValue;
        const getNum = (key, defaultValue) => parseFloat(getStyle(key, defaultValue));
        const getSelected = (key, value) => getStyle(key, '') === value ? 'selected' : '';
        return `
            <div class="form-section">
                <h4>正文段落</h4>
                <div class="form-row"><label>颜色:</label><input type="color" id="p-color" name="--p-color" value="${getStyle('--p-color', '#333333')}"></div>
                <div class="form-row"><label>字号:</label><input type="range" id="p-size" name="--p-font-size" min="12" max="20" value="${getNum('--p-font-size', 16)}"><span class="range-value">${getNum('--p-font-size', 16)}px</span></div>
                <div class="form-row"><label>行高:</label><input type="range" id="p-line-height" name="--p-line-height" min="1.2" max="2.5" step="0.1" value="${getNum('--p-line-height', 1.7)}"><span class="range-value">${getNum('--p-line-height', 1.7)}</span></div>
                <div class="form-row"><label>段落间距:</label><input type="range" id="p-margin" name="--p-margin-bottom" min="0" max="40" value="${getNum('--p-margin-bottom', 20)}"><span class="range-value">${getNum('--p-margin-bottom', 20)}px</span></div>
                <div class="form-row"><label>对齐方式:</label><select id="p-align" name="--p-text-align"><option value="left" ${getSelected('--p-text-align','left')}>左对齐</option><option value="center" ${getSelected('--p-text-align','center')}>居中</option><option value="right" ${getSelected('--p-text-align','right')}>右对齐</option><option value="justify" ${getSelected('--p-text-align','justify')}>两端对齐</option></select></div>
            </div>
            <div class="form-section">
                <h4>字体设置</h4>
                <div class="form-row"><label>字体族:</label><select id="font-family" name="--p-font-family">
                    <option value="system-ui, -apple-system, sans-serif" ${getSelected('--p-font-family','system-ui, -apple-system, sans-serif')}>系统默认</option>
                    <option value="'Helvetica Neue', Helvetica, Arial, sans-serif" ${getSelected('--p-font-family','\'Helvetica Neue\', Helvetica, Arial, sans-serif')}>Helvetica</option>
                    <option value="Georgia, 'Times New Roman', serif" ${getSelected('--p-font-family','Georgia, \'Times New Roman\', serif')}>Georgia</option>
                    <option value="'SF Pro Text', -apple-system, sans-serif" ${getSelected('--p-font-family','\'SF Pro Text\', -apple-system, sans-serif')}>SF Pro</option>
                    <option value="'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif" ${getSelected('--p-font-family','\'PingFang SC\', \'Hiragino Sans GB\', \'Microsoft YaHei\', sans-serif')}>中文优化</option>
                </select></div>
            </div>
        `;
    },

    getSpecialTextSettingsHTML: (theme) => {
        const getStyle = (key, defaultValue) => (theme.styles || {})[key] || defaultValue;
        return `
            <div class="form-section">
                <h4>链接样式</h4>
                <div class="form-row"><label>链接颜色:</label><input type="color" id="a-color" name="--a-color" value="${getStyle('--a-color', '#0000EE')}"></div>
                <div class="form-row"><label>悬停颜色:</label><input type="color" id="a-hover-color" name="--a-hover-color" value="${getStyle('--a-hover-color', '#EE0000')}"></div>
            </div>
            <div class="form-section">
                <h4>强调文本</h4>
                <div class="form-row"><label>粗体颜色:</label><input type="color" id="strong-color" name="--strong-color" value="${getStyle('--strong-color', '#000000')}"></div>
                <div class="form-row"><label>斜体颜色:</label><input type="color" id="em-color" name="--em-color" value="${getStyle('--em-color', '#000000')}"></div>
            </div>
            <div class="form-section">
                <h4>行内代码</h4>
                <div class="form-row"><label>代码颜色:</label><input type="color" id="code-color" name="--code-color" value="${getStyle('--code-color', '#E83E8C')}"></div>
                <div class="form-row"><label>代码背景:</label><input type="color" id="code-bg" name="--code-bg" value="${getStyle('--code-bg', '#F8F8F8')}"></div>
            </div>
        `;
    },

    getBlockSettingsHTML: (theme) => {
        const getStyle = (key, defaultValue) => (theme.styles || {})[key] || defaultValue;
        const getNum = (key, defaultValue) => parseFloat(getStyle(key, defaultValue));
        return `
            <div class="form-section">
                <h4>引用块样式</h4>
                <div class="form-row"><label>文字颜色:</label><input type="color" id="blockquote-color" name="--blockquote-color" value="${getStyle('--blockquote-color', '#666666')}"></div>
                <div class="form-row"><label>背景颜色:</label><input type="color" id="blockquote-bg" name="--blockquote-bg" value="${getStyle('--blockquote-bg', '#F9F9F9')}"></div>
                <div class="form-row"><label>边框颜色:</label><input type="color" id="blockquote-border" name="--blockquote-border-color" value="${getStyle('--blockquote-border-color', '#CCCCCC')}"></div>
                <div class="form-row"><label>内边距:</label><input type="range" id="blockquote-padding" name="--blockquote-padding" min="10" max="40" value="${getNum('--blockquote-padding', 20)}"><span class="range-value">${getNum('--blockquote-padding', 20)}px</span></div>
            </div>
            <div class="form-section">
                <h4>代码块样式</h4>
                <div class="form-row"><label>文字颜色:</label><input type="color" id="code-block-color" name="--code-block-color" value="${getStyle('--code-block-color', '#FFFFFF')}"></div>
                <div class="form-row"><label>背景颜色:</label><input type="color" id="code-block-bg" name="--code-block-bg" value="${getStyle('--code-block-bg', '#282C34')}"></div>
                <div class="form-row"><label>内边距:</label><input type="range" id="code-block-padding" name="--code-block-padding" min="10" max="40" value="${getNum('--code-block-padding', 16)}"><span class="range-value">${getNum('--code-block-padding', 16)}px</span></div>
                <div class="form-row"><label>圆角大小:</label><input type="range" id="code-block-border-radius" name="--code-block-border-radius" min="0" max="16" value="${getNum('--code-block-border-radius', 6)}"><span class="range-value">${getNum('--code-block-border-radius', 6)}px</span></div>
            </div>
        `;
    },

    getLayoutSettingsHTML: (theme) => {
        const getStyle = (key, defaultValue) => (theme.styles || {})[key] || defaultValue;
        const getNum = (key, defaultValue) => parseFloat(getStyle(key, defaultValue));
        const getSelected = (key, value) => getStyle(key, '') === value ? 'selected' : '';
        return `
            <div class="form-section">
                <h4>分隔线样式</h4>
                <div class="form-row"><label>颜色:</label><input type="color" id="hr-color" name="--hr-color" value="${getStyle('--hr-color', '#EEEEEE')}"></div>
                <div class="form-row"><label>高度:</label><input type="range" id="hr-height" name="--hr-height" min="1" max="10" value="${getNum('--hr-height', 1)}"><span class="range-value">${getNum('--hr-height', 1)}px</span></div>
                <div class="form-row"><label>上下边距:</label><input type="range" id="hr-margin" name="--hr-margin" min="10" max="60" value="${getNum('--hr-margin', 24)}"><span class="range-value">${getNum('--hr-margin', 24)}px</span></div>
            </div>
            <div class="form-section">
                <h4>列表样式</h4>
                <div class="form-row"><label>无序列表:</label><select id="ul-style" name="--ul-list-style">
                    <option value="disc" ${getSelected('--ul-list-style','disc')}>实心圆点</option>
                    <option value="circle" ${getSelected('--ul-list-style','circle')}>空心圆点</option>
                    <option value="square" ${getSelected('--ul-list-style','square')}>方块</option>
                    <option value="none" ${getSelected('--ul-list-style','none')}>无标记</option>
                </select></div>
                <div class="form-row"><label>有序列表:</label><select id="ol-style" name="--ol-list-style">
                    <option value="decimal" ${getSelected('--ol-list-style','decimal')}>数字</option>
                    <option value="decimal-leading-zero" ${getSelected('--ol-list-style','decimal-leading-zero')}>补零数字</option>
                    <option value="lower-roman" ${getSelected('--ol-list-style','lower-roman')}>小写罗马</option>
                    <option value="upper-roman" ${getSelected('--ol-list-style','upper-roman')}>大写罗马</option>
                    <option value="lower-alpha" ${getSelected('--ol-list-style','lower-alpha')}>小写字母</option>
                    <option value="upper-alpha" ${getSelected('--ol-list-style','upper-alpha')}>大写字母</option>
                </select></div>
                <div class="form-row"><label>列表缩进:</label><input type="range" id="list-padding" name="--list-pl" min="10" max="50" value="${getNum('--list-pl', 20)}"><span class="range-value">${getNum('--list-pl', 20)}px</span></div>
            </div>
        `;
    },

}; 