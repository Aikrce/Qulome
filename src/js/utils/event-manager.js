/**
 * Event Manager - 事件管理器
 * 
 * 提供统一的事件管理，防止内存泄漏，支持事件命名空间
 */

window.EventManager = {
    // 事件处理器注册表
    handlers: new Map(),
    
    // 事件命名空间计数器
    namespaceCounter: 0,

    /**
     * 生成唯一的事件ID
     */
    generateEventId(element, event, namespace = '') {
        const elementId = element.id || element.tagName || 'anonymous';
        const namespaceStr = namespace ? `::${namespace}` : '';
        return `${elementId}-${event}${namespaceStr}`;
    },

    /**
     * 添加事件监听器
     * @param {Element} element - DOM元素
     * @param {string} event - 事件类型
     * @param {Function} callback - 回调函数
     * @param {Object} options - 选项
     * @param {string} options.namespace - 事件命名空间
     * @param {boolean} options.once - 是否只执行一次
     * @param {string} options.description - 事件描述
     * @returns {string} 事件ID，用于后续移除
     */
    on(element, event, callback, options = {}) {
        if (!element || typeof callback !== 'function') {
            window.Logger.warn('Invalid element or callback for event listener');
            return null;
        }

        const { namespace = '', once = false, description = '' } = options;
        const eventId = this.generateEventId(element, event, namespace);

        // 如果是once事件，包装回调函数
        let wrappedCallback = callback;
        if (once) {
            wrappedCallback = (e) => {
                callback(e);
                this.off(eventId);
            };
        }

        // 移除现有的同ID事件（如果存在）
        this.off(eventId);

        // 添加事件监听器
        element.addEventListener(event, wrappedCallback);

        // 注册到管理器
        this.handlers.set(eventId, {
            element,
            event,
            callback: wrappedCallback,
            originalCallback: callback,
            namespace,
            description,
            timestamp: Date.now()
        });

        window.Logger.debug(`Event added: ${eventId} - ${description}`);
        return eventId;
    },

    /**
     * 移除事件监听器
     * @param {string} eventId - 事件ID
     */
    off(eventId) {
        const handler = this.handlers.get(eventId);
        if (handler) {
            handler.element.removeEventListener(handler.event, handler.callback);
            this.handlers.delete(eventId);
            window.Logger.debug(`Event removed: ${eventId}`);
            return true;
        }
        return false;
    },

    /**
     * 移除指定命名空间的所有事件
     * @param {string} namespace - 命名空间
     */
    offNamespace(namespace) {
        let removed = 0;
        for (const [eventId, handler] of this.handlers) {
            if (handler.namespace === namespace) {
                this.off(eventId);
                removed++;
            }
        }
        window.Logger.debug(`Removed ${removed} events from namespace: ${namespace}`);
        return removed;
    },

    /**
     * 移除指定元素的所有事件
     * @param {Element} element - DOM元素
     */
    offElement(element) {
        let removed = 0;
        for (const [eventId, handler] of this.handlers) {
            if (handler.element === element) {
                this.off(eventId);
                removed++;
            }
        }
        window.Logger.debug(`Removed ${removed} events from element`);
        return removed;
    },

    /**
     * 清理所有事件监听器
     */
    cleanup() {
        const count = this.handlers.size;
        for (const [eventId] of this.handlers) {
            this.off(eventId);
        }
        window.Logger.debug(`Cleaned up ${count} event handlers`);
    },

    /**
     * 获取事件统计信息
     */
    getStats() {
        const stats = {
            total: this.handlers.size,
            byEvent: {},
            byNamespace: {},
            oldEvents: 0
        };

        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5分钟

        for (const [eventId, handler] of this.handlers) {
            // 按事件类型统计
            stats.byEvent[handler.event] = (stats.byEvent[handler.event] || 0) + 1;
            
            // 按命名空间统计
            const ns = handler.namespace || 'global';
            stats.byNamespace[ns] = (stats.byNamespace[ns] || 0) + 1;
            
            // 统计旧事件
            if (now - handler.timestamp > maxAge) {
                stats.oldEvents++;
            }
        }

        return stats;
    },

    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * 节流函数
     * @param {Function} func - 要节流的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {Function} 节流后的函数
     */
    throttle(func, delay) {
        let last = 0;
        return function(...args) {
            const now = Date.now();
            if (now - last >= delay) {
                last = now;
                return func.apply(this, args);
            }
        };
    },

    /**
     * 委托事件处理
     * @param {Element} container - 容器元素
     * @param {string} selector - 选择器
     * @param {string} event - 事件类型
     * @param {Function} callback - 回调函数
     * @param {Object} options - 选项
     */
    delegate(container, selector, event, callback, options = {}) {
        const delegateCallback = (e) => {
            const target = e.target.closest(selector);
            if (target) {
                callback.call(target, e);
            }
        };

        return this.on(container, event, delegateCallback, options);
    },

    /**
     * 初始化事件管理器
     */
    init() {
        // 定期清理统计信息
        setInterval(() => {
            const stats = this.getStats();
            if (stats.total > 100) {
                window.Logger.warn(`High number of event listeners: ${stats.total}`, stats);
            }
            if (stats.oldEvents > 10) {
                window.Logger.warn(`Found ${stats.oldEvents} old event listeners`);
            }
        }, 60000); // 每分钟检查一次

        window.Logger.debug('EventManager initialized');
    }
};