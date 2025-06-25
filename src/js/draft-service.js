const DRAFTS_STORAGE_KEY = 'qulome_drafts';
const CURRENT_DRAFT_ID_KEY = 'qulome_current_draft_id';

// 清理无效草稿（无内容或无标题）
function cleanInvalidDrafts() {
    let drafts = getDrafts();
    const validDrafts = drafts.filter(d => d && typeof d.id === 'string' && typeof d.title === 'string' && d.title.trim() && typeof d.content === 'string' && d.content.replace(/<[^>]+>/g, '').trim());
    if (validDrafts.length !== drafts.length) {
        saveDrafts(validDrafts);
        if (window && window.Logger) window.Logger.info('已自动清理无效草稿');
    }
}

function getDrafts() {
    const drafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
    return drafts ? JSON.parse(drafts) : [];
}

function saveDrafts(drafts) {
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
}

// 智能提取标题：优先取第一个 h1/h2/h3，否则取前30字纯文本
function extractTitleFromContent(content) {
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

function saveDraft(draft) {
    // 校验：禁止空内容和无标题
    if (!draft || typeof draft.content !== 'string' || !draft.content.replace(/<[^>]+>/g, '').trim()) {
        if (window && window.Logger) window.Logger.warn('禁止保存无内容草稿', draft);
        return;
    }
    // 统一用 extractTitleFromContent
    draft.title = extractTitleFromContent(draft.content);
    let drafts = getDrafts();
    const existingIndex = drafts.findIndex(d => d.id === draft.id);
    if (existingIndex > -1) {
        drafts[existingIndex] = draft;
    } else {
        drafts.push(draft);
    }
    saveDrafts(drafts);
}

function createDraft(content) {
    // 校验：禁止创建空内容草稿
    const plain = (content || '').replace(/<[^>]+>/g, '').trim();
    if (!plain) {
        if (window && window.Logger) window.Logger.warn('禁止创建无内容草稿');
        return null;
    }
    const drafts = getDrafts();
    const newDraft = {
        id: `draft-${new Date().getTime()}`,
        title: extractTitleFromContent(content),
        content: content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    drafts.push(newDraft);
    saveDrafts(drafts);
    return newDraft;
}

// 页面加载时自动清理
if (typeof window !== 'undefined') {
    cleanInvalidDrafts();
}

function setCurrentDraftId(draftId) {
    localStorage.setItem(CURRENT_DRAFT_ID_KEY, draftId);
}

function getCurrentDraftId() {
    return localStorage.getItem(CURRENT_DRAFT_ID_KEY);
}

function getDraft(draftId) {
    const drafts = getDrafts();
    return drafts.find(d => d.id === draftId);
}

function deleteDraft(draftId) {
    let drafts = getDrafts();
    let before = drafts.length;
    drafts = drafts.filter(d => d.id !== draftId);
    // 兜底：如果没删掉，尝试删除所有 id 异常的草稿
    if (drafts.length === before) {
        drafts = drafts.filter(d => d.id && typeof d.id === 'string');
    }
    saveDrafts(drafts);
}

function cleanOrphanDrafts() {
    let drafts = getDrafts();
    // 只保留有内容的草稿
    const validDrafts = drafts.filter(d => d && typeof d.id === 'string' && typeof d.content === 'string' && d.content.replace(/<[^>]+>/g, '').trim());
    if (validDrafts.length !== drafts.length) {
        saveDrafts(validDrafts);
        if (window && window.Logger) window.Logger.info('已自动清理无内容 orphan 草稿');
    }
    // 检查 currentDraftId 是否还有效
    const currentId = getCurrentDraftId();
    if (currentId && !validDrafts.some(d => d.id === currentId)) {
        if (validDrafts.length > 0) {
            setCurrentDraftId(validDrafts[0].id);
        } else {
            setCurrentDraftId(null);
        }
    }
}

window.draftService = {
    getDrafts,
    saveDraft,
    getDraft,
    setCurrentDraftId,
    getCurrentDraftId,
    createDraft,
    deleteDraft,
    cleanOrphanDrafts
}; 