/**
 * Publish View Module
 * 负责发布仓视图的渲染、事件绑定和交互逻辑。
 */
window.PublishView = {
    /**
     * 初始化发布仓视图：渲染已发布文章列表并绑定事件
     */
    init: () => {
        // 渲染已发布文章列表
        const publishedArticles = window.publishService.getPublished().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        const listContainer = document.getElementById('publish-list');
        const header = document.querySelector('.publish-view h1, .publish-view h2');
        if (header) header.textContent = `发布仓 (${publishedArticles.length})`;

        if (!listContainer) {
            window.Logger.error('[PublishView] 发布列表容器 #publish-list 未找到');
            return;
        }

        if (publishedArticles.length === 0) {
            listContainer.innerHTML = `<p>这里还没有已发布的文章。</p>`;
            return;
        }

        listContainer.innerHTML = publishedArticles.map(article => `
             <div class="list-item" data-article-id="${article.id}">
                <div class="item-info">
                    <h3 class="item-title">${article.title}</h3>
                    <p class="item-meta">发布于: ${new Date(article.updatedAt).toLocaleString()}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary re-edit-btn">重新编辑</button>
                    <button class="btn-danger delete-published-btn">删除</button>
                </div>
            </div>
        `).join('');

        // 解绑旧事件，防止重复
        listContainer.querySelectorAll('.re-edit-btn').forEach(btn => btn.onclick = null);
        listContainer.querySelectorAll('.delete-published-btn').forEach(btn => btn.onclick = null);

        // 绑定事件
        listContainer.querySelectorAll('.re-edit-btn').forEach(button => {
            button.onclick = (e) => {
                const articleId = e.target.closest('.list-item').dataset.articleId;
                const article = window.publishService.getPublished().find(a => a.id === articleId);
                if (article) {
                    window.draftService.saveDraft(article); // Move back to drafts
                    window.publishService.deletePublished(articleId);
                    window.PublishView.init();
                }
            };
        });
        listContainer.querySelectorAll('.delete-published-btn').forEach(button => {
            button.onclick = (e) => {
                const articleId = e.target.closest('.list-item').dataset.articleId;
                if (confirm('确定要删除这篇已发布的文章吗？')) {
                    window.publishService.deletePublished(articleId);
                    window.PublishView.init();
                }
            };
        });
    }
}; 