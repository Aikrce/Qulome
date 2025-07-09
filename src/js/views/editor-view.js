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
     * Initialize or re-initialize the editor view
     */
    init: function() {
        try {
            if (this.isInitialized) {
                this.cleanup();
            }
            
            this.currentDraftId = window.draftService.getCurrentDraftId();
            this.initializeQuillEditor();
            this.loadCurrentDraft();
            this.setupAutoSave();
            this.setupActionButtons();
            this.setupBottomButtons();
            this.updateThemeDisplay();
            
            this.isInitialized = true;
            window.Logger.debug('EditorView initialized successfully');
        } catch (error) {
            window.Logger.error('Failed to initialize EditorView', error);
            this.showError('编辑器初始化失败，请刷新页面重试');
        }
    },

    /**
     * Clean up all event handlers and timers
     */
    cleanup: function() {
        if (this.autoSaveHandler && this.quillInstance) {
            this.quillInstance.off('text-change', this.autoSaveHandler);
        }
        this.autoSaveHandler = null;

        this.eventHandlers.forEach((handler, element) => {
            element.removeEventListener(handler.event, handler.callback);
        });
        this.eventHandlers.clear();

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
        
        this.autoSaveHandler = debounce(() => {
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
        // ... (Implementation for import)
        window.NotificationUtils.showError('导入功能待实现');
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
        // ... (Implementation for copy)
        window.NotificationUtils.showError('复制功能待实现');
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