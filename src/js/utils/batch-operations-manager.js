/**
 * Batch Operations Manager - 批量操作管理器
 * 
 * 提供草稿和发布内容的批量操作功能
 */

window.BatchOperationsManager = {
    // 选中的项目
    selectedItems: new Set(),
    
    // 当前操作模式
    currentMode: 'drafts', // 'drafts' or 'published'
    
    // 批量操作类型
    operationTypes: {
        DELETE: 'delete',
        PUBLISH: 'publish',
        APPLY_THEME: 'apply-theme',
        EXPORT: 'export',
        MOVE_TO_DRAFTS: 'move-to-drafts'
    },

    /**
     * 初始化批量操作
     * @param {string} mode - 操作模式 ('drafts' 或 'published')
     */
    init(mode = 'drafts') {
        this.currentMode = mode;
        this.selectedItems.clear();
        this.updateUI();
        
        window.Logger.debug(`Batch operations initialized for ${mode}`);
    },

    /**
     * 切换项目选中状态
     * @param {string} itemId - 项目ID
     */
    toggleSelection(itemId) {
        if (this.selectedItems.has(itemId)) {
            this.selectedItems.delete(itemId);
        } else {
            this.selectedItems.add(itemId);
        }
        
        this.updateSelectionUI(itemId);
        this.updateBatchActionsUI();
        
        window.Logger.debug(`Item ${itemId} selection toggled. Selected: ${this.selectedItems.size}`);
    },

    /**
     * 全选/取消全选
     */
    toggleSelectAll() {
        const items = this.getAllItems();
        const allSelected = items.every(item => this.selectedItems.has(item.id));
        
        if (allSelected) {
            // 取消全选
            this.selectedItems.clear();
        } else {
            // 全选
            items.forEach(item => this.selectedItems.add(item.id));
        }
        
        this.updateUI();
        window.Logger.debug(`Select all toggled. Selected: ${this.selectedItems.size}`);
    },

    /**
     * 获取当前模式下的所有项目
     */
    getAllItems() {
        if (this.currentMode === 'drafts') {
            return window.draftService ? window.draftService.getDrafts() : [];
        } else {
            return window.publishService ? window.publishService.getPublished() : [];
        }
    },

    /**
     * 获取选中的项目
     */
    getSelectedItems() {
        const allItems = this.getAllItems();
        return allItems.filter(item => this.selectedItems.has(item.id));
    },

    /**
     * 执行批量操作
     * @param {string} operation - 操作类型
     * @param {Object} options - 操作选项
     */
    async executeBatchOperation(operation, options = {}) {
        const selectedItems = this.getSelectedItems();
        
        if (selectedItems.length === 0) {
            window.ErrorHandler.handle('请先选择要操作的项目');
            return false;
        }

        const confirmMessage = this.getConfirmMessage(operation, selectedItems.length);
        if (!confirm(confirmMessage)) {
            return false;
        }

        try {
            let successCount = 0;
            
            switch (operation) {
                case this.operationTypes.DELETE:
                    successCount = await this.batchDelete(selectedItems);
                    break;
                    
                case this.operationTypes.PUBLISH:
                    successCount = await this.batchPublish(selectedItems);
                    break;
                    
                case this.operationTypes.APPLY_THEME:
                    successCount = await this.batchApplyTheme(selectedItems, options.themeId);
                    break;
                    
                case this.operationTypes.EXPORT:
                    successCount = await this.batchExport(selectedItems, options.format);
                    break;
                    
                case this.operationTypes.MOVE_TO_DRAFTS:
                    successCount = await this.batchMoveToDrafts(selectedItems);
                    break;
                    
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }
            
            // 显示结果
            this.showOperationResult(operation, successCount, selectedItems.length);
            
            // 清空选择并刷新UI
            this.selectedItems.clear();
            this.refreshCurrentView();
            
            return true;
            
        } catch (error) {
            window.Logger.error('Batch operation failed', error);
            window.ErrorHandler.handle(error, 'BatchOperationsManager.executeBatchOperation');
            return false;
        }
    },

    /**
     * 批量删除
     */
    async batchDelete(items) {
        let successCount = 0;
        
        for (const item of items) {
            try {
                if (this.currentMode === 'drafts') {
                    window.draftService.deleteDraft(item.id);
                } else {
                    window.publishService.removeFromPublished(item.id);
                }
                successCount++;
            } catch (error) {
                window.Logger.error(`Failed to delete item ${item.id}`, error);
            }
        }
        
        return successCount;
    },

    /**
     * 批量发布
     */
    async batchPublish(items) {
        let successCount = 0;
        
        for (const item of items) {
            try {
                if (this.currentMode === 'drafts') {
                    const publishItem = {
                        id: 'pub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                        originalDraftId: item.id,
                        title: item.title,
                        content: item.content,
                        publishedAt: new Date().toISOString(),
                        themeId: item.themeId || window.themeService.getActiveTheme()?.id
                    };
                    
                    window.publishService.addToPublished(publishItem);
                    window.draftService.deleteDraft(item.id);
                    successCount++;
                }
            } catch (error) {
                window.Logger.error(`Failed to publish item ${item.id}`, error);
            }
        }
        
        return successCount;
    },

    /**
     * 批量应用主题
     */
    async batchApplyTheme(items, themeId) {
        if (!themeId) {
            throw new Error('Theme ID is required for batch theme application');
        }
        
        let successCount = 0;
        
        for (const item of items) {
            try {
                item.themeId = themeId;
                item.updatedAt = new Date().toISOString();
                
                if (this.currentMode === 'drafts') {
                    window.draftService.saveDraft(item);
                } else {
                    window.publishService.updatePublished(item);
                }
                successCount++;
            } catch (error) {
                window.Logger.error(`Failed to apply theme to item ${item.id}`, error);
            }
        }
        
        return successCount;
    },

    /**
     * 批量导出
     */
    async batchExport(items, format = 'json') {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                itemCount: items.length,
                type: this.currentMode
            },
            items: items
        };
        
        const filename = `qulome-${this.currentMode}-batch-${Date.now()}`;
        
        if (window.DataManager) {
            switch (format) {
                case 'json':
                    await window.DataManager.downloadJSON(exportData, `${filename}.json`);
                    break;
                case 'md':
                    await window.DataManager.downloadMarkdown(exportData, `${filename}.md`);
                    break;
                case 'html':
                    await window.DataManager.downloadHTML(exportData, `${filename}.html`);
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        }
        
        return items.length;
    },

    /**
     * 批量移动到草稿仓
     */
    async batchMoveToDrafts(items) {
        let successCount = 0;
        
        for (const item of items) {
            try {
                if (this.currentMode === 'published') {
                    const draftItem = {
                        id: 'draft-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                        title: item.title,
                        content: item.content,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        themeId: item.themeId,
                        originalPublishId: item.id
                    };
                    
                    window.draftService.saveDraft(draftItem);
                    window.publishService.removeFromPublished(item.id);
                    successCount++;
                }
            } catch (error) {
                window.Logger.error(`Failed to move item ${item.id} to drafts`, error);
            }
        }
        
        return successCount;
    },

    /**
     * 获取确认消息
     */
    getConfirmMessage(operation, count) {
        const messages = {
            [this.operationTypes.DELETE]: `确定要删除选中的 ${count} 个项目吗？此操作无法撤销。`,
            [this.operationTypes.PUBLISH]: `确定要发布选中的 ${count} 个草稿吗？发布后草稿将被移动到发布仓。`,
            [this.operationTypes.APPLY_THEME]: `确定要为选中的 ${count} 个项目应用新主题吗？`,
            [this.operationTypes.EXPORT]: `确定要导出选中的 ${count} 个项目吗？`,
            [this.operationTypes.MOVE_TO_DRAFTS]: `确定要将选中的 ${count} 个项目移动到草稿仓吗？`
        };
        
        return messages[operation] || `确定要对选中的 ${count} 个项目执行此操作吗？`;
    },

    /**
     * 显示操作结果
     */
    showOperationResult(operation, successCount, totalCount) {
        const operationNames = {
            [this.operationTypes.DELETE]: '删除',
            [this.operationTypes.PUBLISH]: '发布',
            [this.operationTypes.APPLY_THEME]: '应用主题',
            [this.operationTypes.EXPORT]: '导出',
            [this.operationTypes.MOVE_TO_DRAFTS]: '移动到草稿仓'
        };
        
        const operationName = operationNames[operation] || '操作';
        
        if (successCount === totalCount) {
            window.Notification?.show(`成功${operationName} ${successCount} 个项目`, 'success');
        } else {
            window.Notification?.show(
                `${operationName}完成：成功 ${successCount} 个，失败 ${totalCount - successCount} 个`, 
                'warning'
            );
        }
    },

    /**
     * 更新选择UI
     */
    updateSelectionUI(itemId) {
        const checkbox = document.querySelector(`input[data-item-id="${itemId}"]`);
        if (checkbox) {
            checkbox.checked = this.selectedItems.has(itemId);
        }
        
        const itemElement = document.querySelector(`[data-draft-id="${itemId}"], [data-article-id="${itemId}"]`);
        if (itemElement) {
            itemElement.classList.toggle('selected', this.selectedItems.has(itemId));
        }
    },

    /**
     * 更新批量操作按钮UI
     */
    updateBatchActionsUI() {
        const selectedCount = this.selectedItems.size;
        
        // 更新对应模式的批量操作栏
        let batchActionsBar;
        if (this.currentMode === 'drafts') {
            batchActionsBar = document.getElementById('batch-actions-bar');
        } else {
            batchActionsBar = document.getElementById('batch-actions-bar-published');
        }
        
        if (batchActionsBar) {
            if (selectedCount > 0) {
                batchActionsBar.style.display = 'flex';
                const countElement = batchActionsBar.querySelector('.selected-count, .selected-count-published');
                if (countElement) {
                    countElement.textContent = `已选择 ${selectedCount} 项`;
                }
            } else {
                batchActionsBar.style.display = 'none';
            }
        }
        
        // 更新全选按钮状态
        let selectAllCheckbox;
        if (this.currentMode === 'drafts') {
            selectAllCheckbox = document.getElementById('select-all-drafts');
        } else {
            selectAllCheckbox = document.getElementById('select-all-published');
        }
        
        if (selectAllCheckbox) {
            const allItems = this.getAllItems();
            const allSelected = allItems.length > 0 && allItems.every(item => this.selectedItems.has(item.id));
            const someSelected = selectedCount > 0 && selectedCount < allItems.length;
            
            selectAllCheckbox.checked = allSelected;
            selectAllCheckbox.indeterminate = someSelected;
        }
    },

    /**
     * 更新整体UI
     */
    updateUI() {
        // 更新所有项目的选择状态
        this.getAllItems().forEach(item => {
            this.updateSelectionUI(item.id);
        });
        
        // 更新批量操作UI
        this.updateBatchActionsUI();
    },

    /**
     * 刷新当前视图
     */
    refreshCurrentView() {
        if (this.currentMode === 'drafts' && window.DraftsView) {
            window.DraftsView.render();
        } else if (this.currentMode === 'published' && window.PublishView) {
            window.PublishView.render();
        }
    },

    /**
     * 显示主题选择器
     */
    showThemeSelector() {
        if (this.selectedItems.size === 0) {
            window.ErrorHandler.handle('请先选择要应用主题的项目');
            return;
        }

        const themes = window.themeService ? window.themeService.getThemes() : [];
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content theme-selector-modal">
                <h3 class="modal-title">选择主题</h3>
                <p>将为选中的 ${this.selectedItems.size} 个项目应用主题</p>
                <div class="theme-options">
                    ${themes.map(theme => `
                        <div class="theme-option" data-theme-id="${theme.id}">
                            <div class="theme-preview-mini" style="background: ${theme.styles['--p-color'] || '#333'}">
                                <h4 style="color: ${theme.styles['--h1-color'] || '#000'}">${theme.name}</h4>
                                <p style="color: ${theme.styles['--p-color'] || '#333'}">示例文本</p>
                            </div>
                            <span class="theme-name">${theme.name}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary close-modal">取消</button>
                    <button class="btn btn-primary apply-theme" disabled>应用主题</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        let selectedThemeId = null;
        
        // 主题选择事件
        modal.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                modal.querySelectorAll('.theme-option').forEach(opt => 
                    opt.classList.remove('selected'));
                option.classList.add('selected');
                selectedThemeId = option.dataset.themeId;
                modal.querySelector('.apply-theme').disabled = false;
            });
        });
        
        // 应用主题
        modal.querySelector('.apply-theme').addEventListener('click', () => {
            if (selectedThemeId) {
                this.executeBatchOperation(this.operationTypes.APPLY_THEME, { themeId: selectedThemeId });
                document.body.removeChild(modal);
            }
        });
        
        // 关闭模态框
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
};