/**
 * Editor View Module
 * 
 * This module manages all the logic for the main editor view, including:
 * - Quill editor initialization
 * - Toolbar button handlers
 * - Action buttons (Import, Save, Discard) logic
 */

// Helper function, moved from app.js
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

    const icons = window.iconService.getIcons();
    const grid = modal.querySelector('#modal-icons-grid');
    grid.innerHTML = icons.map(icon => `
        <div class="icon-card" data-icon-id="${icon.id}" data-icon-name="${icon.name}">
            <div class="icon-preview">${icon.svg}</div>
            <p class="icon-name">${icon.name}</p>
        </div>
    `).join('');

    grid.querySelectorAll('.icon-card').forEach(card => {
        card.addEventListener('click', () => {
            const iconName = card.dataset.iconName;
            const range = quill.getSelection(true);
            quill.insertText(range.index, `[icon:${iconName}]`);
            document.body.removeChild(modal);
        });
    });

    modal.querySelector('.modal-close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// A helper for debouncing
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

window.EditorView = {
    quillInstance: null,
    currentDraftId: null,
    justImportedDraftId: null,

    init: () => {
        try {
            const editorContainer = document.getElementById('editor-container');
            if (!editorContainer) {
                window.Logger.error('Editor container not found. Aborting init.');
                return;
            }

            // Initialize Quill editor
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
                    modules: {toolbar: toolbarOptions},
                    theme: 'snow'
                });
            }
            
            const quill = window.EditorView.quillInstance;

            // Load or create draft
            window.EditorView.currentDraftId = window.draftService.getCurrentDraftId();
            if (!window.EditorView.currentDraftId) {
                const newDraft = window.draftService.createDraft('');
                window.EditorView.currentDraftId = newDraft.id;
                window.draftService.setCurrentDraftId(window.EditorView.currentDraftId);
            }
            const draft = window.draftService.getDraft(window.EditorView.currentDraftId);
            if (draft && draft.content) {
                quill.root.innerHTML = draft.content;
            }

            // Setup autosave
            const autoSave = debounce((content) => {
                const current = window.draftService.getDraft(window.EditorView.currentDraftId);
                const draftToSave = {
                    ...current,
                    title: content.substring(0, 30).replace(/<[^>]+>/g, ' ').trim() || '无标题草稿',
                    content: content,
                    updatedAt: new Date().toISOString()
                };
                window.draftService.saveDraft(draftToSave);
                window.Logger.debug("Draft saved successfully");
            }, 2000);

            quill.on('text-change', () => {
                const content = quill.root.innerHTML;
                autoSave(content);
            });
            
            quill.getModule('toolbar').addHandler('insertIcon', () => {
                openIconSelectionModal(quill);
            });
        } catch (e) {
            window.Logger.error('Error during editor initialization', e);
        }

        // Setup button groups independently
        try {
            window.EditorView.setupActionButtons();
        } catch(e) {
            window.Logger.error('Error setting up action buttons', e);
        }

        try {
            window.EditorView.setupBottomButtons();
        } catch(e) {
            window.Logger.error('Error setting up bottom buttons', e);
        }
    },

    setupActionButtons: () => {
        const importBtn = document.getElementById('import-md-btn');
        const changeThemeBtn = document.getElementById('change-theme-btn');
        const copyBtn = document.getElementById('copy-wechat-btn');

        if (!importBtn || !changeThemeBtn || !copyBtn) {
             window.Logger.error('One or more action buttons not found.');
             return;
        }

        // --- Event Listeners ---
        importBtn.onclick = () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.md, .markdown';
            fileInput.onchange = (event) => {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    let markdownText = e.target.result;
                    markdownText = markdownText.replace(/([\r\n]+\s*){2,}/g, '\n\n');
                    const converter = new showdown.Converter();
                    let html = converter.makeHtml(markdownText);
                    html = html.replace(/<p>(\s|<br\s*\/?>)*<\/p>/gi, '');

                    // 新建草稿并设为当前
                    const newDraft = window.draftService.createDraft(html);
                    window.draftService.setCurrentDraftId(newDraft.id);
                    window.EditorView.currentDraftId = newDraft.id;
                    window.EditorView.quillInstance.root.innerHTML = html;
                    // 标记为"刚导入未保存"
                    window.EditorView.justImportedDraftId = newDraft.id;
                };
                reader.onerror = () => alert('读取文件时出错！');
                reader.readAsText(file);
            };
            fileInput.click();
        };

        changeThemeBtn.onclick = () => {
            window.location.hash = '#themes';
        };

        copyBtn.onclick = () => {
            const activeTheme = window.themeService.getActiveTheme();
            const styles = activeTheme.styles;
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = window.EditorView.quillInstance.root.innerHTML;

            // Apply styles inline
            tempContainer.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => el.style.color = styles['--h1-color']);
            tempContainer.querySelectorAll('p').forEach(el => el.style.color = styles['--p-color']);
            tempContainer.querySelectorAll('a').forEach(el => el.style.color = styles['--a-color']);

            let finalHtml = tempContainer.innerHTML;
            const icons = window.iconService.getIcons();
            const iconMap = new Map(icons.map(icon => [icon.name, icon]));
            finalHtml = finalHtml.replace(/\[icon:([^\]]+)\]/g, (match, iconName) => {
                const icon = iconMap.get(iconName.trim());
                if (!icon) return match;
                return icon.color ? icon.svg.replace(/<svg/i, `<svg style="color: ${icon.color};"`) : icon.svg;
            });

            navigator.clipboard.writeText(finalHtml).then(() => {
                alert('已成功复制到剪贴板！');
            }).catch(err => {
                window.Logger.error('复制失败', err);
                alert('复制失败，请检查浏览器权限。');
            });
        };
    },
    
    setupBottomButtons: () => {
        const editorWrapper = document.querySelector('.editor-wrapper');
        if (!editorWrapper) return;

        let oldActionBar = editorWrapper.querySelector('.editor-action-bar');
        if (oldActionBar) oldActionBar.remove();

        const actionBar = document.createElement('div');
        actionBar.className = 'editor-action-bar';
        actionBar.style.cssText = 'display: flex; justify-content: center; gap: 16px; margin: 24px 0 0 0;';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'editor-save-btn main-btn';
        saveBtn.textContent = '保存修改';
        saveBtn.style.minWidth = '120px';

        const discardBtn = document.createElement('button');
        discardBtn.className = 'editor-discard-btn main-btn';
        discardBtn.textContent = '放弃修改';
        discardBtn.style.minWidth = '120px';

        actionBar.appendChild(saveBtn);
        actionBar.appendChild(discardBtn);
        editorWrapper.appendChild(actionBar);

        saveBtn.onclick = () => {
            const content = window.EditorView.quillInstance.root.innerHTML;
            const current = window.draftService.getDraft(window.EditorView.currentDraftId);
            const draftToSave = { ...current, content, updatedAt: new Date().toISOString() };
            window.draftService.saveDraft(draftToSave);
            alert('修改已保存！');
            window.location.hash = '#drafts';
        };

        discardBtn.onclick = () => {
            if (confirm('确定要放弃所有修改吗？内容将恢复到上次保存的状态。')) {
                // 如果是刚导入未保存的草稿，删除它
                if (window.EditorView.justImportedDraftId === window.EditorView.currentDraftId) {
                    window.draftService.deleteDraft(window.EditorView.currentDraftId);
                    // 恢复到上一个草稿或清空
                    const drafts = window.draftService.getDrafts();
                    if (drafts.length > 0) {
                        const lastDraft = drafts[drafts.length - 1];
                        window.draftService.setCurrentDraftId(lastDraft.id);
                        window.EditorView.currentDraftId = lastDraft.id;
                        window.EditorView.quillInstance.root.innerHTML = lastDraft.content;
                    } else {
                        window.EditorView.currentDraftId = null;
                        window.EditorView.quillInstance.setContents([]);
                    }
                    window.EditorView.justImportedDraftId = null;
                } else {
                    // 原有逻辑
                    const draft = window.draftService.getDraft(window.EditorView.currentDraftId);
                    if (draft) {
                        window.EditorView.quillInstance.root.innerHTML = draft.content;
                    } else {
                        window.EditorView.quillInstance.setContents([]);
                    }
                }
            }
        };
    }
}; 