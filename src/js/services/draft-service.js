const DRAFTS_STORAGE_KEY = 'qulome_drafts';
const CURRENT_DRAFT_ID_KEY = 'qulome_current_draft_id';

// 清理无效草稿（无内容或无标题）
function cleanInvalidDrafts() {
    let drafts = getDrafts();
    const initialDraftCount = drafts.length;
    const validDrafts = drafts.filter(d => d && typeof d.id === 'string' && typeof d.title === 'string' && d.title.trim() && (d.content.replace(/<[^>]+>/g, '').trim() || d.content === '<p><br></p>') && typeof d.content === 'string');
    if (validDrafts.length !== initialDraftCount) {
        saveDrafts(validDrafts);
        if (window && window.Logger) window.Logger.info(`cleanInvalidDrafts: Removed ${initialDraftCount - validDrafts.length} invalid drafts.`);
    } else {
        if (window && window.Logger) window.Logger.debug('cleanInvalidDrafts: No invalid drafts found.');
    }
}

function getDrafts() {
    const drafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
    const parsedDrafts = drafts ? JSON.parse(drafts) : [];
    if (window.Logger) window.Logger.debug('getDrafts called, returning:', parsedDrafts);
    return parsedDrafts;
}

function saveDrafts(drafts) {
    if (window.Logger) window.Logger.debug('saveDrafts called, saving:', drafts);
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
    if (window.Logger) window.Logger.debug('createDraft called, new draft:', newDraft);
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
    let initialDraftCount = drafts.length;
    drafts = drafts.filter(d => d.id !== draftId);
    // 兜底：如果没删掉，尝试删除所有 id 异常的草稿
    if (drafts.length === initialDraftCount) {
        drafts = drafts.filter(d => d.id && typeof d.id === 'string');
        if (window && window.Logger) window.Logger.warn('deleteDraft: Could not delete by ID, attempting to clean invalid IDs.');
    }
    saveDrafts(drafts);
    if (window.Logger) window.Logger.debug(`deleteDraft called for ${draftId}, remaining drafts:`, drafts.length);
}

function cleanOrphanDrafts() {
    let drafts = getDrafts();
    const initialDraftCount = drafts.length;
    // 只保留有内容的草稿
    const validDrafts = drafts.filter(d => d && typeof d.id === 'string' && (d.content.replace(/<[^>]+>/g, '').trim() || d.content === '<p><br></p>') && typeof d.content === 'string');
    if (validDrafts.length !== initialDraftCount) {
        saveDrafts(validDrafts);
        if (window && window.Logger) window.Logger.info(`cleanOrphanDrafts: Removed ${initialDraftCount - validDrafts.length} orphan drafts.`);
    } else {
        if (window && window.Logger) window.Logger.debug('cleanOrphanDrafts: No orphan drafts found.');
    }
    // 检查 currentDraftId 是否还有效
    const currentId = getCurrentDraftId();
    if (currentId && !validDrafts.some(d => d.id === currentId)) {
        if (validDrafts.length > 0) {
            setCurrentDraftId(validDrafts[0].id);
            if (window.Logger) window.Logger.info(`cleanOrphanDrafts: Reset currentDraftId to first valid draft.`);
        } else {
            setCurrentDraftId(null);
            if (window && window.Logger) window.Logger.info(`cleanOrphanDrafts: Cleared currentDraftId.`);
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