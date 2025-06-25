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

// Debounce helper function
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

window.EditorView = {
    // State management
    quillInstance: null,
    currentDraftId: null,
    justImportedDraftId: null,
    isInitialized: false,
    eventHandlers: new Map(), // Track event handlers for cleanup

    /**
     * Initialize the editor view
     */
    init: () => {
        try {
            if (window.EditorView.isInitialized) {
                window.Logger.debug('EditorView already initialized, skipping...');
                return;
            }

            window.EditorView.initializeQuillEditor();
            window.EditorView.loadCurrentDraft();
            window.EditorView.setupAutoSave();
            window.EditorView.setupActionButtons();
            window.EditorView.setupBottomButtons();
            
            window.EditorView.isInitialized = true;
            window.Logger.debug('EditorView initialized successfully');
        } catch (error) {
            window.Logger.error('Failed to initialize EditorView', error);
            window.EditorView.showError('编辑器初始化失败，请刷新页面重试');
        }
    },

    /**
     * Clean up event handlers and resources
     */
    cleanup: () => {
        // Remove all tracked event handlers
        window.EditorView.eventHandlers.forEach((handler, element) => {
            if (element && typeof element.removeEventListener === 'function') {
                element.removeEventListener(handler.event, handler.callback);
            }
        });
        window.EditorView.eventHandlers.clear();
        window.EditorView.isInitialized = false;
        window.Logger.debug('EditorView cleaned up');
    },

    /**
     * Add event handler with tracking for cleanup
     */
    addEventHandler: (element, event, callback) => {
        if (!element) return;
        
        // Remove existing handler if any
        const existingHandler = window.EditorView.eventHandlers.get(element);
        if (existingHandler && existingHandler.event === event) {
            element.removeEventListener(event, existingHandler.callback);
        }

        // Add new handler
        element.addEventListener(event, callback);
        window.EditorView.eventHandlers.set(element, { event, callback });
    },

    /**
     * Initialize Quill editor with proper configuration
     */
    initializeQuillEditor: () => {
        const editorContainer = document.getElementById('editor-container');
        if (!editorContainer) {
            throw new Error('Editor container not found');
        }

        // Only initialize if not already done or if container is empty
        if (!window.EditorView.quillInstance || !document.querySelector('#editor-container .ql-editor')) {
            const toolbarOptions = [
                ['bold', 'italic', 'underline'],
                [{ 'header': [1, 2, 3, false] }],
                [{ 'align': [] }],
                [{ 'color': [] }],
                ['blockquote', 'code-block', {'list': 'ordered'}, {'list': 'bullet'}],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                ['link', 'image']
            ];

            window.EditorView.quillInstance = new Quill('#editor-container', {
                modules: { toolbar: toolbarOptions },
                theme: 'snow',
                placeholder: '开始写作...'
            });

            // Add custom icon insertion handler
            const toolbar = window.EditorView.quillInstance.getModule('toolbar');
            if (toolbar) {
                toolbar.addHandler('insertIcon', () => {
                    openIconSelectionModal(window.EditorView.quillInstance);
                });
            }
        }
    },

    /**
     * Load current draft or create new one
     */
    loadCurrentDraft: () => {
        try {
            window.EditorView.currentDraftId = window.draftService.getCurrentDraftId();
            
            if (!window.EditorView.currentDraftId) {
                const newDraft = window.draftService.createDraft('');
                window.EditorView.currentDraftId = newDraft.id;
                window.draftService.setCurrentDraftId(window.EditorView.currentDraftId);
            }

            const draft = window.draftService.getDraft(window.EditorView.currentDraftId);
            if (draft && draft.content && window.EditorView.quillInstance) {
                window.EditorView.quillInstance.root.innerHTML = draft.content;
            }
        } catch (error) {
            window.Logger.error('Failed to load current draft', error);
            window.EditorView.showError('加载草稿失败');
        }
    },

    /**
     * Setup auto-save functionality
     */
    setupAutoSave: () => {
        if (!window.EditorView.quillInstance) return;

        const autoSave = debounce((content) => {
            try {
                const current = window.draftService.getDraft(window.EditorView.currentDraftId);
                const draftToSave = {
                    ...current,
                    title: window.EditorView.extractTitleFromContent(content),
                    content: content,
                    updatedAt: new Date().toISOString()
                };
                window.draftService.saveDraft(draftToSave);
                window.Logger.debug("Draft auto-saved successfully");
            } catch (error) {
                window.Logger.error('Auto-save failed', error);
            }
        }, window.QulomeConfig?.performance?.debounceDelay || 2000);

        window.EditorView.quillInstance.on('text-change', () => {
            const content = window.EditorView.quillInstance.root.innerHTML;
            autoSave(content);
        });
    },

    /**
     * Setup action buttons (Import, Theme, Copy)
     */
    setupActionButtons: () => {
        const importBtn = document.getElementById('import-md-btn');
        const changeThemeBtn = document.getElementById('change-theme-btn');
        const copyBtn = document.getElementById('copy-wechat-btn');

        if (!importBtn || !changeThemeBtn || !copyBtn) {
            window.Logger.error('One or more action buttons not found');
            return;
        }

        // Import Markdown button
        window.EditorView.addEventHandler(importBtn, 'click', () => {
            window.EditorView.handleMarkdownImport();
        });

        // Change theme button
        window.EditorView.addEventHandler(changeThemeBtn, 'click', () => {
            window.location.hash = '#themes';
        });

        // Copy to WeChat button
        window.EditorView.addEventHandler(copyBtn, 'click', () => {
            window.EditorView.handleCopyToWeChat();
        });
    },

    /**
     * Setup bottom buttons (Save, Discard, etc.)
     */
    setupBottomButtons: () => {
        // Implementation for bottom buttons if they exist
        const saveBtn = document.getElementById('save-draft-btn');
        const discardBtn = document.getElementById('discard-draft-btn');

        if (saveBtn) {
            window.EditorView.addEventHandler(saveBtn, 'click', () => {
                window.EditorView.handleSaveDraft();
            });
        }

        if (discardBtn) {
            window.EditorView.addEventHandler(discardBtn, 'click', () => {
                window.EditorView.handleDiscardDraft();
            });
        }
    },

    /**
     * Handle Markdown file import
     */
    handleMarkdownImport: () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.md, .markdown';
        
        window.EditorView.addEventHandler(fileInput, 'change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    let markdownText = e.target.result;
                    markdownText = markdownText.replace(/([\r\n]+\s*){2,}/g, '\n\n');
                    
                    const converter = new showdown.Converter();
                    let html = converter.makeHtml(markdownText);
                    html = html.replace(/<p>(\s|<br\s*\/?>)*<\/p>/gi, '');

                    // Create new draft and set as current
                    const newDraft = window.draftService.createDraft(html);
                    window.draftService.setCurrentDraftId(newDraft.id);
                    window.EditorView.currentDraftId = newDraft.id;
                    window.EditorView.quillInstance.root.innerHTML = html;
                    window.EditorView.justImportedDraftId = newDraft.id;
                    
                    window.Logger.debug('Markdown imported successfully');
                } catch (error) {
                    window.Logger.error('Failed to import markdown', error);
                    window.EditorView.showError('导入 Markdown 文件失败');
                }
            };
            
            reader.onerror = () => {
                window.EditorView.showError('读取文件时出错');
            };
            
            reader.readAsText(file);
        });
        
        fileInput.click();
    },

    /**
     * Handle copy to WeChat functionality
     */
    handleCopyToWeChat: () => {
        try {
            const activeTheme = window.themeService.getActiveTheme();
            if (!activeTheme) {
                window.EditorView.showError('请先选择一个主题');
                return;
            }

            const styles = activeTheme.styles;
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = window.EditorView.quillInstance.root.innerHTML;

            // Apply inline styles for WeChat compatibility
            tempContainer.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
                el.style.color = styles['--h1-color'] || styles['--h2-color'] || styles['--h3-color'];
                el.style.fontSize = styles['--h1-font-size'] || styles['--h2-font-size'] || styles['--h3-font-size'];
                el.style.fontWeight = styles['--h1-font-weight'] || 'bold';
            });
            
            tempContainer.querySelectorAll('p').forEach(el => {
                el.style.color = styles['--p-color'];
                el.style.fontSize = styles['--p-font-size'];
                el.style.lineHeight = styles['--p-line-height'];
            });
            
            tempContainer.querySelectorAll('a').forEach(el => {
                el.style.color = styles['--a-color'];
            });

            // Copy to clipboard
            const range = document.createRange();
            range.selectNodeContents(tempContainer);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);

            const success = document.execCommand('copy');
            selection.removeAllRanges();

            if (success) {
                alert('内容已复制！可以直接粘贴到微信公众号编辑器中。');
            } else {
                throw new Error('Copy command failed');
            }
        } catch (error) {
            window.Logger.error('Failed to copy to WeChat', error);
            window.EditorView.showError('复制失败，请手动选择和复制内容');
        }
    },

    /**
     * Handle manual draft save
     */
    handleSaveDraft: () => {
        try {
            const content = window.EditorView.quillInstance.root.innerHTML;
            const current = window.draftService.getDraft(window.EditorView.currentDraftId);
            const draftToSave = {
                ...current,
                title: window.EditorView.extractTitleFromContent(content),
                content: content,
                updatedAt: new Date().toISOString()
            };
            window.draftService.saveDraft(draftToSave);
            alert('草稿已保存！');

            // 保存后自动新建空草稿并切换
            const newDraft = window.draftService.createDraft('');
            window.EditorView.currentDraftId = newDraft.id;
            window.draftService.setCurrentDraftId(newDraft.id);
            window.EditorView.quillInstance.root.innerHTML = '';

            // 清理 orphan 草稿
            if (typeof window.draftService.cleanOrphanDrafts === 'function') {
                window.draftService.cleanOrphanDrafts();
            }
        } catch (error) {
            window.Logger.error('Failed to save draft manually', error);
            window.EditorView.showError('保存草稿失败');
        }
    },

    /**
     * Handle draft discard
     */
    handleDiscardDraft: () => {
        if (confirm('确定要丢弃当前草稿吗？此操作不可撤销。')) {
            try {
                window.draftService.deleteDraft(window.EditorView.currentDraftId);
                const newDraft = window.draftService.createDraft('');
                window.EditorView.currentDraftId = newDraft.id;
                window.draftService.setCurrentDraftId(newDraft.id);
                window.EditorView.quillInstance.root.innerHTML = '';
                window.Logger.debug('Draft discarded successfully');

                // 清理 orphan 草稿
                if (typeof window.draftService.cleanOrphanDrafts === 'function') {
                    window.draftService.cleanOrphanDrafts();
                }
            } catch (error) {
                window.Logger.error('Failed to discard draft', error);
                window.EditorView.showError('丢弃草稿失败');
            }
        }
    },

    /**
     * Show user-friendly error message
     */
    showError: (message) => {
        // You can enhance this with a more sophisticated notification system
        alert(message);
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