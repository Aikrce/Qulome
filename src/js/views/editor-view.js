/**
 * Editor View Module
 * 
 * This module manages all the logic for the main editor view, including:
 * - Quill editor initialization
 * - Toolbar button handlers
 * - Action buttons (Import, Save, Discard) logic
 * - Event binding management
 * - Auto-save functionality
 */

// Helper function for icon selection modal
function openIconSelectionModal(quill) {
    // Create modal structure
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3 class="modal-title">选择一个图标</h3>
            <div id="modal-icons-grid" class="icons-grid">
                <!-- Icons will be loaded here -->
            </div>
            <button class="modal-close-btn">&times;</button>
        </div>
    `;
    document.body.appendChild(modal);

    try {
    const icons = window.iconService.getIcons();
    const grid = modal.querySelector('#modal-icons-grid');
    grid.innerHTML = icons.map(icon => `
        <div class="icon-card" data-icon-id="${icon.id}" data-icon-name="${icon.name}">
            <div class="icon-preview">${icon.svg}</div>
            <p class="icon-name">${icon.name}</p>
        </div>
    `).join('');

        // Use event delegation for better performance
        grid.onclick = (event) => {
            const iconCard = event.target.closest('.icon-card');
            if (iconCard) {
                const iconName = iconCard.dataset.iconName;
            const range = quill.getSelection(true);
            quill.insertText(range.index, `[icon:${iconName}]`);
            document.body.removeChild(modal);
            }
        };
    } catch (error) {
        window.Logger.error('Failed to load icons for modal', error);
        grid.innerHTML = '<p>加载图标失败，请重试</p>';
    }

    // Close modal handlers
    const closeModal = () => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    };

    modal.querySelector('.modal-close-btn').onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    // Close on escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

window.EditorView = {
    // State management
    quillInstance: null,
    currentDraftId: null,
    justImportedDraftId: null,
    isInitialized: false,
    eventHandlers: new Map(), // Track event handlers for cleanup
    autoSaveHandler: null, // Track auto-save handler
    // 新增：Markdown文件输入元素引用
    markdownFileInput: null,

    /**
     * Initialize or re-initialize the editor view
     */
    init: function() {
        try {
            if (this.isInitialized) {
                this.cleanup();
            }
            
            this.currentDraftId = window.draftService.getCurrentDraftId();
            this.initializeMarkdownInput(); // 初始化Markdown文件输入元素
            this.initializeQuillEditor();
            this.initializeHistoryManager();
            this.loadCurrentDraft();
            this.setupAutoSave();
            this.setupActionButtons();
            this.setupBottomButtons();
            this.setupWordCount();
            this.updateThemeDisplay();
            this.setupIntegrationManager(); // 设置协同管理器
            this.isInitialized = true;
            
            window.Logger.debug('EditorView initialized successfully');
        } catch (error) {
            window.Logger.error('Failed to initialize EditorView', error);
            window.ErrorHandler.handle(error, 'EditorView.init');
        }
    },

    /**
     * 设置协同管理器
     */
    setupIntegrationManager: function() {
        if (window.EditorIntegrationManager) {
            // 初始化协同管理器
            if (!window.EditorIntegrationManager.isInitialized) {
                window.EditorIntegrationManager.init();
            }
            
            // 设置当前编辑器为活动编辑器
            window.EditorIntegrationManager.setActiveEditor(this);
            
            // 注册主题变更回调
            this.themeChangeUnsubscribe = window.EditorIntegrationManager.registerThemeChangeCallback((theme) => {
                this.onThemeChanged(theme);
            });
            
            window.Logger.debug('Integration manager setup completed');
        } else {
            window.Logger.warn('EditorIntegrationManager not available');
        }
    },
    
    /**
     * 处理主题变更
     */
    onThemeChanged: function(theme) {
        if (!theme || !this.quillInstance) return;
        
        try {
            // 更新编辑器样式
            const editorRoot = this.quillInstance.root;
            
            if (theme.styles) {
                editorRoot.style.fontSize = theme.styles['--p-font-size'] || '16px';
                editorRoot.style.fontFamily = theme.styles['--p-font-family'] || 'sans-serif';
                editorRoot.style.color = theme.styles['--p-color'] || '#333';
                editorRoot.style.lineHeight = theme.styles['--p-line-height'] || '1.7';
            }
            
            // 更新主题显示
            this.updateThemeDisplay();
            
            window.Logger.debug('Editor theme updated', theme.name);
        } catch (error) {
            window.Logger.error('Failed to apply theme to editor', error);
        }
    },
    initializeMarkdownInput: function() {
        this.markdownFileInput = window.DOMCache ? 
            window.DOMCache.getElementById('markdown-file-input') : 
            document.getElementById('markdown-file-input');
        
        if (this.markdownFileInput) {
            // 清理之前的事件监听器
            this.markdownFileInput.removeEventListener('change', this.handleFileSelect);
            // 添加新的事件监听器
            this.markdownFileInput.addEventListener('change', this.handleFileSelect.bind(this));
            window.Logger.debug('Markdown file input initialized');
        } else {
            window.Logger.warn('Markdown file input element not found');
        }
    },
    initializeHistoryManager: function() {
        if (window.HistoryManager && this.quillInstance) {
            window.HistoryManager.init(this.quillInstance);
            
            // 设置撤销/重做按钮事件
            this.addEventHandler('undo-btn', 'click', () => {
                window.HistoryManager.undo();
            });
            
            this.addEventHandler('redo-btn', 'click', () => {
                window.HistoryManager.redo();
            });
            
            window.Logger.debug('History manager initialized for editor');
        } else {
            window.Logger.warn('HistoryManager not available or Quill not initialized');
        }
    },

    /**
     * 设置字数统计
     */
    setupWordCount: function() {
        if (!this.quillInstance) return;
        
        const updateWordCount = () => {
            const text = this.quillInstance.getText();
            const wordCount = text.trim().length;
            const wordCountElement = document.getElementById('word-count');
            if (wordCountElement) {
                wordCountElement.textContent = `${wordCount} 字`;
            }
        };
        
        // 初始更新
        updateWordCount();
        
        // 监听内容变化
        this.quillInstance.on('text-change', updateWordCount);
    },

    /**
     * Clean up all event handlers and timers
     */
    cleanup: function() {
        // 清理协同管理器回调
        if (this.themeChangeUnsubscribe) {
            this.themeChangeUnsubscribe();
            this.themeChangeUnsubscribe = null;
        }
        
        // 清理历史管理器
        if (window.HistoryManager) {
            window.HistoryManager.destroy();
        }
        
        if (this.autoSaveHandler && this.quillInstance) {
            this.quillInstance.off('text-change', this.autoSaveHandler);
        }
        this.autoSaveHandler = null;

        this.eventHandlers.forEach((handler, element) => {
            element.removeEventListener(handler.event, handler.callback);
        });
        this.eventHandlers.clear();
        
        // 清理Markdown文件输入监听器
        if (this.markdownFileInput) {
            this.markdownFileInput.removeEventListener('change', this.handleFileSelect);
        }

        this.isInitialized = false;
        window.Logger.debug('EditorView cleaned up');
    },

    /**
     * Add event handler with tracking for easy cleanup
     */
    addEventHandler: function(elementId, event, callback) {
        const element = document.getElementById(elementId);
        if (element) {
            const boundCallback = callback.bind(this);
            this.eventHandlers.set(element, { event, callback: boundCallback });
            element.addEventListener(event, boundCallback);
        } else {
            window.Logger.warn(`Element with ID "${elementId}" not found.`);
        }
    },

    /**
     * Initialize Quill editor instance
     */
    initializeQuillEditor: function() {
        if (this.quillInstance) return;

        // Whitelist custom font sizes for the editor
        const Size = Quill.import('attributors/style/size');
        Size.whitelist = ['12px', '14px', '15px', '16px', '18px', '20px', '24px', '30px'];
        Quill.register(Size, true);

        const editorContainer = document.getElementById('editor-container');
        if (!editorContainer) throw new Error('Editor container not found');

        const toolbarOptions = [
            ['bold', 'italic', 'underline'],
            [{ 'header': [1, 2, 3, false] }],
            [{ 'size': ['12px', '14px', '15px', '16px', '18px', '20px', '24px', '30px'] }],
            [{ 'align': [] }],
            [{ 'color': [] }],
            ['blockquote', 'code-block', {'list': 'ordered'}, {'list': 'bullet'}],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['link', 'image', 'imageGroup', 'insertIcon']
        ];

        this.quillInstance = new Quill(editorContainer, {
            modules: { toolbar: toolbarOptions },
            theme: 'snow',
            placeholder: '开始写作...'
        });

        const toolbar = this.quillInstance.getModule('toolbar');
        toolbar.addHandler('insertIcon', () => openIconSelectionModal(this.quillInstance));
        toolbar.addHandler('imageGroup', () => openImageGroupModal(this.quillInstance));
    },

    /**
     * Load current draft or create a new one
     */
    loadCurrentDraft: function() {
        this.currentDraftId = window.draftService.getCurrentDraftId();
        if (!this.currentDraftId) {
            const newDraft = window.draftService.createDraft('<p><br></p>');
            if (newDraft) {
                this.currentDraftId = newDraft.id;
                window.draftService.setCurrentDraftId(this.currentDraftId);
            }
        }
        
        const draft = window.draftService.getDraft(this.currentDraftId);
        if (draft) {
            this.quillInstance.root.innerHTML = draft.content;
        } else {
            // Handle case where draft is null (e.g., after deleting all drafts)
            const newDraft = window.draftService.createDraft('<p><br></p>');
            this.currentDraftId = newDraft.id;
            window.draftService.setCurrentDraftId(this.currentDraftId);
            this.quillInstance.root.innerHTML = newDraft.content;
        }
    },

    /**
     * Set up auto-save functionality
     */
    setupAutoSave: function() {
        if (!this.quillInstance) return;
        
        this.autoSaveHandler = window.ThemeUtils.debounce(() => {
            const content = this.quillInstance.root.innerHTML;
            window.draftService.saveDraft(this.currentDraftId, content);
        }, 1000);

        this.quillInstance.on('text-change', this.autoSaveHandler);
    },

    /**
     * Set up top action buttons (Import, Change Theme, Copy)
     */
    setupActionButtons: function() {
        this.addEventHandler('import-md-btn', 'click', this.handleImport);
        this.addEventHandler('change-theme-btn', 'click', this.handleThemeChange);
        this.addEventHandler('copy-wechat-btn', 'click', this.handleCopy);
    },
    
    /**
     * Set up bottom action buttons (Save, Discard)
     */
    setupBottomButtons: function() {
        this.addEventHandler('save-draft-btn', 'click', this.handleSave);
        this.addEventHandler('discard-draft-btn', 'click', this.handleDiscard);
    },

    /**
     * Update the display with the current theme name
     */
    updateThemeDisplay: function() {
        const displayElement = document.getElementById('current-theme-display');
        if (displayElement) {
            const currentTheme = window.themeService.getActiveTheme();
            if (currentTheme) {
                displayElement.textContent = `当前: ${currentTheme.name}`;
            }
        }
    },

    /**
     * Handlers for all actions
     */
    handleImport: function() {
        // 触发隐藏的文件输入元素的点击事件
        if (this.markdownFileInput) {
            this.markdownFileInput.click();
            window.NotificationUtils.showInfo('请选择一个Markdown文件');
        } else {
            window.NotificationUtils.showError('Markdown文件导入组件未准备好');
            window.Logger.error('Markdown file input element not found when trying to import.');
        }
    },

    /**
     * 处理文件选择事件，读取Markdown文件并导入到编辑器
     */
    handleFileSelect: function(event) {
        const file = event.target.files[0];
        if (!file) {
            window.NotificationUtils.showInfo('未选择任何文件');
            return;
        }

        if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
            window.NotificationUtils.showError('请选择一个.md或.markdown文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const markdownText = e.target.result;
            try {
                if (!this.quillInstance) {
                    window.NotificationUtils.showError('编辑器未初始化，无法导入内容');
                    return;
                }

                const converter = new showdown.Converter();
                const htmlContent = converter.makeHtml(markdownText);

                // 插入内容到Quill编辑器
                this.quillInstance.setText(''); // 清空现有内容
                this.quillInstance.clipboard.dangerouslyPasteHTML(0, htmlContent);
                window.NotificationUtils.showSuccess('Markdown内容已成功导入！');
            } catch (error) {
                window.Logger.error('处理Markdown文件失败', error.message, error.stack);
                window.NotificationUtils.showError('导入Markdown内容时发生错误');
            }
        };
        reader.onerror = (error) => {
            window.Logger.error('读取文件失败', error.message, error.stack);
            window.NotificationUtils.showError('读取文件失败，请重试');
        };
        reader.readAsText(file);
    },

    handleThemeChange: function() {
        try {
            const themes = window.themeService.getThemes();
            const currentTheme = window.themeService.getActiveTheme();
            if (themes.length <= 1) {
                window.NotificationUtils.showError('没有其他主题可供切换');
                return;
            }

            let newTheme;
            do {
                const randomIndex = Math.floor(Math.random() * themes.length);
                newTheme = themes[randomIndex];
            } while (newTheme.id === currentTheme.id);

            window.themeService.applyTheme(newTheme.id);
            window.NotificationUtils.showSuccess(`主题已切换为: ${newTheme.name}`);
            this.updateThemeDisplay();
            // 强制刷新编辑器内容区样式
            if (this.quillInstance) {
                this.quillInstance.root.style.fontSize = getComputedStyle(document.documentElement).getPropertyValue('--p-font-size') || '16px';
                this.quillInstance.root.style.color = getComputedStyle(document.documentElement).getPropertyValue('--p-color') || '#222';
            }
        } catch (error) {
            window.Logger.error('Failed to change theme', error);
            window.NotificationUtils.showError('主题切换失败');
        }
    },
    
    handleCopy: function() {
        try {
            if (!this.quillInstance) {
                throw new Error('编辑器未初始化');
            }
            
            // 获取编辑器内容
            const htmlContent = this.quillInstance.root.innerHTML;
            
            // 处理图标和图片组
            const processedContent = this.processContentForWeChat(htmlContent);
            
            // 尝试使用现代剪贴板 API 复制富文本
            if (navigator.clipboard && navigator.clipboard.write) {
                const clipboardItem = new ClipboardItem({
                    'text/html': new Blob([processedContent], { type: 'text/html' }),
                    'text/plain': new Blob([this.htmlToText(processedContent)], { type: 'text/plain' })
                });
                
                navigator.clipboard.write([clipboardItem]).then(() => {
                    if (window.Notification && window.Notification.show) {
                        window.Notification.show('内容已复制到剪贴板，可直接粘贴到微信公众号编辑器！', 'success');
                    } else {
                        alert('内容已复制到剪贴板！');
                    }
                }).catch(error => {
                    window.Logger.warn('Modern clipboard API failed, falling back to legacy method', error);
                    this.fallbackCopyRichText(processedContent);
                });
            } else {
                // 备用方案
                this.fallbackCopyRichText(processedContent);
            }
        } catch (error) {
            window.Logger.error('Failed to copy content', error);
            window.StandardErrorHandler.handle(error, 'EditorView.handleCopy');
        }
    },
    
    /**
     * 将HTML转换为纯文本
     */
    htmlToText: function(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
    },
    
    /**
     * 备用富文本复制方法
     */
    fallbackCopyRichText: function(content) {
        try {
            // 创建临时的可编辑div来复制富文本
            const tempDiv = document.createElement('div');
            tempDiv.contentEditable = true;
            tempDiv.innerHTML = content;
            tempDiv.style.position = 'fixed';
            tempDiv.style.left = '-999999px';
            tempDiv.style.top = '-999999px';
            tempDiv.style.opacity = '0';
            document.body.appendChild(tempDiv);
            
            // 选择内容
            const range = document.createRange();
            range.selectNodeContents(tempDiv);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            // 执行复制命令
            const successful = document.execCommand('copy');
            
            // 清理
            selection.removeAllRanges();
            document.body.removeChild(tempDiv);
            
            if (successful) {
                if (window.Notification && window.Notification.show) {
                    window.Notification.show('内容已复制到剪贴板，可直接粘贴到微信公众号编辑器！', 'success');
                } else {
                    alert('内容已复制到剪贴板！');
                }
            } else {
                throw new Error('复制命令执行失败');
            }
        } catch (error) {
            window.Logger.error('Fallback rich text copy failed', error);
            // 显示手动复制对话框
            this.showManualCopyDialog(content);
        }
    },
    
    /**
     * 备用复制方法（纯文本）
     */
    fallbackCopy: function(content) {
        try {
            // 创建临时文本域
            const textArea = document.createElement('textarea');
            textArea.value = content;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            // 执行复制命令
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                if (window.Notification && window.Notification.show) {
                    window.Notification.show('内容已复制到剪贴板！', 'success');
                } else {
                    alert('内容已复制到剪贴板！');
                }
            } else {
                throw new Error('复制命令执行失败');
            }
        } catch (error) {
            window.Logger.error('Fallback copy failed', error);
            // 显示手动复制对话框
            this.showManualCopyDialog(content);
        }
    },
    
    /**
     * 显示手动复制对话框
     */
    showManualCopyDialog: function(content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content copy-modal">
                <h3>复制内容</h3>
                <p>请手动选中下方内容并复制（Ctrl+C）：</p>
                <div id="copy-content" style="width: 100%; height: 300px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; overflow-y: auto; background: white;" contenteditable="true"></div>
                <div style="margin-top: 15px; text-align: right;">
                    <button class="btn btn-secondary" id="select-all-btn">全选</button>
                    <button class="btn btn-primary modal-close-btn">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 设置富文本内容
        const contentDiv = modal.querySelector('#copy-content');
        contentDiv.innerHTML = content;
        
        // 全选按钮事件
        const selectAllBtn = modal.querySelector('#select-all-btn');
        selectAllBtn.onclick = () => {
            const range = document.createRange();
            range.selectNodeContents(contentDiv);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            contentDiv.focus();
        };
        
        // 关闭按钮事件
        const closeBtn = modal.querySelector('.modal-close-btn');
        closeBtn.onclick = () => {
            document.body.removeChild(modal);
        };
        
        // 点击背景关闭
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
        
        // 自动全选内容
        setTimeout(() => {
            selectAllBtn.click();
        }, 100);
    },
    
    /**
     * 处理内容以适配微信公众号
     */
    processContentForWeChat: function(htmlContent) {
        // 创建临时DOM元素用于处理
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // 处理图标占位符
        const iconPlaceholders = tempDiv.querySelectorAll('[data-icon], span');
        iconPlaceholders.forEach(element => {
            const text = element.textContent;
            const iconMatch = text.match(/\[icon:(.+?)\]/);
            if (iconMatch) {
                const iconName = iconMatch[1];
                const icon = window.iconService ? window.iconService.getIconByName(iconName) : null;
                if (icon) {
                    // 替换为实际图标
                    element.innerHTML = icon.svg;
                } else {
                    // 移除无效图标占位符
                    element.textContent = text.replace(/\[icon:.+?\]/g, '');
                }
            }
        });
        
        // 处理图片组
        const imageGroups = tempDiv.querySelectorAll('.ql-image-group');
        imageGroups.forEach(group => {
            try {
                const data = JSON.parse(group.getAttribute('data-images'));
                if (data && data.images && data.images.length > 0) {
                    const imageHTML = data.images.map(img => `<img src="${img.src}" alt="${img.alt || ''}" style="max-width: 100%; margin: 5px;"/>`).join('');
                    group.innerHTML = `<div style="text-align: ${data.align || 'center'}; margin: 20px 0;">${imageHTML}</div>`;
                }
            } catch (e) {
                window.Logger.warn('Failed to process image group', e);
            }
        });
        
        // 清理微信不支持的属性
        this.cleanForWeChat(tempDiv);
        
        return tempDiv.innerHTML;
    },
    
    /**
     * 清理不符合微信公众号编辑器的属性和样式
     */
    cleanForWeChat: function(container) {
        // 微信编辑器支持的基本标签
        const allowedTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'del', 'img', 'br', 'div', 'span', 'blockquote', 'pre', 'code', 'ul', 'ol', 'li', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td'];
        
        // 递归处理所有元素
        const processElement = (element) => {
            if (element.nodeType === Node.ELEMENT_NODE) {
                const tagName = element.tagName.toLowerCase();
                
                // 移除不支持的标签，但保留其内容
                if (!allowedTags.includes(tagName)) {
                    const fragment = document.createDocumentFragment();
                    while (element.firstChild) {
                        fragment.appendChild(element.firstChild);
                    }
                    element.parentNode.replaceChild(fragment, element);
                    return;
                }
                
                // 清理属性，只保留必要的
                const allowedAttributes = {
                    'p': ['style'],
                    'h1': ['style'],
                    'h2': ['style'],
                    'h3': ['style'],
                    'h4': ['style'],
                    'h5': ['style'],
                    'h6': ['style'],
                    'strong': ['style'],
                    'em': ['style'],
                    'u': ['style'],
                    'del': ['style'],
                    'img': ['src', 'alt', 'style'],
                    'div': ['style'],
                    'span': ['style'],
                    'blockquote': ['style'],
                    'pre': ['style'],
                    'code': ['style'],
                    'ul': ['style'],
                    'ol': ['style'],
                    'li': ['style'],
                    'a': ['href', 'style'],
                    'table': ['style'],
                    'thead': ['style'],
                    'tbody': ['style'],
                    'tr': ['style'],
                    'th': ['style'],
                    'td': ['style']
                };
                
                const allowed = allowedAttributes[tagName] || [];
                const attrs = [...element.attributes];
                attrs.forEach(attr => {
                    if (!allowed.includes(attr.name)) {
                        element.removeAttribute(attr.name);
                    }
                });
                
                // 清理样式，只保留微信支持的样式
                if (element.style) {
                    this.cleanStyleForWeChat(element);
                }
            }
            
            // 递归处理子元素
            const children = [...element.childNodes];
            children.forEach(child => processElement(child));
        };
        
        processElement(container);
    },
    
    /**
     * 清理样式，只保留微信编辑器支持的样式
     */
    cleanStyleForWeChat: function(element) {
        // 微信编辑器支持的样式属性
        const allowedStyles = [
            'color', 'background-color', 'font-size', 'font-weight', 'font-style',
            'text-align', 'text-decoration', 'line-height', 'margin', 'margin-top',
            'margin-bottom', 'margin-left', 'margin-right', 'padding', 'padding-top',
            'padding-bottom', 'padding-left', 'padding-right', 'border', 'border-top',
            'border-bottom', 'border-left', 'border-right', 'border-color', 'border-style',
            'border-width', 'border-radius', 'text-indent', 'letter-spacing', 'word-spacing'
        ];
        
        const currentStyle = element.style;
        const newStyle = {};
        
        // 保留支持的样式
        allowedStyles.forEach(prop => {
            if (currentStyle[prop]) {
                newStyle[prop] = currentStyle[prop];
            }
        });
        
        // 清空现有样式
        element.style.cssText = '';
        
        // 应用清理后的样式
        Object.keys(newStyle).forEach(prop => {
            element.style[prop] = newStyle[prop];
        });
    },
    
    /**
     * HTML转义工具函数
     */
    escapeHtml: function(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    },

    handleSave: function() {
        const content = this.quillInstance.root.innerHTML;
        window.draftService.saveDraft(this.currentDraftId, content);
        window.NotificationUtils.showSuccess('修改已保存!');
    },

    handleDiscard: function() {
        if (confirm('确定要放弃所有未保存的修改吗?')) {
            this.loadCurrentDraft();
            window.NotificationUtils.showSuccess('修改已撤销');
        }
    },

    showError: function(message) {
        const editorContainer = document.getElementById('editor-container');
        if(editorContainer) {
            editorContainer.innerHTML = `<div class="editor-error">${message}</div>`;
        }
    },

    // 在 EditorView 作用域内挂载 extractTitleFromContent，便于调用
    extractTitleFromContent: window.draftService.extractTitleFromContent || function(content) {
        const div = document.createElement('div');
        div.innerHTML = content || '';
        let title = '';
        const h = div.querySelector('h1,h2,h3');
        if (h && h.textContent.trim()) {
            title = h.textContent.trim();
        } else {
            const text = div.textContent.replace(/\s+/g, ' ').trim();
            title = text.substring(0, 30);
        }
        return title || '无标题草稿';
    }
};

// 预留图片组插入弹窗和处理逻辑
function openImageGroupModal(quill) {
    // 创建弹窗结构
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content image-group-modal">
            <h3 class="modal-title">插入图片组</h3>
            <input type="file" id="image-group-upload" accept="image/*" multiple style="margin-bottom:12px;">
            <div id="image-group-list" class="image-group-list"></div>
            <div style="margin:12px 0;">
                <label>对齐：</label>
                <select id="image-group-align">
                    <option value="center">居中</option>
                    <option value="left">左对齐</option>
                    <option value="right">右对齐</option>
                </select>
                <label style="margin-left:12px;">圆角：</label>
                <input type="number" id="image-group-radius" min="0" max="32" value="8" style="width:48px;">
            </div>
            <button id="image-group-insert-btn" class="btn btn-primary" disabled>插入图片组</button>
            <button class="modal-close-btn">取消</button>
        </div>
    `;
    document.body.appendChild(modal);

    let images = [];
    const list = modal.querySelector('#image-group-list');
    const upload = modal.querySelector('#image-group-upload');
    const insertBtn = modal.querySelector('#image-group-insert-btn');
    const alignSel = modal.querySelector('#image-group-align');
    const radiusInput = modal.querySelector('#image-group-radius');

    function renderList() {
        list.innerHTML = images.map((img, i) => `
            <div class="image-group-item">
                <img src="${img.src}" alt="${img.alt || ''}" style="max-width:80px;max-height:60px;border-radius:4px;">
                <input type="text" placeholder="描述(alt)" value="${img.alt || ''}" data-idx="${i}" class="image-alt-input">
                <button class="btn btn-xs btn-danger image-del-btn" data-idx="${i}">删除</button>
                ${i>0?'<button class="btn btn-xs image-move-left" data-idx="'+i+'">←</button>':''}
                ${i<images.length-1?'<button class="btn btn-xs image-move-right" data-idx="'+i+'">→</button>':''}
            </div>
        `).join('');
        insertBtn.disabled = images.length<1;
    }

    upload.onchange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                images.push({src: ev.target.result, alt: ''});
                renderList();
            };
            reader.readAsDataURL(file);
        });
        upload.value = '';
    };
    list.onclick = (e) => {
        if (e.target.classList.contains('image-del-btn')) {
            const idx = +e.target.dataset.idx;
            images.splice(idx,1);
            renderList();
        } else if (e.target.classList.contains('image-move-left')) {
            const idx = +e.target.dataset.idx;
            if(idx>0){
                [images[idx-1],images[idx]]=[images[idx],images[idx-1]];
                renderList();
                    }
        } else if (e.target.classList.contains('image-move-right')) {
            const idx = +e.target.dataset.idx;
            if(idx<images.length-1){
                [images[idx+1],images[idx]]=[images[idx],images[idx+1]];
                renderList();
            }
        }
    };
    list.oninput = (e) => {
        if (e.target.classList.contains('image-alt-input')) {
            const idx = +e.target.dataset.idx;
            images[idx].alt = e.target.value;
        }
    };
    insertBtn.onclick = () => {
        const align = alignSel.value;
        const radius = radiusInput.value;
        const data = {
            images,
            align,
            borderRadius: radius
        };
        // 插入特殊div，data-images序列化
        const html = `<div class="ql-image-group" data-images='${JSON.stringify(data)}'></div>`;
        const range = quill.getSelection(true);
        quill.clipboard.dangerouslyPasteHTML(range.index, html);
        closeModal();
    };
    function closeModal() {
        document.body.removeChild(modal);
    }
    modal.querySelector('.modal-close-btn').onclick = closeModal;
    modal.onclick = (e) => { if(e.target===modal) closeModal(); };
    document.addEventListener('keydown', function esc(e){
        if(e.key==='Escape'){ closeModal(); document.removeEventListener('keydown',esc); }
    });
}

