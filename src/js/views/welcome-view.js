/**
 * WelcomeView 模块
 * 负责欢迎界面的所有逻辑，包括按钮事件处理
 */
export class WelcomeView {
    /**
     * @param {function(string): void} switchViewCallback - 用于切换视图的回调函数
     */
    constructor(switchViewCallback) {
        if (typeof switchViewCallback !== 'function') {
            throw new Error('WelcomeView需要一个有效的回调函数来切换视图');
        }
        this.switchView = switchViewCallback;
        this.init();
    }

    /**
     * 初始化欢迎界面的事件监听器
     */
    init() {
        const selectTemplateBtn = document.querySelector('[data-action="select-template"]');
        const startEditingBtn = document.querySelector('[data-action="start-editing"]');

        if (selectTemplateBtn) {
            selectTemplateBtn.addEventListener('click', () => {
                this.switchView('themes');
            });
        }

        if (startEditingBtn) {
            startEditingBtn.addEventListener('click', () => {
                this.switchView('editor');
            });
        }
    }
} 