import { Storage } from '../utils/storage.js';

/**
 * DraftsView 模块
 * 负责草稿仓界面的所有逻辑
 */
export class DraftsView {
    /**
     * @param {function(string, string): void} showMessageCallback - 显示通知的回调函数
     * @param {function(string): void} switchViewCallback - 切换界面的回调函数
     */
    constructor(showMessageCallback, switchViewCallback) {
        if (typeof showMessageCallback !== 'function') {
            throw new Error('DraftsView需要一个有效的回调函数来显示消息');
        }
        if (typeof switchViewCallback !== 'function') {
            throw new Error('DraftsView需要一个有效的回调函数来切换界面');
        }
        this.showMessage = showMessageCallback;
        this.switchView = switchViewCallback;
        this.selectedDrafts = new Set(); // 存储选中的草稿ID
        this.init();
    }

    /**
     * 初始化草稿仓和事件监听器
     */
    init() {
        this.setupEventListeners();
        this.loadDrafts();
    }

    /**
     * 设置草稿仓界面的事件监听器
     */
    setupEventListeners() {
        // 批量应用主题按钮
        document.getElementById('batch-apply-theme')?.addEventListener('click', () => {
            this.batchApplyTheme();
        });

        // 监听草稿列表的点击事件（使用事件委托）
        document.getElementById('drafts-list')?.addEventListener('click', (e) => {
            this.handleDraftListClick(e);
        });

        // 监听复选框变化事件（使用事件委托）
        document.getElementById('drafts-list')?.addEventListener('change', (e) => {
            this.handleCheckboxChange(e);
        });

        // MD批量导入功能
        this.setupBatchImport();
    }

    /**
     * 设置MD批量导入功能
     */
    setupBatchImport() {
        // 创建隐藏的文件输入元素
        if (!document.getElementById('batch-md-input')) {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'batch-md-input';
            fileInput.accept = '.md,.txt';
            fileInput.multiple = true;
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);

            fileInput.addEventListener('change', (e) => {
                this.handleBatchMDImport(e);
            });
        }