// 实时渲染图片组为横滑结构
function renderAllImageGroups(container) {
    const groups = container.querySelectorAll('.ql-image-group');
    groups.forEach(group => {
        // 避免重复渲染
        if (group._rendered) return;
        let data;
        try {
            data = JSON.parse(group.getAttribute('data-images'));
        } catch (e) { return; }
        if (!data || !Array.isArray(data.images) || data.images.length === 0) return;
        // 清空内容
        group.innerHTML = '';
        // 设置对齐
        group.classList.remove('align-left','align-center','align-right');
        group.classList.add('align-' + (data.align || 'center'));
        // 设置圆角和间距
        group.style.setProperty('--image-group-gap', (data.gap||12)+ 'px');
        group.style.setProperty('--image-group-radius', (data.borderRadius||8)+ 'px');
        // 生成图片轮播
        const carousel = document.createElement('div');
        carousel.className = 'image-carousel';
        data.images.forEach(img => {
            const image = document.createElement('img');
            image.src = img.src;
            image.alt = img.alt || '';
            carousel.appendChild(image);
        });
        group.appendChild(carousel);
        // 生成指示点
        if (data.images.length > 1) {
            const dots = document.createElement('div');
            dots.className = 'carousel-dots';
            dots.innerHTML = data.images.map((_,i)=>'<span>●</span>').join(' ');
            group.appendChild(dots);
        }
        group._rendered = true;
    });
}
// 编辑器内容变化时自动渲染图片组
if (window.EditorView && window.EditorView.quillInstance) {
    window.EditorView.quillInstance.on('text-change', function() {
        renderAllImageGroups(window.EditorView.quillInstance.root);
    });
    // 首次渲染
    renderAllImageGroups(window.EditorView.quillInstance.root);
} 