import Logger from './logger.js';

const ErrorHandler = {
    /**
     * 处理错误的主入口
     * @param {Error|string} error - 错误对象或错误消息
     * @param {string} context - 错误发生的上下文，用于调试
     */
    handle: (error, context = 'Unknown') => {
        Logger.error(`Error in ${context}`, error);
        // 向用户显示友好的错误提示
        const userMessage = ErrorHandler.getUserMessage(error);
        if (userMessage) {
            alert(userMessage);
        }
    },
    /**
     * 将技术性错误转换为用户友好的消息
     * @param {Error|string} error - 错误对象或错误消息
     * @returns {string} 用户友好的错误消息
     */
    getUserMessage: (error) => {
        if (typeof error === 'string') {
            return error;
        }
        if (error.message) {
            if (error.message.includes('localStorage')) {
                return '存储空间不足，请清理浏览器缓存后重试。';
            }
            if (error.message.includes('JSON')) {
                return '数据格式错误，将重置相关设置。';
            }
            if (error.message.includes('required')) {
                return '请填写必要的信息。';
            }
            return error.message;
        }
        return '操作失败，请重试。';
    }
};

export default ErrorHandler; 