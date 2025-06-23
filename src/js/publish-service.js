const PUBLISHED_STORAGE_KEY = 'qulome_published';

function getPublished() {
    const published = localStorage.getItem(PUBLISHED_STORAGE_KEY);
    return published ? JSON.parse(published) : [];
}

function savePublished(published) {
    localStorage.setItem(PUBLISHED_STORAGE_KEY, JSON.stringify(published));
}

function addPublished(article) {
    const published = getPublished();
    // Ensure no duplicates
    if (published.find(p => p.id === article.id)) {
        return;
    }
    published.push(article);
    savePublished(published);
}

function deletePublished(articleId) {
    let published = getPublished();
    published = published.filter(a => a.id !== articleId);
    savePublished(published);
}

window.publishService = {
    getPublished,
    addPublished,
    deletePublished
}; 