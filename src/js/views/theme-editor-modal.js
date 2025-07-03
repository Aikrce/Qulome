/**
 * Theme Editor Modal Module
 * 
 * 主题编辑器模态框管理
 * - 模态框显示/隐藏
 * - 整体布局和事件绑定
 * - 协调表单区和预览区
 */
window.ThemeEditorModal = {
    /**
     * 显示主题编辑器
     * @param {string} themeId - 要编辑的主题ID
     */
    show: (themeId) => {
        const theme = window.themeService.getTheme(themeId);
        if (!theme) {
            window.NotificationUtils.showError('未找到要编辑的主题');
            return;
        }

        // 移除已存在的编辑器
        const existingEditor = document.querySelector('.theme-editor-view');
        if (existingEditor) {
            existingEditor.remove();
        }

        const themeEditor = document.createElement('div');
        themeEditor.className = 'theme-editor-view';
        themeEditor.innerHTML = window.ThemeEditorModal.getModalHTML(theme);

        document.body.appendChild(themeEditor);

        // 绑定事件
        window.ThemeEditorModal.bindEvents(themeEditor, theme);

        // 初始化表单区和预览区
        const editorContainer = themeEditor.querySelector('.theme-editor-sidebar .editor-form');
        const previewContainer = themeEditor.querySelector('.theme-editor-preview');

        // 渲染表单区，并设置onChange回调
        window.ThemeEditorView.render(editorContainer, theme, (formData) => {
            window.ThemePreviewView.update(previewContainer, formData);
        });

        // 渲染预览区
        window.ThemePreviewView.render(previewContainer, theme.styles);

        // 初始化表单事件绑定
        if (window.ThemeFormHandler && window.ThemeFormHandler.initFormEvents) {
            window.ThemeFormHandler.initFormEvents(themeEditor);
        }

        // 初始化颜色提取功能
        window.ThemeColorExtractor.init(themeEditor);
    },

    /**
     * 生成模态框HTML结构
     */
    getModalHTML: (theme) => {
        const escape = window.ThemeUtils ? window.ThemeUtils.escapeHtml : (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };

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
                            <!-- 表单内容将由 ThemeEditorView 渲染 -->
                        </div>
                    </div>
                    <div class="theme-editor-preview">
                        <h3>实时预览</h3>
                        <!-- 预览内容将由 ThemePreviewView 渲染 -->
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

    /**
     * 绑定模态框事件
     */
    bindEvents: (modal, theme) => {
        const closeBtn = modal.querySelector('.theme-editor-close');
        const cancelBtn = modal.querySelector('#cancel-theme-edit');
        const saveBtn = modal.querySelector('#save-theme-edit');
        const resetBtn = modal.querySelector('#reset-theme-edit');

        const closeModal = () => {
            modal.classList.remove('visible');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // 标签页切换
        window.ThemeEditorModal.bindTabEvents(modal);

        // 重置为默认
        resetBtn.addEventListener('click', () => {
            window.NotificationUtils.showConfirmationModal(
                '确定要重置为默认样式吗？',
                '这将清除当前所有自定义设置。',
                () => {
                    window.ThemeFormHandler.resetThemeToDefault(modal, theme);
                }
            );
        });

        // 保存主题
        saveBtn.addEventListener('click', () => {
            window.ThemeFormHandler.saveThemeFromEditor(modal, theme);
            closeModal();
        });
    },

    /**
     * 绑定标签页切换事件
     */
    bindTabEvents: (modal) => {
        const tabBtns = modal.querySelectorAll('.tab-btn');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // 更新按钮状态
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 查找标签页内容 - 修复选择器，确保在正确的容器内查找
                const editorForm = modal.querySelector('.editor-form');
                if (!editorForm) {
                    console.error('Editor form container not found');
                    return;
                }
                
                const tabContents = editorForm.querySelectorAll('.tab-content');
                
                // 更新内容显示
                tabContents.forEach(content => {
                    const contentTab = content.dataset.tab;
                    if (contentTab === targetTab) {
                        content.classList.add('active');
                        content.style.display = 'block';
                    } else {
                        content.classList.remove('active');
                        content.style.display = 'none';
                    }
                });
                
                // 标签页切换后重新绑定表单事件，确保新显示的表单元素能正常工作
                if (window.ThemeFormHandler && window.ThemeFormHandler.initFormEvents) {
                    window.ThemeFormHandler.initFormEvents(modal);
                }
            });
        });
    }
}; 