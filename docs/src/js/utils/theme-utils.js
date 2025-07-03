/**
 * Theme Utils Module
 * 
 * 主题相关的通用工具函数
 * - 输入验证
 * - HTML安全处理
 * - 通知系统
 * - 主题变更通知
 */
window.ThemeUtils = {
    
    /**
     * 验证主题名称输入
     * @param {HTMLInputElement} input - 输入框元素
     */
    validateThemeNameInput: (input) => {
        const value = input.value.trim();
        
        // 移除之前的错误状态
        input.classList.remove('error');
        
        // 实时验证
        if (value.length > 50) {
            input.classList.add('error');
        }
        
        // 检查重复名称
        if (value) {
            const existingThemes = window.themeService.getThemes();
            if (existingThemes.some(theme => theme.name === value)) {
                input.classList.add('error');
            }
        }
    },

    /**
     * 通知主题更改
     * 发送自定义事件，其他组件可以监听
     */
    notifyThemeChange: () => {
        const event = new CustomEvent('themeChanged', {
            detail: { activeTheme: window.themeService.getActiveTheme() }
        });
        document.dispatchEvent(event);
    },

    /**
     * HTML转义，防止XSS攻击
     * @param {string} text - 需要转义的文本
     * @returns {string} 转义后的HTML安全文本
     */
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 显示成功消息通知
     * @param {string} message - 成功消息内容
     */
    showSuccess: (message) => {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10B981;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    },

    /**
     * 显示错误消息通知
     * @param {string} message - 错误消息内容
     */
    showError: (message) => {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #EF4444;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000); // 错误消息显示时间稍长
    },

    /**
     * 显示警告消息通知
     * @param {string} message - 警告消息内容
     */
    showWarning: (message) => {
        const notification = document.createElement('div');
        notification.className = 'notification warning';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #F59E0B;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 3500);
    },

    /**
     * 显示信息消息通知
     * @param {string} message - 信息消息内容
     */
    showInfo: (message) => {
        const notification = document.createElement('div');
        notification.className = 'notification info';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3B82F6;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    },



    /**
     * 防抖函数
     * @param {Function} func - 需要防抖的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 节流函数
     * @param {Function} func - 需要节流的函数
     * @param {number} limit - 限制时间（毫秒）
     * @returns {Function} 节流后的函数
     */
    throttle: (func, limit) => {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}; 