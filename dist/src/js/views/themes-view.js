/**
 * 主题视图管理 - 已重构版本
 * 
 * 主要功能：
 * - 主题列表渲染和管理
 * - 主题卡片交互（激活、编辑、删除、复制）
 * - 与新模块的集成（ThemeEditorModal、NotificationUtils等）
 */
window.ThemesView = {
    /**
     * 初始化主题视图（为了兼容 app.js 的调用）
     */
    init: () => {
                window.ThemesView.render();
    },

    /**
     * 渲染主题视图
     */
    render: () => {
        const container = document.getElementById('themes-container');
        if (!container) return;

        const themes = window.themeService.getThemes();
        const activeTheme = window.themeService.getActiveTheme();

        container.innerHTML = `
            <div class="themes-header">
                <h2>主题管理</h2>
                <div class="themes-actions">
                    <button id="create-theme-btn" class="btn btn-primary">+ 新建主题</button>
                </div>
            </div>
            <div class="themes-grid">
                ${themes.map(theme => window.ThemesView.getThemeCardHTML(theme, activeTheme)).join('')}
            </div>
        `;

        window.ThemesView.addEventHandler();
    },

    /**
     * 生成主题卡片HTML
     */
    getThemeCardHTML: (theme, activeTheme) => {
        const isActive = activeTheme && activeTheme.id === theme.id;
            return `
            <div class="theme-card ${isActive ? 'active' : ''}" data-theme-id="${theme.id}">
                <div class="theme-preview">
                    <div class="preview-content" style="
                        color: ${theme.styles['--text-primary'] || '#333'};
                        background: ${theme.styles['--background-color'] || '#fff'};
                    ">
                        <h3 style="color: ${theme.styles['--h1-color'] || '#0E2A73'};">标题示例</h3>
                        <p>这是正文内容的预览效果</p>
                </div>
                </div>
                <div class="theme-info">
                    <h4>${window.ThemeUtils.escapeHtml(theme.name)}</h4>
                    <p class="theme-description">${window.ThemeUtils.escapeHtml(theme.description || '自定义主题')}</p>
                <div class="theme-actions">
                        <button class="btn ${isActive ? 'btn-secondary' : 'btn-primary'} btn-theme-action ${isActive ? 'btn-active' : 'btn-activate'}" 
                                data-action="${isActive ? 'active' : 'activate'}" 
                                data-theme-id="${theme.id}" ${isActive ? 'disabled' : ''}>
                            ${isActive ? '已激活' : '激活'}
                        </button>
                        <button class="btn btn-secondary btn-theme-action btn-edit" data-action="edit" data-theme-id="${theme.id}">编辑</button>
                        <button class="btn btn-secondary btn-theme-action btn-copy" data-action="copy" data-theme-id="${theme.id}">复制</button>
                        ${!theme.isDefault ? `<button class="btn btn-secondary btn-theme-action btn-delete" data-action="delete" data-theme-id="${theme.id}">删除</button>` : ''}
                    </div>
                </div>
            </div>
            `;
    },

    /**
     * 添加事件处理器
     */
    addEventHandler: () => {
        const container = document.getElementById('themes-container');
        if (!container) return;

        // 移除旧的事件监听器
        if (window.ThemesView.eventHandler) {
            container.removeEventListener('click', window.ThemesView.eventHandler);
        }

        // 添加新的事件监听器
        window.ThemesView.eventHandler = (e) => {
            window.ThemesView.handleThemeCardClick(e);
        };
        container.addEventListener('click', window.ThemesView.eventHandler);

        // 新建主题按钮
        const createBtn = document.getElementById('create-theme-btn');
        if (createBtn) {
            createBtn.addEventListener('click', window.ThemesView.createNewTheme);
        }
    },

    /**
     * 处理主题卡片点击事件
     */
    handleThemeCardClick: (e) => {
        const button = e.target.closest('.btn-theme-action, #create-theme-btn');
        if (!button) return;
            
        const action = button.dataset.action;
        const themeId = button.dataset.themeId;

        try {
            switch (action) {
                case 'activate':
                    window.ThemesView.activateTheme(themeId);
                    break;
                case 'edit':
                    window.ThemesView.showThemeEditor(themeId);
                    break;
                case 'copy':
                    window.ThemesView.copyTheme(themeId);
                    break;
                case 'delete':
                    window.ThemesView.deleteTheme(themeId);
                    break;
            }
        } catch (error) {
            window.Logger.error('处理主题卡片点击失败', error);
            window.ThemesView.showError('操作失败，请重试');
        }
    },

    /**
     * 激活主题
     */
    activateTheme: (themeId) => {
        try {
            const theme = window.themeService.getTheme(themeId);
            if (!theme) {
                window.ThemesView.showError('主题不存在');
                return;
            }

            window.themeService.applyTheme(theme.id);
                    window.ThemesView.render();
            window.ThemesView.showSuccess(`主题 "${theme.name}" 已激活`);
            window.ThemesView.notifyThemeChange();
                    } catch (error) {
            window.Logger.error('激活主题失败', error);
            window.ThemesView.showError('激活主题失败');
                    }
    },

    /**
     * 显示主题编辑器
     */
    showThemeEditor: (themeId) => {
        window.ThemeEditorModal.show(themeId);
    },

    /**
     * 复制主题
     */
    copyTheme: (themeId) => {
        try {
            const originalTheme = window.themeService.getTheme(themeId);
            if (!originalTheme) {
                window.ThemesView.showError('要复制的主题不存在');
                        return;
                    }

            const copyName = `${originalTheme.name} 副本`;
            const newTheme = {
                id: Date.now().toString(),
                name: copyName,
                description: `复制自 ${originalTheme.name}`,
                styles: { ...originalTheme.styles },
                isDefault: false,
                isActive: false
            };

            window.themeService.updateTheme(newTheme);
            window.ThemesView.render();
            window.ThemesView.showSuccess(`主题 "${copyName}" 已创建`);
        } catch (error) {
            window.Logger.error('复制主题失败', error);
            window.ThemesView.showError('复制主题失败');
        }
    },

    /**
     * 删除主题
     */
    deleteTheme: (themeId) => {
        try {
            const theme = window.themeService.getTheme(themeId);
            if (!theme) {
                window.ThemesView.showError('要删除的主题不存在');
                return;
            }

            if (theme.isDefault) {
                window.ThemesView.showError('默认主题不能删除');
                return;
            }

            window.NotificationUtils.showConfirmationModal(
                `确定要删除主题 "${theme.name}" 吗？`,
                '删除后无法恢复',
                () => {
                    window.themeService.deleteTheme(themeId);
                    window.ThemesView.render();
                    window.ThemesView.showSuccess(`主题 "${theme.name}" 已删除`);
                }
            );
        } catch (error) {
            window.Logger.error('删除主题失败', error);
            window.ThemesView.showError('删除主题失败');
        }
    },

    /**
     * 创建新主题
     */
    createNewTheme: () => {
        const name = prompt('请输入主题名称：');
        if (!name || !name.trim()) return;

        if (name.trim().length > 50) {
            window.ThemesView.showError('主题名称不能超过50个字符');
            return;
        }

        try {
            const existingThemes = window.themeService.getThemes();
            if (existingThemes.some(theme => theme.name === name.trim())) {
                window.ThemesView.showError('主题名称已存在');
                return;
            }

            const newTheme = {
                id: Date.now().toString(),
                name: name.trim(),
                description: '自定义主题',
                styles: window.themeService.getDefaultStyles(),
                isDefault: false,
                isActive: false
            };

            window.themeService.updateTheme(newTheme);
            window.ThemesView.render();
            window.ThemesView.showSuccess(`主题 "${newTheme.name}" 已创建`);
        } catch (error) {
            window.Logger.error('创建主题失败', error);
            window.ThemesView.showError('创建主题失败');
        }
    },

    /**
     * 通知主题更改
     */
    notifyThemeChange: () => {
        const event = new CustomEvent('themeChanged', {
            detail: { activeTheme: window.themeService.getActiveTheme() }
        });
        document.dispatchEvent(event);
    },



    /**
     * 显示成功消息
     */
    showSuccess: (message) => {
        window.NotificationUtils.showSuccess(message);
    },

    /**
     * 显示错误消息
     */
    showError: (message) => {
        window.NotificationUtils.showError(message);
    },


}; 