        // 添加批量导入按钮到界面
        this.addBatchImportButton();
    }

    /**
     * 添加批量导入按钮到草稿仓界面
     */
    addBatchImportButton() {
        const viewActions = document.querySelector('#drafts-view .view-actions');
        if (!viewActions || document.getElementById('batch-import-md')) return;

        const importButton = document.createElement('button');
        importButton.className = 'btn btn-secondary';
        importButton.id = 'batch-import-md';
        importButton.innerHTML = `
            <i class="fas fa-file-import"></i>
            批量导入MD
        `;

        importButton.addEventListener('click', () => {
            document.getElementById('batch-md-input')?.click();
        });

        // 插入到批量应用主题按钮之前
        const batchApplyBtn = document.getElementById('batch-apply-theme');
        if (batchApplyBtn) {
            viewActions.insertBefore(importButton, batchApplyBtn);
        } else {
            viewActions.appendChild(importButton);
        }
    }

    /**
     * 处理MD文档批量导入
     * @param {Event} event - 文件输入事件
     */
    async handleBatchMDImport(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        this.showMessage(`开始处理 ${files.length} 个文件...`, 'info');

        const drafts = Storage.loadJSON('qulome_drafts', []);
        let successCount = 0;
        let errorCount = 0;

        for (const file of files) {
            try {
                const content = await this.readFile(file);
                const cleanedContent = this.cleanMarkdownContent(content);
                const htmlContent = this.parseMarkdownToHTML(cleanedContent);
                
                // 从文件名提取标题（去掉扩展名）
                const title = file.name.replace(/\.(md|txt)$/i, '') || '无标题文档';
                
                // 创建草稿条目
                const newDraft = {
                    id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title: title,
                    content: htmlContent,
                    source: 'batch_import',
                    fileName: file.name,
                    createdAt: new Date().toISOString()
                };

                drafts.unshift(newDraft);
                successCount++;

            } catch (error) {
                console.error(`处理文件 ${file.name} 失败:`, error);
                errorCount++;
            }
        }

        // 保存所有草稿
        const result = Storage.saveJSON('qulome_drafts', drafts);
        
        if (result.success) {
            this.showMessage(
                `批量导入完成！成功: ${successCount} 个，失败: ${errorCount} 个`, 
                errorCount === 0 ? 'success' : 'warning'
            );
            this.loadDrafts(); // 重新加载草稿列表
        } else {
            this.showMessage(`保存失败: ${result.error}`, 'error');
        }

        // 清空文件输入
        event.target.value = '';
    }

    /**
     * 异步读取文件内容
     * @param {File} file - 文件对象
     * @returns {Promise<string>} 文件内容
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    /**
     * 清理Markdown内容，移除空行
     * @param {string} content - Markdown内容
     * @returns {string} 清理后的内容
     */
    cleanMarkdownContent(content) {
        return content.split('\n').filter(line => line.trim() !== '').join('\n');
    }

    /**
     * 将Markdown简单解析为HTML
     * @param {string} markdown - Markdown文本
     * @returns {string} HTML文本
     */
    parseMarkdownToHTML(markdown) {
        // 基础的Markdown到HTML转换
        let html = markdown
            // 标题转换
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // 粗体和斜体
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // 链接
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            // 代码块
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // 换行转段落
            .split('\n')
            .map(line => line.trim() ? `<p>${line}</p>` : '')
            .filter(line => line)
            .join('');

        return html;
    }

    /**
     * 加载草稿列表
     */
    loadDrafts() {
        const drafts = Storage.loadJSON('qulome_drafts', []);
        this.renderDraftsList(drafts);
    }

    /**
     * 渲染草稿列表
     * @param {Array} drafts - 草稿数组
     */
    renderDraftsList(drafts) {
        const draftsList = document.getElementById('drafts-list');
        if (!draftsList) return;

        if (drafts.length === 0) {
            draftsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
                    <p style="color: #666; margin: 0;">还没有草稿</p>
                    <p style="color: #999; font-size: 14px; margin: 8px 0 0 0;">
                        在编辑器中保存内容或导入MD文档后，草稿会显示在这里
                    </p>
                </div>
            `;
            return;
        }

        // 清空选中状态
        this.selectedDrafts.clear();

        draftsList.innerHTML = `
            <div class="drafts-header">
                <div class="drafts-controls">
                    <label class="checkbox-container">
                        <input type="checkbox" id="select-all-drafts">
                        <span class="checkmark"></span>
                        全选 (${drafts.length})
                    </label>
                    <div class="selected-count" id="selected-count" style="display: none;">
                        已选择 <span id="selected-number">0</span> 项
                    </div>
                </div>
                <div class="drafts-actions" id="drafts-actions" style="display: none;">
                    <button class="btn btn-sm btn-secondary" id="batch-delete">
                        <i class="fas fa-trash"></i>
                        删除选中
                    </button>
                    <button class="btn btn-sm btn-primary" id="batch-publish">
                        <i class="fas fa-rocket"></i>
                        发布选中
                    </button>
                </div>
            </div>
            <div class="drafts-grid">
                ${drafts.map(draft => this.createDraftCard(draft)).join('')}
            </div>
        `;

        // 设置全选复选框事件
        document.getElementById('select-all-drafts')?.addEventListener('change', (e) => {
            this.handleSelectAll(e.target.checked, drafts);
        });

        // 设置批量操作按钮事件
        document.getElementById('batch-delete')?.addEventListener('click', () => {
            this.batchDeleteDrafts();
        });

        document.getElementById('batch-publish')?.addEventListener('click', () => {
            this.batchPublishDrafts();
        });
    }

    /**
     * 创建草稿卡片HTML
     * @param {Object} draft - 草稿对象
     * @returns {string} HTML字符串
     */
    createDraftCard(draft) {
        const createdDate = new Date(draft.createdAt).toLocaleString();
        const contentPreview = this.extractTextContent(draft.content).substring(0, 100) + '...';
        
        return `
            <div class="draft-card" data-draft-id="${draft.id}">
                <div class="draft-card-header">
                    <label class="checkbox-container">
                        <input type="checkbox" class="draft-checkbox" data-draft-id="${draft.id}">
                        <span class="checkmark"></span>
                    </label>
                    <div class="draft-title">${draft.title}</div>
                    <div class="draft-menu">
                        <button class="btn-icon" data-action="edit" data-draft-id="${draft.id}" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" data-action="delete" data-draft-id="${draft.id}" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="draft-content-preview">${contentPreview}</div>
                <div class="draft-meta">
                    <span class="draft-date">
                        <i class="fas fa-clock"></i>
                        ${createdDate}
                    </span>
                    <span class="draft-size">
                        ${this.formatFileSize(draft.content.length)}
                    </span>
                </div>
                <div class="draft-actions">
                    <button class="btn btn-sm btn-secondary" data-action="edit" data-draft-id="${draft.id}">
                        编辑
                    </button>
                    <button class="btn btn-sm btn-primary" data-action="publish" data-draft-id="${draft.id}">
                        发布
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 从HTML内容中提取纯文本
     * @param {string} html - HTML内容
     * @returns {string} 纯文本
     */
    extractTextContent(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的大小
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / (1024 * 1024)) + ' MB';
    }

    /**
     * 处理草稿列表的点击事件
     * @param {Event} event - 点击事件
     */
    handleDraftListClick(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const draftId = button.dataset.draftId;

        switch (action) {
            case 'edit':
                this.editDraft(draftId);
                break;
            case 'delete':
                this.deleteDraft(draftId);
                break;
            case 'publish':
                this.publishDraft(draftId);
                break;
        }
    }

    /**
     * 处理复选框变化事件
     * @param {Event} event - 变化事件
     */
    handleCheckboxChange(event) {
        if (event.target.classList.contains('draft-checkbox')) {
            const draftId = event.target.dataset.draftId;
            if (event.target.checked) {
                this.selectedDrafts.add(draftId);
            } else {
                this.selectedDrafts.delete(draftId);
            }
            this.updateSelectionUI();
        }
    }

    /**
     * 处理全选操作
     * @param {boolean} checked - 是否选中
     * @param {Array} drafts - 草稿数组
     */
    handleSelectAll(checked, drafts) {
        const checkboxes = document.querySelectorAll('.draft-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const draftId = checkbox.dataset.draftId;
            if (checked) {
                this.selectedDrafts.add(draftId);
            } else {
                this.selectedDrafts.delete(draftId);
            }
        });
        this.updateSelectionUI();
    }

    /**
     * 更新选择状态UI
     */
    updateSelectionUI() {
        const selectedCount = this.selectedDrafts.size;
        const selectedCountEl = document.getElementById('selected-count');
        const selectedNumberEl = document.getElementById('selected-number');
        const draftsActionsEl = document.getElementById('drafts-actions');

        if (selectedCount > 0) {
            selectedCountEl.style.display = 'block';
            draftsActionsEl.style.display = 'flex';
            selectedNumberEl.textContent = selectedCount;
        } else {
            selectedCountEl.style.display = 'none';
            draftsActionsEl.style.display = 'none';
        }

        // 更新全选复选框状态
        const selectAllCheckbox = document.getElementById('select-all-drafts');
        const totalCheckboxes = document.querySelectorAll('.draft-checkbox').length;
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = selectedCount === totalCheckboxes && totalCheckboxes > 0;
            selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalCheckboxes;
        }
    }

    /**
     * 编辑草稿
     * @param {string} draftId - 草稿ID
     */
    editDraft(draftId) {
        const drafts = Storage.loadJSON('qulome_drafts', []);
        const draft = drafts.find(d => d.id === draftId);
        
        if (!draft) {
            this.showMessage('草稿不存在', 'error');
            return;
        }

        // 将草稿内容存储到临时位置，供编辑器加载
        Storage.saveJSON('qulome_temp_draft', draft);
        
        // 切换到编辑器界面
        this.switchView('editor');
        this.showMessage(`正在编辑草稿: ${draft.title}`, 'info');
    }

    /**
     * 删除草稿
     * @param {string} draftId - 草稿ID
     */
    deleteDraft(draftId) {
        const drafts = Storage.loadJSON('qulome_drafts', []);
        const draftIndex = drafts.findIndex(d => d.id === draftId);
        
        if (draftIndex === -1) {
            this.showMessage('草稿不存在', 'error');
            return;
        }

        const draft = drafts[draftIndex];
        
        if (!confirm(`确定要删除草稿 "${draft.title}" 吗？`)) {
            return;
        }

        drafts.splice(draftIndex, 1);
        const result = Storage.saveJSON('qulome_drafts', drafts);
        
        if (result.success) {
            this.showMessage('草稿已删除', 'success');
            this.loadDrafts(); // 重新加载列表
        } else {
            this.showMessage(`删除失败: ${result.error}`, 'error');
        }
    }

    /**
     * 发布草稿
     * @param {string} draftId - 草稿ID
     */
    publishDraft(draftId) {
        const drafts = Storage.loadJSON('qulome_drafts', []);
        const draft = drafts.find(d => d.id === draftId);
        
        if (!draft) {
            this.showMessage('草稿不存在', 'error');
            return;
        }

        // 加载发布列表
        const publishedItems = Storage.loadJSON('qulome_published', []);
        
        // 创建发布项目
        const publishedItem = {
            id: `published-${Date.now()}`,
            title: draft.title,
            content: draft.content,
            originalDraftId: draft.id,
            publishedAt: new Date().toISOString(),
            createdAt: draft.createdAt
        };

        publishedItems.unshift(publishedItem);
        const result = Storage.saveJSON('qulome_published', publishedItems);
        
        if (result.success) {
            this.showMessage(`草稿 "${draft.title}" 已发布`, 'success');
        } else {
            this.showMessage(`发布失败: ${result.error}`, 'error');
        }
    }

    /**
     * 批量删除草稿
     */
    batchDeleteDrafts() {
        if (this.selectedDrafts.size === 0) {
            this.showMessage('请先选择要删除的草稿', 'warning');
            return;
        }

        if (!confirm(`确定要删除选中的 ${this.selectedDrafts.size} 个草稿吗？`)) {
            return;
        }

        const drafts = Storage.loadJSON('qulome_drafts', []);
        const updatedDrafts = drafts.filter(draft => !this.selectedDrafts.has(draft.id));
        
        const result = Storage.saveJSON('qulome_drafts', updatedDrafts);
        
        if (result.success) {
            this.showMessage(`已删除 ${this.selectedDrafts.size} 个草稿`, 'success');
            this.selectedDrafts.clear();
            this.loadDrafts();
        } else {
            this.showMessage(`批量删除失败: ${result.error}`, 'error');
        }
    }

    /**
     * 批量发布草稿
     */
    batchPublishDrafts() {
        if (this.selectedDrafts.size === 0) {
            this.showMessage('请先选择要发布的草稿', 'warning');
            return;
        }

        const drafts = Storage.loadJSON('qulome_drafts', []);
        const selectedDraftsList = drafts.filter(draft => this.selectedDrafts.has(draft.id));
        const publishedItems = Storage.loadJSON('qulome_published', []);

        // 批量创建发布项目
        selectedDraftsList.forEach(draft => {
            const publishedItem = {
                id: `published-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: draft.title,
                content: draft.content,
                originalDraftId: draft.id,
                publishedAt: new Date().toISOString(),
                createdAt: draft.createdAt
            };
            publishedItems.unshift(publishedItem);
        });

        const result = Storage.saveJSON('qulome_published', publishedItems);
        
        if (result.success) {
            this.showMessage(`已发布 ${selectedDraftsList.length} 个草稿`, 'success');
            this.selectedDrafts.clear();
            this.updateSelectionUI();
        } else {
            this.showMessage(`批量发布失败: ${result.error}`, 'error');
        }
    }

    /**
     * 批量应用主题（头部按钮功能）
     */
    batchApplyTheme() {
        if (this.selectedDrafts.size === 0) {
            this.showMessage('请先选择要应用主题的草稿', 'warning');
            return;
        }

        // 这里可以打开主题选择对话框
        // 暂时显示提示信息
        this.showMessage('主题应用功能开发中...', 'info');
    }

    /**
     * 刷新草稿列表
     */
    refresh() {
        this.loadDrafts();
    }

    /**
     * 获取选中的草稿数量
     * @returns {number} 选中的草稿数量
     */
    getSelectedCount() {
        return this.selectedDrafts.size;
    }
} 