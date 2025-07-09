/**
 * Drafts View Module
 * 负责草稿仓视图的渲染、事件绑定和交互逻辑。
 * - 渲染草稿列表
 * - 处理草稿的载入、发布和删除
 * - 统一事件绑定管理
 * - 错误处理和用户反馈
 */
window.DraftsView = {
    // State management
    isInitialized: false,
    eventHandlers: new Map(),

    /**
     * 初始化草稿仓视图：渲染草稿列表并绑定事件
     */
    init: () => {
        try {
            if (window.DraftsView.isInitialized) {
                window.Logger.debug('DraftsView already initialized, refreshing...');
                window.DraftsView.render();
                return;
            }

            window.DraftsView.render();
            window.DraftsView.bindEvents();
            window.DraftsView.isInitialized = true;
            window.Logger.debug('DraftsView initialized successfully');
        } catch (error) {
            // 使用标准化错误处理
            if (window.StandardErrorHandler) {
                window.StandardErrorHandler.handle(error, 'DraftsView.init', {
                    recovery: () => {
                        // 尝试自动恢复
                        setTimeout(() => {
                            try {
                                window.DraftsView.isInitialized = false;
                                window.DraftsView.init();
                            } catch (retryError) {
                                window.Logger.error('DraftsView auto-recovery failed', retryError);
                            }
                        }, 2000);
                    }
                });
            } else {
                window.Logger.error('Failed to initialize DraftsView', error.message, error.stack);
                window.DraftsView.showError('草稿视图初始化失败，请刷新页面重试');
            }
        }
    },

    /**
     * 清理事件处理器和资源
     */
    cleanup: () => {
        window.DraftsView.eventHandlers.forEach((handler, element) => {
            if (element && typeof element.removeEventListener === 'function') {
                element.removeEventListener(handler.event, handler.callback);
            }
        });
        window.DraftsView.eventHandlers.clear();
        window.DraftsView.isInitialized = false;
        window.Logger.debug('DraftsView cleaned up');
    },

    /**
     * 添加事件处理器并跟踪以便清理
     */
    addEventHandler: (element, event, callback) => {
        if (!element) return;
        
        // 移除现有处理器（如果存在）
        const existingHandler = window.DraftsView.eventHandlers.get(element);
        if (existingHandler && existingHandler.event === event) {
            element.removeEventListener(event, existingHandler.callback);
        }

        // 添加新处理器
        element.addEventListener(event, callback);
        window.DraftsView.eventHandlers.set(element, { event, callback });
    },

    /**
     * 渲染草稿列表
     */
    render: () => {
        try {
            // 验证必要的依赖是否可用
            if (!window.draftService || typeof window.draftService.getDrafts !== 'function') {
                throw new Error('草稿服务不可用');
            }

            const drafts = window.draftService.getDrafts().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            const listContainer = document.getElementById('drafts-list');

            if (!listContainer) {
                throw new Error('草稿列表容器 #drafts-list 未找到');
            }

            // 更新标题显示草稿数量
            const header = document.querySelector('#drafts-view .main-view-header h1');
            if (header) {
                header.textContent = `草稿仓`;
            }

            if (drafts.length === 0) {
                listContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <p>空空如也，快去创作吧！</p>
                        <button class="btn btn-primary" onclick="window.location.hash='#editor'">开始写作</button>
                    </div>
                `;
                return;
            }

            listContainer.innerHTML = drafts.map(draft => {
                // 统计项
                const wordCount = window.DraftsView.getWordCount(draft.content);
                const paragraphCount = (draft.content.match(/<p[\s>]/g) || []).length;
                const imageCount = (draft.content.match(/<img[\s>]/g) || []).length;
                return `
                <div class="list-item" data-draft-id="${draft.id}">
                  <div class="item-selection">
                    <input type="checkbox" class="item-checkbox" data-item-id="${draft.id}">
                  </div>
                  <div class="item-main">
                    <div class="item-info">
                      <h3 class="item-title" title="${window.DraftsView.escapeHtml(draft.title)}">
                        ${window.DraftsView.escapeHtml(draft.title)}
                      </h3>
                      <div class="item-preview">
                        ${window.DraftsView.getContentPreview(draft.content)}
                      </div>
                    </div>
                    <div class="item-stats">
                      <div class="stat"><span class="stat-num">${wordCount}</span><span class="stat-label">字</span></div>
                      <div class="stat"><span class="stat-num">${paragraphCount}</span><span class="stat-label">段</span></div>
                      <div class="stat"><span class="stat-num">${imageCount}</span><span class="stat-label">图</span></div>
                    </div>
                  </div>
                  <div class="item-footer">
                    <div class="item-meta">
                      <span class="update-time">最后更新: ${window.DraftsView.formatDate(draft.updatedAt)}</span>
                      <span class="word-count">${wordCount} 字</span>
                    </div>
                    <div class="item-actions">
                      <button class="btn btn-secondary load-draft-btn" title="载入到编辑器">载入</button>
                      <button class="btn btn-primary publish-draft-btn" title="发布到发布仓">发布</button>
                      <button class="btn btn-danger delete-draft-btn" title="删除草稿">删除</button>
                    </div>
                    </div>
                </div>
                `;
            }).join('');

            window.Logger.debug(`Rendered ${drafts.length} drafts`);
        } catch (error) {
            window.Logger.error('Failed to render drafts', error.message, error.stack);
            window.DraftsView.showError('渲染草稿列表失败');
        }
    },

    /**
     * 绑定事件处理器
     */
    bindEvents: () => {
        try {
            // 新建草稿按钮事件
            const createNewDraftBtn = document.getElementById('create-new-draft-btn');
            if (createNewDraftBtn) {
                const handler = () => {
                    window.DraftsView.handleCreateNewDraft();
                };
                window.DraftsView.addEventHandler(createNewDraftBtn, 'click', handler);
            }
            
            // 数据管理按钮事件
            const dataManagementBtn = document.getElementById('data-management-btn');
            if (dataManagementBtn && window.DataManager) {
                const handler = () => {
                    window.DataManager.showDataManagementModal();
                };
                window.DraftsView.addEventHandler(dataManagementBtn, 'click', handler);
            }
            
            // 批量操作按钮事件
            const batchDeleteBtn = document.getElementById('batch-delete-drafts');
            if (batchDeleteBtn && window.BatchOperationsManager) {
                window.DraftsView.addEventHandler(batchDeleteBtn, 'click', () => {
                    window.BatchOperationsManager.executeBatchOperation('delete');
                });
            }

            const batchPublishBtn = document.getElementById('batch-publish-drafts');
            if (batchPublishBtn && window.BatchOperationsManager) {
                window.DraftsView.addEventHandler(batchPublishBtn, 'click', () => {
                    window.BatchOperationsManager.executeBatchOperation('publish');
                });
            }

            const batchThemeBtn = document.getElementById('batch-apply-theme-drafts');
            if (batchThemeBtn && window.BatchOperationsManager) {
                window.DraftsView.addEventHandler(batchThemeBtn, 'click', () => {
                    window.BatchOperationsManager.showThemeSelector();
                });
            }

            const selectAllBtn = document.getElementById('select-all-drafts');
            if (selectAllBtn && window.BatchOperationsManager) {
                window.DraftsView.addEventHandler(selectAllBtn, 'change', (event) => {
                    window.BatchOperationsManager.toggleSelectAll();
                });
            }
            
            const listContainer = document.getElementById('drafts-list');
            
            if (!listContainer) {
                throw new Error('草稿列表容器未找到');
            }

            // 使用事件委托绑定所有按钮点击事件
            window.DraftsView.addEventHandler(listContainer, 'click', (event) => {
                window.DraftsView.handleListItemClick(event);
            });

            // 绑定复选框事件
            window.DraftsView.addEventHandler(listContainer, 'change', (event) => {
                if (event.target.classList.contains('item-checkbox')) {
                    const itemId = event.target.dataset.itemId;
                    if (itemId && window.BatchOperationsManager) {
                        window.BatchOperationsManager.toggleSelection(itemId);
                    }
                }
            });

            // 初始化批量操作管理器
            if (window.BatchOperationsManager) {
                window.BatchOperationsManager.init('drafts');
            }

            window.Logger.debug('DraftsView events bound successfully');
        } catch (error) {
            window.Logger.error('Failed to bind events', error.message, error.stack);
            window.DraftsView.showError('事件绑定失败');
        }
    },

    /**
     * 处理列表项点击事件
     */
    handleListItemClick: (event) => {
        try {
            const listItem = event.target.closest('.list-item');
            if (!listItem) return;

            const draftId = listItem.dataset.draftId;
            if (!draftId) {
                window.Logger.error('草稿ID未找到', listItem);
                return;
            }

            // 载入草稿
            if (event.target.closest('.load-draft-btn')) {
                window.DraftsView.handleLoadDraft(draftId);
            }
            // 发布草稿
            else if (event.target.closest('.publish-draft-btn')) {
                window.DraftsView.handlePublishDraft(draftId);
            }
            // 删除草稿
            else if (event.target.closest('.delete-draft-btn')) {
                window.DraftsView.handleDeleteDraft(draftId);
            }
        } catch (error) {
            window.Logger.error('处理列表项点击失败', error);
            window.DraftsView.showError('操作失败，请重试');
        }
    },

    /**
     * 处理创建新草稿
     */
    handleCreateNewDraft: () => {
        try {
            // 创建新草稿
            const newDraft = window.draftService.createDraft('<p><br></p>', '新草稿');
            if (!newDraft) {
                throw new Error('创建草稿失败');
            }
            
            // 设置为当前编辑的草稿
            window.draftService.setCurrentDraftId(newDraft.id);
            
            // 跳转到编辑器
            window.location.hash = '#editor';
            
            // 显示成功消息
            setTimeout(() => {
                window.DraftsView.showSuccess('新草稿已创建，开始你的创作吧！');
            }, 300);
            
            window.Logger.debug('新草稿创建成功:', newDraft.id);
        } catch (error) {
            window.Logger.error('创建新草稿失败:', error);
            window.DraftsView.showError(error.message || '创建草稿失败');
        }
    },
    
    /**
     * 处理载入草稿
     */
    handleLoadDraft: (draftId) => {
        try {
            const draft = window.draftService.getDraft(draftId);
            if (!draft) {
                throw new Error('草稿未找到');
            }

            // 设置当前草稿ID
            window.draftService.setCurrentDraftId(draftId);
            
            // 切换到编辑器视图
            window.location.hash = '#editor';
            
            // 显示成功消息
            setTimeout(() => {
                window.DraftsView.showSuccess(`草稿 "${draft.title}" 已载入到编辑器`);
            }, 300);
            
            window.Logger.debug('草稿载入成功:', draft.title);
        } catch (error) {
            window.Logger.error('载入草稿失败:', error);
            window.DraftsView.showError(error.message || '载入草稿失败');
        }
    },

    /**
     * 处理发布草稿
     */
    handlePublishDraft: (draftId) => {
        try {
            const draft = window.draftService.getDraft(draftId);
            if (!draft) {
                throw new Error('草稿未找到');
            }

            if (!confirm(`确定要发布草稿 "${draft.title}" 吗？发布后草稿将移动到发布仓。`)) {
                return;
            }

            // 添加到发布仓
            if (window.publishService && typeof window.publishService.addPublished === 'function') {
                window.publishService.addPublished(draft);
            } else {
                throw new Error('发布服务不可用');
            }
            
            // 从草稿中删除
            window.draftService.deleteDraft(draftId);
            
            // 如果删除的是当前编辑的草稿，需要处理
            const currentDraftId = window.draftService.getCurrentDraftId();
            if (currentDraftId === draftId) {
                window.draftService.setCurrentDraftId(null);
                // 如果当前在编辑器视图，需要创建新草稿
                if (window.location.hash === '#editor' && window.EditorView) {
                    const newDraft = window.draftService.createDraft('<p><br></p>');
                    if (newDraft) {
                        window.draftService.setCurrentDraftId(newDraft.id);
                        window.EditorView.currentDraftId = newDraft.id;
                        if (window.EditorView.quillInstance) {
                            window.EditorView.quillInstance.root.innerHTML = '';
                        }
                    }
                }
            }
            
            // 重新渲染
            window.DraftsView.render();
            
            // 显示成功消息
            window.DraftsView.showSuccess(`草稿 "${draft.title}" 已发布！`);
            window.Logger.debug('草稿发布成功:', draft.title);
        } catch (error) {
            window.Logger.error('发布草稿失败:', error);
            window.DraftsView.showError(error.message || '发布草稿失败');
        }
    },

    /**
     * 处理删除草稿
     */
    handleDeleteDraft: (draftId) => {
        try {
            const draft = window.draftService.getDraft(draftId);
            if (!draft) {
                throw new Error('草稿未找到');
            }

            if (!confirm(`确定要删除草稿 "${draft.title}" 吗？此操作不可撤销。`)) {
                return;
            }

            // 删除草稿
            window.draftService.deleteDraft(draftId);
            
            // 如果删除的是当前编辑的草稿，需要处理
            const currentDraftId = window.draftService.getCurrentDraftId();
            if (currentDraftId === draftId) {
                // 创建新的空草稿或清空当前草稿ID
                const remainingDrafts = window.draftService.getDrafts();
                if (remainingDrafts.length > 0) {
                    window.draftService.setCurrentDraftId(remainingDrafts[0].id);
                    // 如果当前在编辑器视图，需要更新编辑器状态
                    if (window.location.hash === '#editor' && window.EditorView) {
                        window.EditorView.currentDraftId = remainingDrafts[0].id;
                        if (window.EditorView.quillInstance) {
                            window.EditorView.quillInstance.root.innerHTML = remainingDrafts[0].content || '';
                        }
                    }
                } else {
                    window.draftService.setCurrentDraftId(null);
                    // 如果当前在编辑器视图，需要创建新草稿
                    if (window.location.hash === '#editor' && window.EditorView) {
                        const newDraft = window.draftService.createDraft('<p><br></p>');
                        if (newDraft) {
                            window.draftService.setCurrentDraftId(newDraft.id);
                            window.EditorView.currentDraftId = newDraft.id;
                            if (window.EditorView.quillInstance) {
                                window.EditorView.quillInstance.root.innerHTML = '';
                            }
                        }
                    }
                }
            }
            
            // 重新渲染
            window.DraftsView.render();
            
            // 显示成功消息
            window.DraftsView.showSuccess(`草稿 "${draft.title}" 已删除`);
            window.Logger.debug('草稿删除成功:', draft.title);
        } catch (error) {
            window.Logger.error('删除草稿失败:', error);
            window.DraftsView.showError(error.message || '删除草稿失败');
        }
    },

    /**
     * 获取内容预览
     */
    getContentPreview: (content) => {
        if (!content) return '暂无内容';
        
        // 移除HTML标签，获取纯文本
        const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        
        // 截取前100个字符作为预览
        return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
    },

    /**
     * 获取字数统计
     */
    getWordCount: (content) => {
        if (!content) return 0;
        
        // 移除HTML标签，计算字符数
        const textContent = content.replace(/<[^>]+>/g, '').replace(/\s+/g, '');
        return textContent.length;
    },

    /**
     * 格式化日期显示
     */
    formatDate: (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            } else if (diffDays === 2) {
                return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            } else if (diffDays <= 7) {
                return `${diffDays - 1}天前`;
            } else {
                return date.toLocaleDateString('zh-CN', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
            }
        } catch (error) {
            return '未知时间';
        }
    },

    /**
     * 显示成功消息
     */
    showSuccess: (message) => {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10B981;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    },

    /**
     * HTML 转义函数
     */
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 初始化视图
     */
    init: () => {
        try {
            // 确保依赖服务可用
            if (!window.draftService) {
                throw new Error('草稿服务未初始化');
            }

            // 清理旧的事件处理器
            window.DraftsView.cleanup();

            // 添加必要的CSS动画
            window.DraftsView.addNotificationStyles();

            // 清理无效草稿
            if (typeof window.draftService.cleanInvalidDrafts === 'function') {
                window.draftService.cleanInvalidDrafts();
            }

            // 绑定事件
            window.DraftsView.bindEvents();

            // 渲染内容
            window.DraftsView.render();

            window.DraftsView.isInitialized = true;
            window.Logger.debug('DraftsView initialized successfully');
        } catch (error) {
            window.Logger.error('Failed to initialize DraftsView:', error);
            window.DraftsView.showError('草稿仓初始化失败：' + error.message);
        }
    },

    /**
     * 添加通知样式
     */
    addNotificationStyles: () => {
        if (document.getElementById('drafts-notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'drafts-notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            /* 批量操作样式 */
            .list-item {
                display: flex;
                align-items: flex-start;
                transition: all 0.2s ease;
            }
            
            .list-item.selected {
                background-color: var(--theme-color-light);
                border-left: 3px solid var(--theme-color);
            }
            
            .item-selection {
                flex: 0 0 auto;
                padding: 12px;
                display: flex;
                align-items: center;
            }
            
            .item-checkbox {
                width: 16px;
                height: 16px;
                cursor: pointer;
            }
            
            .batch-actions-bar {
                display: none;
                align-items: center;
                justify-content: space-between;
                padding: 12px 20px;
                background: var(--info-light);
                border: 1px solid var(--info-color);
                border-radius: var(--border-radius-md);
                margin-bottom: 16px;
            }
        `;
        document.head.appendChild(style);
    },
    showError: (message) => {
        // 使用现代的错误显示方式，而不是 alert
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #DC2626;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);
    }
}; 