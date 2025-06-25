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
            window.Logger.error('Failed to initialize DraftsView', error);
            window.DraftsView.showError('草稿视图初始化失败，请刷新页面重试');
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

        listContainer.innerHTML = drafts.map(draft => `
            <div class="list-item" data-draft-id="${draft.id}">
                <div class="item-info">
                        <h3 class="item-title" title="${window.DraftsView.escapeHtml(draft.title)}">
                            ${window.DraftsView.escapeHtml(draft.title)}
                        </h3>
                        <p class="item-meta">
                            <span class="update-time">最后更新: ${window.DraftsView.formatDate(draft.updatedAt)}</span>
                            <span class="word-count">${window.DraftsView.getWordCount(draft.content)} 字</span>
                        </p>
                        <div class="item-preview">
                            ${window.DraftsView.getContentPreview(draft.content)}
                        </div>
                </div>
                <div class="item-actions">
                        <button class="btn btn-secondary load-draft-btn" title="载入到编辑器">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            载入
                        </button>
                        <button class="btn btn-primary publish-draft-btn" title="发布到发布仓">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                            发布
                        </button>
                        <button class="btn btn-danger delete-draft-btn" title="删除草稿">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                            </svg>
                        </button>
                </div>
            </div>
        `).join('');

            window.Logger.debug(`Rendered ${drafts.length} drafts`);
        } catch (error) {
            window.Logger.error('Failed to render drafts', error);
            window.DraftsView.showError('渲染草稿列表失败');
        }
    },

    /**
     * 绑定事件处理器
     */
    bindEvents: () => {
        try {
            const listContainer = document.getElementById('drafts-list');
            
            if (!listContainer) {
                throw new Error('草稿列表容器未找到');
            }

            // 使用事件委托绑定所有按钮点击事件
            window.DraftsView.addEventHandler(listContainer, 'click', (event) => {
                window.DraftsView.handleListItemClick(event);
            });

            window.Logger.debug('DraftsView events bound successfully');
        } catch (error) {
            window.Logger.error('Failed to bind events', error);
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
            if (!draftId) return;

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
     * 处理载入草稿
     */
    handleLoadDraft: (draftId) => {
        try {
            const draft = window.draftService.getDraft(draftId);
            if (!draft) {
                throw new Error('草稿未找到');
            }

                window.draftService.setCurrentDraftId(draftId);
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
                    window.publishService.addPublished(draft);
            
            // 从草稿中删除
                    window.draftService.deleteDraft(draftId);
            
            // 如果删除的是当前编辑的草稿，需要处理
            const currentDraftId = window.draftService.getCurrentDraftId();
            if (currentDraftId === draftId) {
                window.draftService.setCurrentDraftId(null);
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
                } else {
                    window.draftService.setCurrentDraftId(null);
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
     * HTML转义，防止XSS
     */
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
     * 显示错误消息
     */
    showError: (message) => {
        alert(message);
    }
}; 