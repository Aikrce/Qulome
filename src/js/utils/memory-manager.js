/**
 * Qulome Memory Manager - 内存管理优化
 * 
 * 功能：
 * - 自动清理未使用的DOM引用
 * - 监控内存使用情况
 * - 防止内存泄漏
 * - 管理事件监听器生命周期
 */

window.MemoryManager = {
    // 使用WeakMap自动垃圾回收
    viewReferences: new WeakMap(),
    eventHandlers: new WeakMap(),
    domReferences: new WeakMap(),
    
    // 活跃的组件计数
    activeComponents: new Set(),
    
    // 内存使用统计
    metrics: {
        peakMemoryUsage: 0,
        currentMemoryUsage: 0,
        cleanupCycles: 0,
        lastCleanupTime: 0
    },
    
    // 配置
    config: {
        maxMemoryUsage: 50 * 1024 * 1024, // 50MB
        cleanupInterval: 30000, // 30秒
        forceCleanupThreshold: 80 * 1024 * 1024, // 80MB强制清理
        maxComponentCount: 100
    },
    
    /**
     * 初始化内存管理器
     */
    init() {
        this.startPeriodicCleanup();
        this.setupMemoryMonitoring();
        this.setupUnloadHandlers();
        
        window.Logger?.debug('Memory Manager initialized');
    },
    
    /**
     * 注册视图组件
     * @param {Object} view - 视图对象
     * @param {Function} cleanup - 清理函数
     */
    registerView(view, cleanup) {
        this.viewReferences.set(view, {
            cleanup,
            createdAt: Date.now(),
            componentType: view.constructor?.name || 'Unknown'
        });
        
        this.activeComponents.add(view);
        
        // 组件数量检查
        if (this.activeComponents.size > this.config.maxComponentCount) {
            window.Logger?.warn(`Too many active components: ${this.activeComponents.size}`);
            this.forceCleanup();
        }
    },
    
    /**
     * 注册事件处理器
     * @param {Element} element - DOM元素
     * @param {string} eventType - 事件类型
     * @param {Function} handler - 事件处理函数
     */
    registerEventHandler(element, eventType, handler) {
        if (!this.eventHandlers.has(element)) {
            this.eventHandlers.set(element, new Map());
        }
        
        const elementHandlers = this.eventHandlers.get(element);
        if (!elementHandlers.has(eventType)) {
            elementHandlers.set(eventType, new Set());
        }
        
        elementHandlers.get(eventType).add(handler);
    },
    
    /**
     * 注册DOM引用
     * @param {Object} component - 组件对象
     * @param {Element} element - DOM元素
     */
    registerDOMReference(component, element) {
        if (!this.domReferences.has(component)) {
            this.domReferences.set(component, new Set());
        }
        
        this.domReferences.get(component).add(element);
    },
    
    /**
     * 清理特定视图
     * @param {Object} view - 视图对象
     */
    cleanupView(view) {
        const viewData = this.viewReferences.get(view);
        if (viewData && viewData.cleanup) {
            try {
                viewData.cleanup();
                window.Logger?.debug(`Cleaned up view: ${viewData.componentType}`);
            } catch (error) {
                window.Logger?.error('Error during view cleanup:', error);
            }
        }
        
        this.viewReferences.delete(view);
        this.activeComponents.delete(view);
    },
    
    /**
     * 清理DOM引用
     * @param {Object} component - 组件对象
     */
    cleanupDOMReferences(component) {
        const elements = this.domReferences.get(component);
        if (elements) {
            elements.forEach(element => {
                // 清理事件监听器
                this.cleanupElementEventHandlers(element);
                
                // 清理DOM引用
                if (element.parentNode) {
                    element.removeEventListener = function() {};
                }
            });
            
            this.domReferences.delete(component);
        }
    },
    
    /**
     * 清理元素的事件处理器
     * @param {Element} element - DOM元素
     */
    cleanupElementEventHandlers(element) {
        const handlers = this.eventHandlers.get(element);
        if (handlers) {
            handlers.forEach((handlerSet, eventType) => {
                handlerSet.forEach(handler => {
                    element.removeEventListener(eventType, handler);
                });
            });
            
            this.eventHandlers.delete(element);
        }
    },
    
    /**
     * 启动定期清理
     */
    startPeriodicCleanup() {
        setInterval(() => {
            this.performCleanup();
        }, this.config.cleanupInterval);
    },
    
    /**
     * 设置内存监控
     */
    setupMemoryMonitoring() {
        if (performance.memory) {
            setInterval(() => {
                const currentUsage = performance.memory.usedJSHeapSize;
                this.metrics.currentMemoryUsage = currentUsage;
                
                if (currentUsage > this.metrics.peakMemoryUsage) {
                    this.metrics.peakMemoryUsage = currentUsage;
                }
                
                // 内存使用过高时强制清理
                if (currentUsage > this.config.forceCleanupThreshold) {
                    window.Logger?.warn(`High memory usage detected: ${Math.round(currentUsage / 1024 / 1024)}MB`);
                    this.forceCleanup();
                }
            }, 5000); // 每5秒检查一次
        }
    },
    
    /**
     * 设置页面卸载处理器
     */
    setupUnloadHandlers() {
        window.addEventListener('beforeunload', () => {
            this.cleanupAll();
        });
        
        // 监听页面隐藏事件
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.performCleanup();
            }
        });
    },
    
    /**
     * 执行常规清理
     */
    performCleanup() {
        const startTime = performance.now();
        
        // 清理已断开的DOM引用
        this.cleanupDisconnectedElements();
        
        // 强制垃圾回收（如果支持）
        if (window.gc) {
            window.gc();
        }
        
        // 更新统计信息
        this.metrics.cleanupCycles++;
        this.metrics.lastCleanupTime = Date.now();
        
        const duration = performance.now() - startTime;
        window.Logger?.debug(`Memory cleanup completed in ${duration.toFixed(2)}ms`);
    },
    
    /**
     * 清理已断开的DOM元素
     */
    cleanupDisconnectedElements() {
        const elementsToClean = new Set();
        
        // 收集已断开的元素
        this.eventHandlers.forEach((handlers, element) => {
            if (!document.contains(element)) {
                elementsToClean.add(element);
            }
        });
        
        // 清理断开的元素
        elementsToClean.forEach(element => {
            this.cleanupElementEventHandlers(element);
        });
        
        if (elementsToClean.size > 0) {
            window.Logger?.debug(`Cleaned up ${elementsToClean.size} disconnected elements`);
        }
    },
    
    /**
     * 强制清理
     */
    forceCleanup() {
        window.Logger?.info('Performing force cleanup...');
        
        // 清理所有活跃组件
        const componentsToClean = [...this.activeComponents];
        componentsToClean.forEach(component => {
            this.cleanupView(component);
        });
        
        // 清理DOM缓存
        if (window.DOMCache) {
            window.DOMCache.clear();
        }
        
        // 执行常规清理
        this.performCleanup();
        
        window.Logger?.info('Force cleanup completed');
    },
    
    /**
     * 清理所有资源
     */
    cleanupAll() {
        window.Logger?.info('Cleaning up all memory resources...');
        
        // 清理所有视图
        this.activeComponents.forEach(component => {
            this.cleanupView(component);
        });
        
        // 清理所有DOM引用
        this.domReferences = new WeakMap();
        this.eventHandlers = new WeakMap();
        this.viewReferences = new WeakMap();
        this.activeComponents.clear();
        
        window.Logger?.info('All memory resources cleaned up');
    },
    
    /**
     * 获取内存统计信息
     * @returns {Object} 内存统计
     */
    getMemoryStats() {
        const stats = {
            ...this.metrics,
            activeComponents: this.activeComponents.size,
            supportedFeatures: {
                performanceMemory: !!performance.memory,
                garbageCollection: !!window.gc,
                memoryInfo: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                } : null
            }
        };
        
        return stats;
    },
    
    /**
     * 设置内存使用限制
     * @param {number} maxMemory - 最大内存使用量（字节）
     */
    setMemoryLimit(maxMemory) {
        this.config.maxMemoryUsage = maxMemory;
        window.Logger?.info(`Memory limit set to ${Math.round(maxMemory / 1024 / 1024)}MB`);
    }
};

// 页面加载完成后初始化内存管理器
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.MemoryManager.init();
    });
} else {
    window.MemoryManager.init();
}