/**
 * DOM Cache Utility
 * 提供DOM元素缓存功能，减少重复DOM查询，提升性能
 */
const DOMCache = {
    _cache: new Map(),

    /**
     * 获取DOM元素（带缓存）
     * @param {string} selector - CSS选择器
     * @param {Element} context - 查询上下文，默认为document
     * @returns {Element|null} DOM元素
     */
    get(selector, context = document) {
        const cacheKey = `${selector}:${context === document ? 'document' : context.tagName}`;
        
        if (this._cache.has(cacheKey)) {
            const cachedElement = this._cache.get(cacheKey);
            // 检查缓存的元素是否仍在DOM中
            if (cachedElement && document.contains(cachedElement)) {
                return cachedElement;
            } else {
                // 元素已被移除，清理缓存
                this._cache.delete(cacheKey);
            }
        }
        
        const element = context.querySelector(selector);
        if (element) {
            this._cache.set(cacheKey, element);
        }
        
        return element;
    },

    /**
     * 获取所有匹配的DOM元素（带缓存）
     * @param {string} selector - CSS选择器
     * @param {Element} context - 查询上下文，默认为document
     * @returns {NodeList} DOM元素列表
     */
    getAll(selector, context = document) {
        const cacheKey = `${selector}:all:${context === document ? 'document' : context.tagName}`;
        
        if (this._cache.has(cacheKey)) {
            const cachedElements = this._cache.get(cacheKey);
            // 检查缓存的元素是否仍在DOM中
            if (cachedElements && Array.from(cachedElements).every(el => document.contains(el))) {
                return cachedElements;
            } else {
                // 元素已被移除，清理缓存
                this._cache.delete(cacheKey);
            }
        }
        
        const elements = context.querySelectorAll(selector);
        if (elements.length > 0) {
            this._cache.set(cacheKey, elements);
        }
        
        return elements;
    },

    /**
     * 根据ID获取元素（带缓存）
     * @param {string} id - 元素ID
     * @returns {Element|null} DOM元素
     */
    getElementById(id) {
        const cacheKey = `#${id}`;
        
        if (this._cache.has(cacheKey)) {
            const cachedElement = this._cache.get(cacheKey);
            if (cachedElement && document.contains(cachedElement)) {
                return cachedElement;
            } else {
                this._cache.delete(cacheKey);
            }
        }
        
        const element = document.getElementById(id);
        if (element) {
            this._cache.set(cacheKey, element);
        }
        
        return element;
    },

    /**
     * 清理指定缓存
     * @param {string} selector - 要清理的选择器，如果不提供则清理所有缓存
     */
    clear(selector = null) {
        if (selector) {
            // 清理特定选择器的缓存
            for (const [key] of this._cache) {
                if (key.startsWith(selector)) {
                    this._cache.delete(key);
                }
            }
        } else {
            // 清理所有缓存
            this._cache.clear();
        }
    },

    /**
     * 获取缓存统计信息
     * @returns {Object} 缓存统计信息
     */
    getStats() {
        return {
            size: this._cache.size,
            keys: Array.from(this._cache.keys())
        };
    },

    /**
     * 清理已从DOM中移除的元素的缓存
     */
    cleanup() {
        const keysToDelete = [];
        
        for (const [key, element] of this._cache) {
            if (element && !document.contains(element)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this._cache.delete(key));
        
        if (keysToDelete.length > 0 && window.Logger) {
            window.Logger.debug(`Cleaned up ${keysToDelete.length} stale DOM cache entries`);
        }
    }
};

// 定期清理缓存
setInterval(() => {
    DOMCache.cleanup();
}, 60000); // 每分钟清理一次

// 挂载到全局对象
window.DOMCache = DOMCache;