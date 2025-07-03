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
    autoSaveHandler: null, // Track auto-save handler

    /**
     * Initialize the editor view
     */
    init: () => {
        try {
            if (window.EditorView.isInitialized) {
                window.Logger.debug('EditorView already initialized, skipping...');
                return;
            }
            
            window.EditorView.currentDraftId = window.draftService.getCurrentDraftId();
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
        // Remove auto-save handler
        if (window.EditorView.autoSaveHandler && window.EditorView.quillInstance) {
            window.EditorView.quillInstance.off('text-change', window.EditorView.autoSaveHandler);
            window.EditorView.autoSaveHandler = null;
        }
        
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

        // Only initialize if not already done
        if (!window.EditorView.quillInstance) {
                const toolbarOptions = [
                    ['bold', 'italic', 'underline'],
                    [{ 'header': [1, 2, 3, false] }],
                    [{ 'align': [] }],
                    [{ 'color': [] }],
                    ['blockquote', 'code-block', {'list': 'ordered'}, {'list': 'bullet'}],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['link', 'image', 'imageGroup']
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
                toolbar.addHandler('imageGroup', () => {
                    openImageGroupModal(window.EditorView.quillInstance);
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
                // 如果没有当前草稿ID，创建新的空草稿
                const newDraft = window.draftService.createDraft('<p><br></p>');
                if (newDraft) {
                    window.EditorView.currentDraftId = newDraft.id;
                    window.draftService.setCurrentDraftId(window.EditorView.currentDraftId);
                } else {
                    window.Logger.warn('创建新草稿失败');
                    return;
                }
            }

            // 确保草稿存在
            const draft = window.draftService.getDraft(window.EditorView.currentDraftId);
            if (draft && draft.content && window.EditorView.quillInstance) {
                window.EditorView.quillInstance.root.innerHTML = draft.content;
                window.Logger.debug('草稿内容已载入到编辑器:', draft.title);
            } else if (!draft) {
                // 如果草稿不存在，创建新的
                window.Logger.warn('当前草稿不存在，创建新草稿');
                const newDraft = window.draftService.createDraft('<p><br></p>');
                if (newDraft) {
                    window.EditorView.currentDraftId = newDraft.id;
                    window.draftService.setCurrentDraftId(window.EditorView.currentDraftId);
                }
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

        // Remove existing auto-save handler if any
        if (window.EditorView.autoSaveHandler) {
            window.EditorView.quillInstance.off('text-change', window.EditorView.autoSaveHandler);
        }

        const autoSave = debounce((content) => {
            try {
                // 确保有有效的当前草稿ID
                if (!window.EditorView.currentDraftId) {
                    const newDraft = window.draftService.createDraft(content);
                    if (newDraft) {
                        window.EditorView.currentDraftId = newDraft.id;
                        window.draftService.setCurrentDraftId(newDraft.id);
                    }
                    return;
                }

                const current = window.draftService.getDraft(window.EditorView.currentDraftId);
                if (!current) {
                    // 如果当前草稿不存在，创建新的
                    const newDraft = window.draftService.createDraft(content);
                    if (newDraft) {
                        window.EditorView.currentDraftId = newDraft.id;
                        window.draftService.setCurrentDraftId(newDraft.id);
                    }
                    return;
                }

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

        // Store the handler reference for cleanup
        window.EditorView.autoSaveHandler = () => {
            const content = window.EditorView.quillInstance.root.innerHTML;
            autoSave(content);
        };

        window.EditorView.quillInstance.on('text-change', window.EditorView.autoSaveHandler);
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
     * 校验 currentDraftId 是否有效，无效则新建空草稿
     */
    ensureValidCurrentDraftId: function() {
        const drafts = window.draftService.getDrafts();
        let currentId = window.draftService.getCurrentDraftId();
        if (!currentId || !drafts.some(d => d.id === currentId)) {
            if (drafts.length > 0) {
                window.draftService.setCurrentDraftId(drafts[0].id);
                return drafts[0].id;
            } else {
                const newDraft = window.draftService.createDraft('<p><br></p>');
                window.draftService.setCurrentDraftId(newDraft.id);
                return newDraft.id;
            }
        }
        return currentId;
    },

    /**
     * Handle manual draft save
     */
    handleSaveDraft: () => {
        try {
            const content = window.EditorView.quillInstance.root.innerHTML;
            
            // 检查内容是否为空
            const plainText = content.replace(/<[^>]+>/g, '').trim();
            if (!plainText) {
                window.EditorView.showError('请先输入内容再保存');
                return;
            }
            
            // 创建新的草稿
            const newDraft = window.draftService.createDraft(content);
            if (!newDraft) {
                throw new Error('创建草稿失败');
            }
            
            // 显示保存成功消息
            alert('草稿已保存到草稿仓！');
            
            // 清空编辑器并创建新的空草稿
            window.EditorView.quillInstance.root.innerHTML = '<p><br></p>';
            
            // 创建新的空草稿作为当前编辑的草稿
            const emptyDraft = window.draftService.createDraft('<p><br></p>');
            if (emptyDraft) {
                window.EditorView.currentDraftId = emptyDraft.id;
                window.draftService.setCurrentDraftId(emptyDraft.id);
            }
            
            window.Logger.debug('Draft saved successfully and editor cleared');
        } catch (error) {
            window.Logger.error('Failed to save draft manually', error);
            window.EditorView.showError(error.message || '保存草稿失败，请重试');
        }
    },

    /**
     * Handle draft discard
     */
    handleDiscardDraft: () => {
        if (confirm('确定要丢弃当前草稿吗？此操作不可撤销。')) {
            try {
                window.EditorView.currentDraftId = window.EditorView.ensureValidCurrentDraftId();
                const current = window.draftService.getDraft(window.EditorView.currentDraftId);
                if (!current) throw new Error('当前草稿不存在，已自动新建空草稿');
                    window.draftService.deleteDraft(window.EditorView.currentDraftId);
                const newDraft = window.draftService.createDraft('<p><br></p>');
                window.EditorView.currentDraftId = newDraft.id;
                window.draftService.setCurrentDraftId(newDraft.id);
                window.EditorView.quillInstance.root.innerHTML = '';
                window.Logger.debug('Draft discarded successfully');
                if (typeof window.draftService.cleanOrphanDrafts === 'function') {
                    window.draftService.cleanOrphanDrafts();
                }
            } catch (error) {
                window.Logger.error('Failed to discard draft', error);
                window.EditorView.showError(error.message || '丢弃草稿失败，请刷新页面重试');
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