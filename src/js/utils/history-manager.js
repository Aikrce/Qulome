/**
 * History Manager - 历史记录管理器
 * 
 * 提供撤销/重做功能，支持编辑器内容的历史记录管理
 */

window.HistoryManager = {
    // 历史记录栈
    undoStack: [],
    redoStack: [],
    
    // 配置选项
    config: {
        maxHistorySize: 50,  // 最大历史记录数量
        debounceDelay: 1000, // 防抖延迟
        minChangeLength: 5   // 最小变化长度才记录
    },

    // 当前编辑器实例
    currentEditor: null,
    
    // 防抖计时器
    debounceTimer: null,

    /**
     * 初始化历史管理器
     * @param {Object} editor - Quill编辑器实例
     */
    init(editor) {
        this.currentEditor = editor;
        this.undoStack = [];
        this.redoStack = [];
        
        // 监听编辑器内容变化
        if (editor) {
            editor.on('text-change', (delta, oldDelta, source) => {
                if (source === 'user') {
                    this.debouncedRecordState();
                }
            });
        }

        // 添加键盘快捷键
        this.addKeyboardShortcuts();
        
        window.Logger.debug('HistoryManager initialized');
    },

    /**
     * 防抖记录状态
     */
    debouncedRecordState() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.recordState();
        }, this.config.debounceDelay);
    },

    /**
     * 记录当前状态
     */
    recordState() {
        if (!this.currentEditor) return;

        const currentContent = this.currentEditor.getContents();
        const currentText = this.currentEditor.getText();
        
        // 检查是否有足够的变化
        if (this.undoStack.length > 0) {
            const lastState = this.undoStack[this.undoStack.length - 1];
            const textDiff = Math.abs(currentText.length - lastState.text.length);
            
            if (textDiff < this.config.minChangeLength) {
                return; // 变化太小，不记录
            }
        }

        const state = {
            content: currentContent,
            text: currentText,
            timestamp: Date.now(),
            selection: this.currentEditor.getSelection()
        };

        // 添加到撤销栈
        this.undoStack.push(state);
        
        // 清空重做栈
        this.redoStack = [];
        
        // 限制栈大小
        if (this.undoStack.length > this.config.maxHistorySize) {
            this.undoStack.shift();
        }

        this.updateUIButtons();
        
        window.Logger.debug(`State recorded. Undo stack size: ${this.undoStack.length}`);
    },

    /**
     * 撤销操作
     */
    undo() {
        if (!this.canUndo()) {
            window.Logger.warn('No undo states available');
            return false;
        }

        // 如果这是第一次撤销，先保存当前状态到重做栈
        if (this.redoStack.length === 0) {
            const currentState = {
                content: this.currentEditor.getContents(),
                text: this.currentEditor.getText(),
                timestamp: Date.now(),
                selection: this.currentEditor.getSelection()
            };
            this.redoStack.push(currentState);
        }

        // 从撤销栈取出状态
        const state = this.undoStack.pop();
        
        // 应用状态
        this.applyState(state);
        
        // 添加到重做栈
        this.redoStack.push(state);

        this.updateUIButtons();
        
        window.Logger.debug(`Undo applied. Undo stack: ${this.undoStack.length}, Redo stack: ${this.redoStack.length}`);
        return true;
    },

    /**
     * 重做操作
     */
    redo() {
        if (!this.canRedo()) {
            window.Logger.warn('No redo states available');
            return false;
        }

        // 先保存当前状态到撤销栈
        const currentState = {
            content: this.currentEditor.getContents(),
            text: this.currentEditor.getText(),
            timestamp: Date.now(),
            selection: this.currentEditor.getSelection()
        };
        this.undoStack.push(currentState);

        // 从重做栈取出状态
        const state = this.redoStack.pop();
        
        // 应用状态
        this.applyState(state);

        this.updateUIButtons();
        
        window.Logger.debug(`Redo applied. Undo stack: ${this.undoStack.length}, Redo stack: ${this.redoStack.length}`);
        return true;
    },

    /**
     * 应用状态到编辑器
     * @param {Object} state - 要应用的状态
     */
    applyState(state) {
        if (!this.currentEditor || !state) return;

        // 暂时移除事件监听器以避免循环记录
        this.currentEditor.off('text-change');
        
        try {
            // 设置内容
            this.currentEditor.setContents(state.content, 'silent');
            
            // 恢复选择
            if (state.selection) {
                this.currentEditor.setSelection(state.selection, 'silent');
            }
            
            // 触发自动保存
            if (window.EditorView && window.EditorView.triggerAutoSave) {
                window.EditorView.triggerAutoSave();
            }
        } catch (error) {
            window.Logger.error('Failed to apply history state', error);
        } finally {
            // 重新添加事件监听器
            setTimeout(() => {
                this.currentEditor.on('text-change', (delta, oldDelta, source) => {
                    if (source === 'user') {
                        this.debouncedRecordState();
                    }
                });
            }, 100);
        }
    },

    /**
     * 检查是否可以撤销
     */
    canUndo() {
        return this.undoStack.length > 0;
    },

    /**
     * 检查是否可以重做
     */
    canRedo() {
        return this.redoStack.length > 0;
    },

    /**
     * 更新UI按钮状态
     */
    updateUIButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
            undoBtn.setAttribute('aria-label', 
                this.canUndo() ? `撤销 (${this.undoStack.length} 项可用)` : '撤销 (不可用)'
            );
        }
        
        if (redoBtn) {
            redoBtn.disabled = !this.canRedo();
            redoBtn.setAttribute('aria-label', 
                this.canRedo() ? `重做 (${this.redoStack.length} 项可用)` : '重做 (不可用)'
            );
        }

        // 更新状态栏
        this.updateStatusBar();
    },

    /**
     * 更新状态栏显示
     */
    updateStatusBar() {
        const statusBar = document.getElementById('editor-status-bar');
        if (statusBar) {
            const historyInfo = `历史: ${this.undoStack.length}/${this.config.maxHistorySize}`;
            statusBar.textContent = historyInfo;
        }
    },

    /**
     * 添加键盘快捷键
     */
    addKeyboardShortcuts() {
        const handleKeydown = (e) => {
            // Ctrl+Z / Cmd+Z - 撤销
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
                return;
            }
            
            // Ctrl+Y / Cmd+Shift+Z - 重做
            if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                this.redo();
                return;
            }
        };

        // 使用EventManager添加事件监听器
        if (window.EventManager) {
            window.EventManager.on(document, 'keydown', handleKeydown, {
                namespace: 'history-manager',
                description: 'History keyboard shortcuts'
            });
        } else {
            document.addEventListener('keydown', handleKeydown);
        }
    },

    /**
     * 清空历史记录
     */
    clearHistory() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateUIButtons();
        window.Logger.debug('History cleared');
    },

    /**
     * 获取历史统计信息
     */
    getStats() {
        return {
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length,
            maxSize: this.config.maxHistorySize,
            memoryUsage: this.calculateMemoryUsage()
        };
    },

    /**
     * 计算内存使用量（估算）
     */
    calculateMemoryUsage() {
        let totalSize = 0;
        
        [...this.undoStack, ...this.redoStack].forEach(state => {
            totalSize += JSON.stringify(state.content).length;
            totalSize += state.text.length;
        });
        
        return {
            bytes: totalSize,
            kb: Math.round(totalSize / 1024 * 100) / 100,
            mb: Math.round(totalSize / (1024 * 1024) * 100) / 100
        };
    },

    /**
     * 清理过期的历史记录
     */
    cleanup() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30分钟

        this.undoStack = this.undoStack.filter(state => 
            now - state.timestamp < maxAge
        );
        
        this.redoStack = this.redoStack.filter(state => 
            now - state.timestamp < maxAge
        );

        this.updateUIButtons();
        window.Logger.debug('History cleanup completed');
    },

    /**
     * 销毁历史管理器
     */
    destroy() {
        clearTimeout(this.debounceTimer);
        
        if (window.EventManager) {
            window.EventManager.offNamespace('history-manager');
        }
        
        this.clearHistory();
        this.currentEditor = null;
        
        window.Logger.debug('HistoryManager destroyed');
    }
};