/**
 * Performance Monitor - 性能监控和防卡死工具
 * 用于监控应用程序性能，防止浏览器卡死
 */

window.PerformanceMonitor = {
    // 性能指标
    metrics: {
        startTime: Date.now(),
        memoryUsage: 0,
        eventListenerCount: 0,
        consecutiveErrors: 0,
        lastHealthCheck: Date.now()
    },

    // 配置
    config: window.QulomeConfig?.performance || {
        healthCheckInterval: 30000,
        maxEventListeners: 100,
        preventHang: {
            maxExecutionTime: 1000,
            maxMemoryUsage: 50 * 1024 * 1024,
            enableThrottling: true,
            throttleDelay: 100
        }
    },

    /**
     * 初始化性能监控
     */
    init: () => {
        try {
            window.PerformanceMonitor.startHealthCheck();
            window.PerformanceMonitor.startMemoryMonitoring();
            window.PerformanceMonitor.setupErrorTracking();
            window.Logger.debug('Performance monitor initialized');
        } catch (error) {
            window.Logger.error('Failed to initialize performance monitor', error);
        }
    },

    /**
     * 开始健康检查
     */
    startHealthCheck: () => {
        const healthCheck = () => {
            try {
                window.PerformanceMonitor.checkMemoryUsage();
                window.PerformanceMonitor.checkEventListeners();
                window.PerformanceMonitor.checkExecutionTime();
                window.PerformanceMonitor.metrics.lastHealthCheck = Date.now();
            } catch (error) {
                window.Logger.error('Health check failed', error);
            }
        };

        // 定期执行健康检查
        setInterval(healthCheck, window.PerformanceMonitor.config.healthCheckInterval);
    },

    /**
     * 检查内存使用情况
     */
    checkMemoryUsage: () => {
        if (performance.memory) {
            const memoryInfo = performance.memory;
            const usedMemory = memoryInfo.usedJSHeapSize;
            
            window.PerformanceMonitor.metrics.memoryUsage = usedMemory;
            
            if (usedMemory > window.PerformanceMonitor.config.preventHang.maxMemoryUsage) {
                window.Logger.warn('Memory usage exceeded limit, triggering cleanup');
                window.PerformanceMonitor.triggerCleanup();
            }
        }
    },

    /**
     * 检查事件监听器数量
     */
    checkEventListeners: () => {
        // 估算事件监听器数量（通过检查已知的事件处理器）
        let count = 0;
        
        // 检查各个视图的事件处理器
        const views = ['EditorView', 'IconsView', 'ThemesView', 'ThemeEditorView', 'DraftsView', 'PublishView'];
        views.forEach(viewName => {
            const view = window[viewName];
            if (view && view.eventHandlers) {
                count += view.eventHandlers.size;
            }
        });

        window.PerformanceMonitor.metrics.eventListenerCount = count;
        
        if (count > window.PerformanceMonitor.config.maxEventListeners) {
            window.Logger.warn('Too many event listeners, triggering cleanup');
            window.PerformanceMonitor.triggerCleanup();
        }
    },

    /**
     * 检查执行时间
     */
    checkExecutionTime: () => {
        const now = Date.now();
        const timeSinceLastCheck = now - window.PerformanceMonitor.metrics.lastHealthCheck;
        
        if (timeSinceLastCheck > window.PerformanceMonitor.config.preventHang.maxExecutionTime) {
            window.Logger.warn('Execution time exceeded limit');
        }
    },

    /**
     * 触发清理操作
     */
    triggerCleanup: () => {
        try {
            // 清理各个视图的事件处理器
            const views = ['EditorView', 'IconsView', 'ThemesView', 'ThemeEditorView', 'DraftsView', 'PublishView'];
            views.forEach(viewName => {
                const view = window[viewName];
                if (view && typeof view.cleanup === 'function') {
                    view.cleanup();
                }
            });

            // 强制垃圾回收（如果可用）
            if (window.gc) {
                window.gc();
            }

            window.Logger.info('Cleanup completed');
        } catch (error) {
            window.Logger.error('Cleanup failed', error);
        }
    },

    /**
     * 开始内存监控
     */
    startMemoryMonitoring: () => {
        if (performance.memory) {
            setInterval(() => {
                const memoryInfo = performance.memory;
                window.Logger.debug('Memory usage', {
                    used: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
                    total: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
                    limit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
                });
            }, 60000); // 每分钟记录一次
        }
    },

    /**
     * 设置错误跟踪
     */
    setupErrorTracking: () => {
        const originalError = window.console.error;
        window.console.error = (...args) => {
            window.PerformanceMonitor.metrics.consecutiveErrors++;
            originalError.apply(window.console, args);
            
            // 如果连续错误过多，触发清理
            if (window.PerformanceMonitor.metrics.consecutiveErrors > 5) {
                window.Logger.warn('Too many consecutive errors, triggering cleanup');
                window.PerformanceMonitor.triggerCleanup();
                window.PerformanceMonitor.metrics.consecutiveErrors = 0;
            }
        };
    },

    /**
     * 节流函数 - 防止频繁执行
     */
    throttle: (func, delay) => {
        let timeout;
        let lastExec = 0;
        
        return function(...args) {
            const now = Date.now();
            
            if (now - lastExec > delay) {
                func.apply(this, args);
                lastExec = now;
            } else {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    func.apply(this, args);
                    lastExec = Date.now();
                }, delay);
            }
        };
    },

    /**
     * 防抖函数 - 延迟执行
     */
    debounce: (func, delay) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * 获取性能报告
     */
    getReport: () => {
        return {
            uptime: Date.now() - window.PerformanceMonitor.metrics.startTime,
            memoryUsage: window.PerformanceMonitor.metrics.memoryUsage,
            eventListenerCount: window.PerformanceMonitor.metrics.eventListenerCount,
            consecutiveErrors: window.PerformanceMonitor.metrics.consecutiveErrors,
            lastHealthCheck: window.PerformanceMonitor.metrics.lastHealthCheck
        };
    },

    /**
     * 重置性能指标
     */
    reset: () => {
        window.PerformanceMonitor.metrics = {
            startTime: Date.now(),
            memoryUsage: 0,
            eventListenerCount: 0,
            consecutiveErrors: 0,
            lastHealthCheck: Date.now()
        };
    }
};

// 自动初始化性能监控
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.PerformanceMonitor.init();
    });
} else {
    window.PerformanceMonitor.init();
} 