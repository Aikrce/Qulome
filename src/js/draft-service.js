const DRAFTS_STORAGE_KEY = 'qulome_drafts';
const CURRENT_DRAFT_ID_KEY = 'qulome_current_draft_id';

function getDrafts() {
    const drafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
    return drafts ? JSON.parse(drafts) : [];
}

function saveDrafts(drafts) {
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
}

function saveDraft(draft) {
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
        title: content.substring(0, 20).replace(/<[^>]+>/g, '') || '无标题草稿',
        content: content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    drafts.push(newDraft);
    saveDrafts(drafts);
    return newDraft;
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
    drafts = drafts.filter(d => d.id !== draftId);
    saveDrafts(drafts);
}

window.draftService = {
    getDrafts,
    saveDraft,
    getDraft,
    setCurrentDraftId,
    getCurrentDraftId,
    createDraft,
    deleteDraft
}; 