/**
 * Publish View Module
 * 负责发布仓视图的渲染、事件绑定和交互逻辑。
 * - 渲染已发布文章列表
 * - 处理文章的重新编辑和删除
 * - 统一事件绑定管理
 * - 错误处理和用户反馈
 */
window.PublishView = {
    // State management
    isInitialized: false,
    eventHandlers: new Map(),

    /**
     * 初始化发布仓视图：渲染已发布文章列表并绑定事件
     */
    init: () => {
        try {
            if (window.PublishView.isInitialized) {
                window.Logger.debug('PublishView already initialized, refreshing...');
                window.PublishView.render();
                return;
            }

            window.PublishView.render();
            window.PublishView.bindEvents();
            window.PublishView.isInitialized = true;
            window.Logger.debug('PublishView initialized successfully');
        } catch (error) {
            window.Logger.error('Failed to initialize PublishView', error);
            window.PublishView.showError('发布视图初始化失败，请刷新页面重试');
        }
    },

    /**
     * 清理事件处理器和资源
     */
    cleanup: () => {
        window.PublishView.eventHandlers.forEach((handler, element) => {
            if (element && typeof element.removeEventListener === 'function') {
                element.removeEventListener(handler.event, handler.callback);
            }
        });
        window.PublishView.eventHandlers.clear();
        window.PublishView.isInitialized = false;
        window.Logger.debug('PublishView cleaned up');
    },

    /**
     * 添加事件处理器并跟踪以便清理
     */
    addEventHandler: (element, event, callback) => {
        if (!element) return;
        
        // 移除现有处理器（如果存在）
        const existingHandler = window.PublishView.eventHandlers.get(element);
        if (existingHandler && existingHandler.event === event) {
            element.removeEventListener(event, existingHandler.callback);
        }

        // 添加新处理器
        element.addEventListener(event, callback);
        window.PublishView.eventHandlers.set(element, { event, callback });
    },

    /**
     * 渲染已发布文章列表
     */
    render: () => {
        try {
        const publishedArticles = window.publishService.getPublished().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        const listContainer = document.getElementById('publish-list');

        if (!listContainer) {
                throw new Error('发布列表容器 #publish-list 未找到');
            }

            // 更新标题显示文章数量
            const header = document.querySelector('#publish-view .main-view-header h1');
            if (header) {
                header.textContent = `发布仓`;
        }

        if (publishedArticles.length === 0) {
                listContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📚</div>
                        <p>这里还没有已发布的文章。</p>
                        <button class="btn btn-primary" onclick="window.location.hash='#drafts'">查看草稿</button>
                    </div>
                `;
            return;
        }

        listContainer.innerHTML = publishedArticles.map(article => {
            const wordCount = window.PublishView.getWordCount(article.content);
            const paragraphCount = (article.content.match(/<p[\s>]/g)||[]).length;
            const imageCount = (article.content.match(/<img[\s>]/g)||[]).length;
            return `
            <div class="list-item" data-article-id="${article.id}">
              <div class="item-main">
                <div class="item-info">
                  <h3 class="item-title" title="${window.ThemeUtils.escapeHtml(article.title)}">
                    ${window.ThemeUtils.escapeHtml(article.title)}
                  </h3>
                  <div class="item-preview">
                    ${window.PublishView.getContentPreview(article.content)}
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
                  <span class="update-time">最后更新: ${window.PublishView.formatDate(article.updatedAt)}</span>
                  <span class="word-count">${wordCount} 字</span>
                </div>
                <div class="item-actions">
                  <button class="btn btn-secondary preview-btn" title="预览文章">预览</button>
                  <button class="btn btn-primary copy-content-btn" title="复制内容">复制</button>
                  <button class="btn btn-accent re-edit-btn" title="返回草稿仓修改">修改</button>
                </div>
                </div>
            </div>
            `;
        }).join('');

            window.Logger.debug(`Rendered ${publishedArticles.length} published articles`);
        } catch (error) {
            window.Logger.error('Failed to render published articles', error);
            window.PublishView.showError('渲染发布列表失败');
        }
    },

    /**
     * 绑定事件处理器
     */
    bindEvents: () => {
        try {
            const listContainer = document.getElementById('publish-list');
            
            if (!listContainer) {
                throw new Error('发布列表容器未找到');
            }

            // 使用事件委托绑定所有按钮点击事件
            window.PublishView.addEventHandler(listContainer, 'click', (event) => {
                window.PublishView.handleListItemClick(event);
            });

            window.Logger.debug('PublishView events bound successfully');
        } catch (error) {
            window.Logger.error('Failed to bind events', error);
            window.PublishView.showError('事件绑定失败');
        }
    },

    /**
     * 处理列表项点击事件
     */
    handleListItemClick: (event) => {
        try {
            const listItem = event.target.closest('.list-item');
            if (!listItem) return;

            const articleId = listItem.dataset.articleId;
            if (!articleId) return;

            // 预览文章
            if (event.target.closest('.preview-btn')) {
                window.PublishView.handlePreviewArticle(articleId);
            }
            // 复制内容
            else if (event.target.closest('.copy-content-btn')) {
                window.PublishView.handleCopyContent(articleId);
            }
            // 返回草稿仓修改
            else if (event.target.closest('.re-edit-btn')) {
                window.PublishView.handleReEditArticle(articleId);
            }
        } catch (error) {
            window.Logger.error('处理列表项点击失败', error);
            window.PublishView.showError('操作失败，请重试');
        }
    },

    /**
     * 处理预览文章
     */
    handlePreviewArticle: (articleId) => {
        try {
            const article = window.publishService.getPublished().find(a => a.id === articleId);
            if (!article) {
                throw new Error('文章未找到');
            }

            // 创建预览模态框
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content preview-modal">
                    <div class="modal-header">
                        <h3>${window.ThemeUtils.escapeHtml(article.title)}</h3>
                        <button class="modal-close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="preview-content">${article.content}</div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary copy-from-preview" data-article-id="${article.id}">复制内容</button>
                        <button class="btn btn-accent edit-from-preview" data-article-id="${article.id}">返回修改</button>
                        <button class="btn btn-secondary close-preview">关闭</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // 绑定预览模态框事件
            const closeModal = () => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            };

            modal.querySelector('.modal-close-btn').onclick = closeModal;
            modal.querySelector('.close-preview').onclick = closeModal;
            modal.onclick = (e) => {
                if (e.target === modal) closeModal();
            };

            // 复制按钮
            modal.querySelector('.copy-from-preview').onclick = () => {
                window.PublishView.handleCopyContent(articleId);
            };

            // 修改按钮
            modal.querySelector('.edit-from-preview').onclick = () => {
                closeModal();
                window.PublishView.handleReEditArticle(articleId);
            };

            // ESC键关闭
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);

            window.Logger.debug('文章预览已打开:', article.title);
        } catch (error) {
            window.Logger.error('预览文章失败:', error);
            window.PublishView.showError(error.message || '预览失败');
        }
    },

    /**
     * 处理重新编辑文章
     */
    handleReEditArticle: (articleId) => {
        try {
                const article = window.publishService.getPublished().find(a => a.id === articleId);
            if (!article) {
                throw new Error('文章未找到');
            }

            if (!confirm(`确定要重新编辑文章 "${article.title}" 吗？文章将移回草稿仓。`)) {
                return;
            }

            // 移回草稿仓
            window.draftService.saveDraft(article);
            
            // 从发布仓删除
                    window.publishService.deletePublished(articleId);
            
            // 重新渲染
            window.PublishView.render();
            
            // 显示成功消息
            window.PublishView.showSuccess(`文章 "${article.title}" 已移回草稿仓`);
            window.Logger.debug('文章移回草稿成功:', article.title);
        } catch (error) {
            window.Logger.error('重新编辑文章失败:', error);
            window.PublishView.showError(error.message || '重新编辑失败');
        }
    },

    /**
     * 处理复制内容
     */
    handleCopyContent: async (articleId) => {
        try {
            const article = window.publishService.getPublished().find(a => a.id === articleId);
            if (!article) {
                throw new Error('文章未找到');
            }

            // 获取当前激活主题并应用样式
            const activeTheme = window.themeService.getActiveTheme();
            let contentToCopy = article.content;

            if (activeTheme && activeTheme.styles) {
                // 创建临时容器应用样式
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = article.content;

                // 应用主题样式
                tempContainer.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
                    el.style.color = activeTheme.styles['--h1-color'] || activeTheme.styles['--h2-color'] || activeTheme.styles['--h3-color'];
                    el.style.fontSize = activeTheme.styles['--h1-font-size'] || activeTheme.styles['--h2-font-size'] || activeTheme.styles['--h3-font-size'];
                    el.style.fontWeight = activeTheme.styles['--h1-font-weight'] || 'bold';
                });
                
                tempContainer.querySelectorAll('p').forEach(el => {
                    el.style.color = activeTheme.styles['--p-color'];
                    el.style.fontSize = activeTheme.styles['--p-font-size'];
                    el.style.lineHeight = activeTheme.styles['--p-line-height'];
                });
                
                tempContainer.querySelectorAll('a').forEach(el => {
                    el.style.color = activeTheme.styles['--a-color'];
                });

                contentToCopy = tempContainer.innerHTML;
            }

            // 尝试现代剪贴板API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(contentToCopy);
                window.PublishView.showSuccess(`文章 "${article.title}" 的内容已复制！`);
            } else {
                // 降级到旧方法
                window.PublishView.fallbackCopyToClipboard(contentToCopy);
                window.PublishView.showSuccess(`文章 "${article.title}" 的内容已复制！`);
            }
        } catch (error) {
            window.Logger.error('复制内容失败:', error);
            window.PublishView.showError('复制失败，请手动复制');
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
     * 降级复制到剪贴板方法
     */
    fallbackCopyToClipboard: (text) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            throw new Error('复制操作不支持');
        } finally {
            document.body.removeChild(textArea);
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
     * 显示错误消息
     */
    showError: (message) => {
        alert(message);
    }
}; 