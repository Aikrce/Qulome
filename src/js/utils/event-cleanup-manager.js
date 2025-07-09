/**
 * Event Cleanup Manager
 * 管理事件监听器的注册和清理，防止内存泄漏
 */
const EventCleanupManager = {
    _listeners: new Map(),
    _nextId: 1,

    /**
     * 添加事件监听器并跟踪清理
     * @param {Element} element - 目标元素
     * @param {string} event - 事件类型
     * @param {Function} handler - 事件处理函数
     * @param {Object} options - 事件选项
     * @returns {string} 监听器ID，用于后续移除
     */
    addEventListener(element, event, handler, options = {}) {
        const listenerId = `listener_${this._nextId++}`;
        
        // 包装处理函数以便跟踪
        const wrappedHandler = (...args) => {
            try {
                return handler.apply(this, args);
            } catch (error) {
                if (window.Logger) {
                    window.Logger.error(`Event handler error for ${event}`, error);
                }
            }
        };

        // 添加事件监听器
        element.addEventListener(event, wrappedHandler, options);
        
        // 存储监听器信息
        this._listeners.set(listenerId, {
            element,
            event,
            handler: wrappedHandler,
            originalHandler: handler,
            options
        });

        if (window.Logger) {
            window.Logger.debug(`Added event listener: ${event} on ${element.tagName || 'unknown'}`, { listenerId });
        }

        return listenerId;
    },

    /**
     * 移除指定的事件监听器
     * @param {string} listenerId - 监听器ID
     */
    removeEventListener(listenerId) {
        const listenerInfo = this._listeners.get(listenerId);
        if (listenerInfo) {
            const { element, event, handler } = listenerInfo;
            element.removeEventListener(event, handler);
            this._listeners.delete(listenerId);
            
            if (window.Logger) {
                window.Logger.debug(`Removed event listener: ${event}`, { listenerId });
            }
        }
    },

    /**
     * 移除元素的所有事件监听器
     * @param {Element} element - 目标元素
     */
    removeAllListenersForElement(element) {
        const listenersToRemove = [];
        
        for (const [id, listenerInfo] of this._listeners) {
            if (listenerInfo.element === element) {
                listenersToRemove.push(id);
            }
        }
        
        listenersToRemove.forEach(id => this.removeEventListener(id));
        
        if (window.Logger && listenersToRemove.length > 0) {
            window.Logger.debug(`Removed ${listenersToRemove.length} listeners for element`);
        }
    },

    /**
     * 移除指定类型的所有事件监听器
     * @param {string} eventType - 事件类型
     */
    removeAllListenersForEvent(eventType) {
        const listenersToRemove = [];
        
        for (const [id, listenerInfo] of this._listeners) {
            if (listenerInfo.event === eventType) {
                listenersToRemove.push(id);
            }
        }
        
        listenersToRemove.forEach(id => this.removeEventListener(id));
        
        if (window.Logger && listenersToRemove.length > 0) {
            window.Logger.debug(`Removed ${listenersToRemove.length} listeners for event ${eventType}`);
        }
    },

    /**
     * 清理所有事件监听器
     */
    cleanup() {
        const listenerCount = this._listeners.size;
        
        for (const [id, listenerInfo] of this._listeners) {
            const { element, event, handler } = listenerInfo;
            try {
                element.removeEventListener(event, handler);
            } catch (error) {
                if (window.Logger) {
                    window.Logger.warn(`Failed to remove event listener`, error);
                }
            }
        }
        
        this._listeners.clear();
        
        if (window.Logger && listenerCount > 0) {
            window.Logger.info(`Cleaned up ${listenerCount} event listeners`);
        }
    },

    /**
     * 清理已从DOM中移除的元素的事件监听器
     */
    cleanupStaleListeners() {
        const staleListeners = [];
        
        for (const [id, listenerInfo] of this._listeners) {
            if (!document.contains(listenerInfo.element)) {
                staleListeners.push(id);
            }
        }
        
        staleListeners.forEach(id => this.removeEventListener(id));
        
        if (window.Logger && staleListeners.length > 0) {
            window.Logger.debug(`Cleaned up ${staleListeners.length} stale event listeners`);
        }
    },

    /**
     * 获取监听器统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        const stats = {
            total: this._listeners.size,
            byEvent: {},
            byElement: {}
        };

        for (const [id, listenerInfo] of this._listeners) {
            const { event, element } = listenerInfo;
            
            // 按事件类型统计
            stats.byEvent[event] = (stats.byEvent[event] || 0) + 1;
            
            // 按元素标签统计
            const tagName = element.tagName || 'unknown';
            stats.byElement[tagName] = (stats.byElement[tagName] || 0) + 1;
        }

        return stats;
    },

    /**
     * 批量添加事件监听器
     * @param {Array} listeners - 监听器配置数组
     * @returns {Array} 监听器ID数组
     */
    addMultipleListeners(listeners) {
        return listeners.map(({ element, event, handler, options }) => 
            this.addEventListener(element, event, handler, options)
        );
    }
};

// 定期清理过期的监听器
setInterval(() => {
    EventCleanupManager.cleanupStaleListeners();
}, 30000); // 每30秒清理一次

// 页面卸载时清理所有监听器
window.addEventListener('beforeunload', () => {
    EventCleanupManager.cleanup();
});

// 挂载到全局对象
window.EventCleanupManager = EventCleanupManager;