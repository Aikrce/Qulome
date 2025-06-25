/**
 * Drafts View Module
 * 负责草稿仓视图的渲染、事件绑定和交互逻辑。
 */
window.DraftsView = {
    /**
     * 初始化草稿仓视图：渲染草稿列表并绑定事件
     */
    init: () => {
        // 渲染草稿列表
        const drafts = window.draftService.getDrafts().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        const listContainer = document.getElementById('drafts-list');
        const header = document.querySelector('.drafts-view h1, .drafts-view h2');
        if (header) header.textContent = `草稿仓 (${drafts.length})`;

        if (!listContainer) {
            window.Logger.error('[DraftsView] 草稿列表容器 #drafts-list 未找到');
            return;
        }

        if (drafts.length === 0) {
            listContainer.innerHTML = `<p>空空如也，快去创作吧！</p>`;
            return;
        }

        listContainer.innerHTML = drafts.map(draft => `
            <div class="list-item" data-draft-id="${draft.id}">
                <div class="item-info">
                    <h3 class="item-title">${draft.title}</h3>
                    <p class="item-meta">最后更新于: ${new Date(draft.updatedAt).toLocaleString()}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary load-draft-btn">载入</button>
                    <button class="btn-primary publish-draft-btn">发布</button>
                    <button class="btn-danger delete-draft-btn">删除</button>
                </div>
            </div>
        `).join('');

        // 解绑旧事件，防止重复
        listContainer.querySelectorAll('.load-draft-btn').forEach(btn => btn.onclick = null);
        listContainer.querySelectorAll('.publish-draft-btn').forEach(btn => btn.onclick = null);
        listContainer.querySelectorAll('.delete-draft-btn').forEach(btn => btn.onclick = null);

        // 绑定事件
        listContainer.querySelectorAll('.load-draft-btn').forEach(button => {
            button.onclick = (e) => {
                const draftId = e.target.closest('.list-item').dataset.draftId;
                window.draftService.setCurrentDraftId(draftId);
                window.location.hash = '#editor';
            };
        });
        listContainer.querySelectorAll('.publish-draft-btn').forEach(button => {
            button.onclick = (e) => {
                const draftId = e.target.closest('.list-item').dataset.draftId;
                const draft = window.draftService.getDraft(draftId);
                if (draft) {
                    window.publishService.addPublished(draft);
                    window.draftService.deleteDraft(draftId);
                    window.DraftsView.init(); // 刷新列表
                }
            };
        });
        listContainer.querySelectorAll('.delete-draft-btn').forEach(button => {
            button.onclick = (e) => {
                const draftId = e.target.closest('.list-item').dataset.draftId;
                if (confirm('确定要删除这篇草稿吗？此操作不可撤销。')) {
                    window.draftService.deleteDraft(draftId);
                    window.DraftsView.init(); // 刷新列表
                }
            };
        });
    }
}; 