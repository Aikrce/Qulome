/**
 * 标准化错误处理工具
 * 提供统一的错误处理模式和错误恢复机制
 */
const StandardErrorHandler = {
    /**
     * 标准错误处理方法
     * @param {Error|string} error - 错误对象或错误消息
     * @param {string} context - 错误发生的上下文
     * @param {Object} options - 处理选项
     * @param {boolean} options.showUser - 是否向用户显示错误
     * @param {boolean} options.logError - 是否记录错误日志
     * @param {Function} options.onError - 错误回调函数
     * @param {Function} options.recovery - 错误恢复函数
     * @returns {boolean} 是否成功处理错误
     */
    handle(error, context = 'Unknown', options = {}) {
        const {
            showUser = true,
            logError = true,
            onError = null,
            recovery = null
        } = options;

        // 构建标准化错误对象
        const standardError = this._createStandardError(error, context);

        // 记录错误日志
        if (logError && window.Logger) {
            window.Logger.error(`[${context}] ${standardError.message}`, {
                error: standardError,
                stack: standardError.stack,
                timestamp: new Date().toISOString()
            });
        }

        // 向用户显示友好的错误提示
        if (showUser) {
            const userMessage = this._getUserFriendlyMessage(standardError);
            this._showUserError(userMessage);
        }

        // 执行错误回调
        if (typeof onError === 'function') {
            try {
                onError(standardError);
            } catch (callbackError) {
                if (window.Logger) {
                    window.Logger.error('Error in error callback', callbackError);
                }
            }
        }

        // 尝试错误恢复
        if (typeof recovery === 'function') {
            try {
                recovery(standardError);
                if (window.Logger) {
                    window.Logger.info(`Recovery attempted for ${context}`);
                }
            } catch (recoveryError) {
                if (window.Logger) {
                    window.Logger.error('Error in recovery function', recoveryError);
                }
            }
        }

        return true;
    },

    /**
     * 异步错误处理
     * @param {Promise} promise - 需要处理的Promise
     * @param {string} context - 错误上下文
     * @param {Object} options - 处理选项
     * @returns {Promise} 处理后的Promise
     */
    async handleAsync(promise, context = 'Async Operation', options = {}) {
        try {
            return await promise;
        } catch (error) {
            this.handle(error, context, options);
            throw error; // 重新抛出以便调用方处理
        }
    },

    /**
     * 包装函数以提供错误处理
     * @param {Function} fn - 要包装的函数
     * @param {string} context - 错误上下文
     * @param {Object} options - 处理选项
     * @returns {Function} 包装后的函数
     */
    wrap(fn, context = 'Function', options = {}) {
        return (...args) => {
            try {
                const result = fn.apply(this, args);
                
                // 如果返回Promise，则处理异步错误
                if (result && typeof result.then === 'function') {
                    return result.catch(error => {
                        this.handle(error, context, options);
                        throw error;
                    });
                }
                
                return result;
            } catch (error) {
                this.handle(error, context, options);
                throw error;
            }
        };
    },

    /**
     * 创建标准化错误对象
     * @private
     */
    _createStandardError(error, context) {
        if (error instanceof Error) {
            error.context = context;
            error.timestamp = new Date().toISOString();
            return error;
        }

        const standardError = new Error(String(error));
        standardError.context = context;
        standardError.timestamp = new Date().toISOString();
        return standardError;
    },

    /**
     * 获取用户友好的错误消息
     * @private
     */
    _getUserFriendlyMessage(error) {
        const message = error.message || String(error);

        // 本地化错误消息
        const errorMappings = {
            'localStorage': '存储空间不足，请清理浏览器缓存后重试。',
            'JSON': '数据格式错误，将重置相关设置。',
            'required': '请填写必要的信息。',
            'network': '网络连接失败，请检查网络连接。',
            'permission': '权限不足，无法执行此操作。',
            'timeout': '操作超时，请重试。',
            'not found': '请求的资源不存在。',
            'forbidden': '没有权限访问此资源。'
        };

        for (const [key, friendlyMessage] of Object.entries(errorMappings)) {
            if (message.toLowerCase().includes(key)) {
                return friendlyMessage;
            }
        }

        // 默认错误消息
        return '操作失败，请重试。如果问题持续存在，请联系技术支持。';
    },

    /**
     * 向用户显示错误
     * @private
     */
    _showUserError(message) {
        // 优先使用通知系统
        if (window.Notification && window.Notification.show) {
            window.Notification.show(message, 'error');
        } else {
            // 回退到alert
            alert(message);
        }
    },

    /**
     * 错误恢复策略
     */
    recoveryStrategies: {
        /**
         * 重置localStorage数据
         */
        resetLocalStorage: (error) => {
            try {
                localStorage.clear();
                if (window.Logger) {
                    window.Logger.info('LocalStorage reset due to error');
                }
            } catch (e) {
                if (window.Logger) {
                    window.Logger.error('Failed to reset localStorage', e);
                }
            }
        },

        /**
         * 重新加载页面
         */
        reloadPage: (error) => {
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        },

        /**
         * 重置应用状态
         */
        resetAppState: (error) => {
            try {
                // 清理DOM缓存
                if (window.DOMCache) {
                    window.DOMCache.clear();
                }
                
                // 清理事件监听器
                if (window.EventCleanupManager) {
                    window.EventCleanupManager.cleanup();
                }
                
                if (window.Logger) {
                    window.Logger.info('App state reset due to error');
                }
            } catch (e) {
                if (window.Logger) {
                    window.Logger.error('Failed to reset app state', e);
                }
            }
        }
    },

    /**
     * 获取错误统计信息
     */
    getErrorStats() {
        // 这里可以实现错误统计逻辑
        return {
            // 占位符，可以在实际使用中实现
            totalErrors: 0,
            errorsByContext: {},
            recentErrors: []
        };
    }
};

// 设置全局错误处理
window.addEventListener('error', (event) => {
    StandardErrorHandler.handle(event.error, 'Global Error', {
        showUser: false, // 全局错误不显示给用户
        logError: true
    });
});

// 设置未处理的Promise拒绝处理
window.addEventListener('unhandledrejection', (event) => {
    StandardErrorHandler.handle(event.reason, 'Unhandled Promise Rejection', {
        showUser: false,
        logError: true
    });
    
    // 防止默认的错误输出
    event.preventDefault();
});

// 挂载到全局对象
window.StandardErrorHandler = StandardErrorHandler;