/**
 * Qulome Error Tracker - 错误追踪和监控系统
 * 
 * 功能：
 * - 统一错误收集和记录
 * - 错误分类和严重程度判断
 * - 性能监控和异常检测
 * - 用户友好的错误提示
 * - 错误上报和分析
 */

window.ErrorTracker = {
    // 错误存储
    errors: [],
    warnings: [],
    
    // 配置
    config: {
        maxErrors: 100,
        maxWarnings: 200,
        enableUserNotification: true,
        enableConsoleLogging: true,
        enablePerformanceTracking: true,
        userFriendlyMessages: true
    },
    
    // 错误类型
    ErrorTypes: {
        JAVASCRIPT: 'javascript',
        NETWORK: 'network',
        PERFORMANCE: 'performance',
        MEMORY: 'memory',
        SECURITY: 'security',
        USER_ACTION: 'user_action',
        SYSTEM: 'system'
    },
    
    // 严重程度
    Severity: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    },
    
    // 统计信息
    stats: {
        totalErrors: 0,
        totalWarnings: 0,
        byType: {},
        bySeverity: {},
        sessionErrors: 0,
        lastErrorTime: null,
        consecutiveErrors: 0
    },
    
    // 性能基准
    performanceBaseline: {
        memoryUsage: 0,
        loadTime: 0,
        renderTime: 0
    },
    
    /**
     * 初始化错误追踪器
     */
    init() {
        this.setupGlobalErrorHandlers();
        this.setupPerformanceMonitoring();
        this.setupMemoryMonitoring();
        this.initializeStats();
        
        window.Logger?.debug('Error Tracker initialized');
    },
    
    /**
     * 设置全局错误处理器
     */
    setupGlobalErrorHandlers() {
        // JavaScript错误
        window.addEventListener('error', (event) => {
            this.track(event.error || new Error(event.message), {
                type: this.ErrorTypes.JAVASCRIPT,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                source: 'window.onerror'
            });
        });
        
        // Promise rejected错误
        window.addEventListener('unhandledrejection', (event) => {
            this.track(event.reason, {
                type: this.ErrorTypes.JAVASCRIPT,
                source: 'unhandledrejection',
                promise: true
            });
        });
        
        // 资源加载错误
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.track(new Error(`Resource loading failed: ${event.target.src || event.target.href}`), {
                    type: this.ErrorTypes.NETWORK,
                    element: event.target.tagName,
                    source: event.target.src || event.target.href
                });
            }
        }, true);
    },
    
    /**
     * 设置性能监控
     */
    setupPerformanceMonitoring() {
        if (!this.config.enablePerformanceTracking) return;
        
        // 监控长任务
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (entry.duration > 50) { // 长于50ms的任务
                            this.trackPerformanceIssue('Long Task', {
                                duration: entry.duration,
                                startTime: entry.startTime,
                                name: entry.name
                            });
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                // PerformanceObserver不支持longtask
            }
        }
        
        // 监控页面加载性能
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.checkLoadPerformance();
            }, 1000);
        });
    },
    
    /**
     * 设置内存监控
     */
    setupMemoryMonitoring() {
        if (!performance.memory) return;
        
        setInterval(() => {
            const memoryUsage = performance.memory.usedJSHeapSize;
            const memoryLimit = performance.memory.jsHeapSizeLimit;
            
            if (memoryUsage > memoryLimit * 0.8) {
                this.trackMemoryIssue('High Memory Usage', {
                    usage: memoryUsage,
                    limit: memoryLimit,
                    percentage: (memoryUsage / memoryLimit * 100).toFixed(2)
                });
            }
        }, 30000); // 每30秒检查一次
    },
    
    /**
     * 初始化统计信息
     */
    initializeStats() {
        Object.values(this.ErrorTypes).forEach(type => {
            this.stats.byType[type] = 0;
        });
        
        Object.values(this.Severity).forEach(severity => {
            this.stats.bySeverity[severity] = 0;
        });
    },
    
    /**
     * 追踪错误
     * @param {Error} error - 错误对象
     * @param {Object} context - 错误上下文
     * @param {string} severity - 严重程度
     */
    track(error, context = {}, severity = this.Severity.MEDIUM) {
        const errorEntry = {
            id: this.generateErrorId(),
            timestamp: Date.now(),
            message: error.message || 'Unknown error',
            stack: error.stack,
            context,
            severity,
            type: context.type || this.ErrorTypes.JAVASCRIPT,
            url: window.location.href,
            userAgent: navigator.userAgent,
            sessionId: this.getSessionId(),
            userId: this.getUserId(),
            buildVersion: window.QulomeConfig?.app?.version || 'unknown'
        };
        
        // 存储错误
        this.errors.push(errorEntry);
        
        // 限制错误数量
        if (this.errors.length > this.config.maxErrors) {
            this.errors.shift();
        }
        
        // 更新统计
        this.updateStats(errorEntry);
        
        // 处理错误
        this.processError(errorEntry);
        
        // 控制台日志
        if (this.config.enableConsoleLogging) {
            this.logToConsole(errorEntry);
        }
        
        // 用户通知
        if (this.config.enableUserNotification && this.shouldNotifyUser(errorEntry)) {
            this.notifyUser(errorEntry);
        }
        
        // 检查错误模式
        this.checkErrorPatterns(errorEntry);
    },
    
    /**
     * 追踪警告
     * @param {string} message - 警告消息
     * @param {Object} context - 警告上下文
     */
    warn(message, context = {}) {
        const warningEntry = {
            id: this.generateErrorId(),
            timestamp: Date.now(),
            message,
            context,
            type: context.type || this.ErrorTypes.SYSTEM,
            url: window.location.href
        };
        
        this.warnings.push(warningEntry);
        
        if (this.warnings.length > this.config.maxWarnings) {
            this.warnings.shift();
        }
        
        this.stats.totalWarnings++;
        
        if (this.config.enableConsoleLogging) {
            console.warn(`[Qulome Warning] ${message}`, context);
        }
    },
    
    /**
     * 追踪性能问题
     * @param {string} issue - 性能问题描述
     * @param {Object} data - 性能数据
     */
    trackPerformanceIssue(issue, data) {
        this.track(new Error(`Performance Issue: ${issue}`), {
            type: this.ErrorTypes.PERFORMANCE,
            performanceData: data,
            source: 'performance_monitor'
        }, this.Severity.LOW);
    },
    
    /**
     * 追踪内存问题
     * @param {string} issue - 内存问题描述
     * @param {Object} data - 内存数据
     */
    trackMemoryIssue(issue, data) {
        this.track(new Error(`Memory Issue: ${issue}`), {
            type: this.ErrorTypes.MEMORY,
            memoryData: data,
            source: 'memory_monitor'
        }, this.Severity.MEDIUM);
    },
    
    /**
     * 追踪用户操作错误
     * @param {string} action - 用户操作
     * @param {Error} error - 错误对象
     * @param {Object} context - 上下文
     */
    trackUserAction(action, error, context = {}) {
        this.track(error, {
            type: this.ErrorTypes.USER_ACTION,
            userAction: action,
            ...context
        }, this.Severity.MEDIUM);
    },
    
    /**
     * 检查加载性能
     */
    checkLoadPerformance() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            const loadTime = navigation.loadEventEnd - navigation.fetchStart;
            
            if (loadTime > 5000) { // 5秒
                this.trackPerformanceIssue('Slow Page Load', {
                    loadTime,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                    firstPaint: this.getFirstPaintTime()
                });
            }
        }
    },
    
    /**
     * 获取首次绘制时间
     */
    getFirstPaintTime() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : 0;
    },
    
    /**
     * 更新统计信息
     * @param {Object} errorEntry - 错误条目
     */
    updateStats(errorEntry) {
        this.stats.totalErrors++;
        this.stats.sessionErrors++;
        this.stats.byType[errorEntry.type] = (this.stats.byType[errorEntry.type] || 0) + 1;
        this.stats.bySeverity[errorEntry.severity] = (this.stats.bySeverity[errorEntry.severity] || 0) + 1;
        this.stats.lastErrorTime = errorEntry.timestamp;
        
        // 连续错误计数
        const now = Date.now();
        if (this.stats.lastErrorTime && now - this.stats.lastErrorTime < 5000) {
            this.stats.consecutiveErrors++;
        } else {
            this.stats.consecutiveErrors = 1;
        }
    },
    
    /**
     * 处理错误
     * @param {Object} errorEntry - 错误条目
     */
    processError(errorEntry) {
        // 关键错误处理
        if (errorEntry.severity === this.Severity.CRITICAL) {
            this.handleCriticalError(errorEntry);
        }
        
        // 安全错误处理
        if (errorEntry.type === this.ErrorTypes.SECURITY) {
            this.handleSecurityError(errorEntry);
        }
        
        // 网络错误处理
        if (errorEntry.type === this.ErrorTypes.NETWORK) {
            this.handleNetworkError(errorEntry);
        }
    },
    
    /**
     * 处理关键错误
     * @param {Object} errorEntry - 错误条目
     */
    handleCriticalError(errorEntry) {
        // 尝试恢复
        if (window.MemoryManager) {
            window.MemoryManager.forceCleanup();
        }
        
        // 清理可能的问题状态
        try {
            localStorage.removeItem('qulome_temp_data');
        } catch (e) {
            // 忽略存储错误
        }
    },
    
    /**
     * 处理安全错误
     * @param {Object} errorEntry - 错误条目
     */
    handleSecurityError(errorEntry) {
        // 记录安全事件
        console.error('Security Error Detected:', errorEntry);
        
        // 可能需要清理敏感数据
        if (errorEntry.context.clearSensitiveData) {
            this.clearSensitiveData();
        }
    },
    
    /**
     * 处理网络错误
     * @param {Object} errorEntry - 错误条目
     */
    handleNetworkError(errorEntry) {
        // 检查网络状态
        if (!navigator.onLine) {
            this.notifyUser({
                message: '网络连接已断开，请检查网络设置',
                type: 'network',
                severity: this.Severity.HIGH
            });
        }
    },
    
    /**
     * 检查错误模式
     * @param {Object} errorEntry - 错误条目
     */
    checkErrorPatterns(errorEntry) {
        // 检查连续错误
        if (this.stats.consecutiveErrors > 5) {
            this.handleConsecutiveErrors();
        }
        
        // 检查同类型错误频率
        const recentErrors = this.errors.filter(e => 
            e.type === errorEntry.type && 
            Date.now() - e.timestamp < 60000 // 最近1分钟
        );
        
        if (recentErrors.length > 10) {
            this.handleFrequentErrors(errorEntry.type);
        }
    },
    
    /**
     * 处理连续错误
     */
    handleConsecutiveErrors() {
        this.warn('Consecutive errors detected, performing system cleanup');
        
        if (window.MemoryManager) {
            window.MemoryManager.forceCleanup();
        }
        
        // 重置计数
        this.stats.consecutiveErrors = 0;
    },
    
    /**
     * 处理频繁错误
     * @param {string} errorType - 错误类型
     */
    handleFrequentErrors(errorType) {
        this.warn(`Frequent ${errorType} errors detected`, { 
            errorType,
            frequency: 'high'
        });
        
        // 根据错误类型采取不同措施
        switch (errorType) {
            case this.ErrorTypes.MEMORY:
                if (window.MemoryManager) {
                    window.MemoryManager.forceCleanup();
                }
                break;
            case this.ErrorTypes.JAVASCRIPT:
                // 可能需要重新加载页面
                break;
        }
    },
    
    /**
     * 是否应该通知用户
     * @param {Object} errorEntry - 错误条目
     */
    shouldNotifyUser(errorEntry) {
        // 不通知低级别错误
        if (errorEntry.severity === this.Severity.LOW) {
            return false;
        }
        
        // 不通知性能问题
        if (errorEntry.type === this.ErrorTypes.PERFORMANCE) {
            return false;
        }
        
        // 不通知系统错误
        if (errorEntry.type === this.ErrorTypes.SYSTEM) {
            return false;
        }
        
        return true;
    },
    
    /**
     * 通知用户
     * @param {Object} errorEntry - 错误条目
     */
    notifyUser(errorEntry) {
        const userMessage = this.getUserFriendlyMessage(errorEntry);
        
        if (window.Notification && userMessage) {
            window.Notification.showNotification(userMessage, {
                type: 'error',
                duration: 5000
            });
        }
    },
    
    /**
     * 获取用户友好的错误消息
     * @param {Object} errorEntry - 错误条目
     */
    getUserFriendlyMessage(errorEntry) {
        const messageMap = {
            [this.ErrorTypes.NETWORK]: '网络连接出现问题，请检查网络设置',
            [this.ErrorTypes.MEMORY]: '内存使用过高，系统正在自动优化',
            [this.ErrorTypes.SECURITY]: '检测到安全问题，请刷新页面',
            [this.ErrorTypes.USER_ACTION]: '操作执行失败，请重试'
        };
        
        return messageMap[errorEntry.type] || '系统出现异常，请稍后重试';
    },
    
    /**
     * 控制台日志
     * @param {Object} errorEntry - 错误条目
     */
    logToConsole(errorEntry) {
        const logLevel = this.getLogLevel(errorEntry.severity);
        const message = `[Qulome Error] ${errorEntry.message}`;
        
        console[logLevel](message, {
            type: errorEntry.type,
            severity: errorEntry.severity,
            context: errorEntry.context,
            stack: errorEntry.stack
        });
    },
    
    /**
     * 获取日志级别
     * @param {string} severity - 严重程度
     */
    getLogLevel(severity) {
        const levelMap = {
            [this.Severity.LOW]: 'info',
            [this.Severity.MEDIUM]: 'warn',
            [this.Severity.HIGH]: 'error',
            [this.Severity.CRITICAL]: 'error'
        };
        
        return levelMap[severity] || 'error';
    },
    
    /**
     * 生成错误ID
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    /**
     * 获取会话ID
     */
    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return this.sessionId;
    },
    
    /**
     * 获取用户ID
     */
    getUserId() {
        // 从localStorage或其他地方获取用户ID
        return localStorage.getItem('qulome_user_id') || 'anonymous';
    },
    
    /**
     * 清理敏感数据
     */
    clearSensitiveData() {
        // 清理可能的敏感数据
        const sensitiveKeys = [
            'qulome_user_token',
            'qulome_session_data',
            'qulome_temp_data'
        ];
        
        sensitiveKeys.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                // 忽略存储错误
            }
        });
    },
    
    /**
     * 获取错误报告
     */
    getErrorReport() {
        return {
            errors: this.errors.slice(-50), // 最近50个错误
            warnings: this.warnings.slice(-100), // 最近100个警告
            stats: this.stats,
            sessionInfo: {
                sessionId: this.getSessionId(),
                startTime: this.sessionStartTime,
                duration: Date.now() - (this.sessionStartTime || Date.now()),
                userAgent: navigator.userAgent,
                url: window.location.href,
                buildVersion: window.QulomeConfig?.app?.version || 'unknown'
            },
            systemInfo: {
                memory: performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                } : null,
                performance: {
                    loadTime: this.getLoadTime(),
                    domContentLoaded: this.getDOMContentLoadedTime()
                }
            }
        };
    },
    
    /**
     * 获取加载时间
     */
    getLoadTime() {
        const navigation = performance.getEntriesByType('navigation')[0];
        return navigation ? navigation.loadEventEnd - navigation.fetchStart : 0;
    },
    
    /**
     * 获取DOM内容加载时间
     */
    getDOMContentLoadedTime() {
        const navigation = performance.getEntriesByType('navigation')[0];
        return navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0;
    },
    
    /**
     * 导出错误数据
     */
    exportErrorData() {
        const data = this.getErrorReport();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `qulome_error_report_${new Date().toISOString()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
};

// 记录会话开始时间
window.ErrorTracker.sessionStartTime = Date.now();

// 页面加载完成后初始化错误追踪器
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ErrorTracker.init();
    });
} else {
    window.ErrorTracker.init();
}