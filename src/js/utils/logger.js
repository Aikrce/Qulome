const Logger = {
    debug: (message, data = null) => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(`[Qulome Debug] ${message}`, data || '');
        }
    },
    error: (message, error = null) => {
        console.error(`[Qulome Error] ${message}`, error || '');
    },
    info: (message, data = null) => {
        console.info(`[Qulome Info] ${message}`, data || '');
    },
    warn: (message, data = null) => {
        console.warn(`[Qulome Warn] ${message}`, data || '');
    },
    // 添加性能监控
    time: (label) => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.time(`[Qulome] ${label}`);
        }
    },
    timeEnd: (label) => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.1') {
            console.timeEnd(`[Qulome] ${label}`);
        }
    }
};

// Make Logger available globally
window.Logger = Logger; 