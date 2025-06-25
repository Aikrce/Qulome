/**
 * Themes View Module
 * 
 * 负责主题库视图的渲染、事件绑定和交互逻辑。
 * - 渲染主题卡片列表
 * - 处理新主题创建
 * - 处理主题的应用与删除
 * - 保证事件绑定健壮、无重复
 */
window.ThemesView = {
    /**
     * 初始化主题库视图：渲染主题列表并绑定事件
     */
    init: () => {
        window.ThemesView.render();
        window.ThemesView.bindEvents();
    },

    /**
     * 渲染主题卡片列表
     * 遍历所有主题，生成卡片HTML并插入到#themes-grid
     */
    render: () => {
        const themes = window.themeService.getThemes();
        const grid = document.getElementById('themes-grid');
        if (!grid) {
            window.Logger.error('[ThemesView] 主题列表容器 #themes-grid 未找到');
            return;
        }
        grid.innerHTML = themes.map(theme => `
            <div class="theme-card ${theme.isActive ? 'active' : ''}" data-theme-name="${theme.name}">
                <div class="theme-preview">
                    <div class="preview-h1" style="color: ${theme.styles['--h1-color']};">标题</div>
                    <div class="preview-p" style="color: ${theme.styles['--p-color']};">正文内容...</div>
                </div>
                <div class="theme-name">${theme.name}</div>
                <div class="theme-actions">
                    <button class="apply-theme-btn">应用</button>
                    ${!theme.isSystemTheme ? '<button class="delete-theme-btn">&times;</button>' : ''}
                </div>
            </div>
        `).join('');
    },

    /**
     * 绑定主题库相关事件（表单提交、卡片点击）
     * 绑定前先解绑，防止重复绑定
     */
    bindEvents: () => {
        const form = document.getElementById('add-theme-form');
        const grid = document.getElementById('themes-grid');

        if (!form || !grid) {
            window.Logger.error('[ThemesView] 主题表单或列表容器未找到');
            return;
        }

        // --- 防止重复绑定：先解绑旧事件 ---
        form.onsubmit = null;
        grid.onclick = null;

        // --- 绑定"添加新主题"表单提交事件 ---
        form.onsubmit = (event) => {
            event.preventDefault();
            const nameInput = document.getElementById('new-theme-name');
            
            if (!nameInput) {
                window.Logger.error('[ThemesView] 主题名称输入框未找到');
                return;
            }
            
            const themeName = nameInput.value.trim();
            if (!themeName) {
                alert('主题名称不能为空！');
                return;
            }
            
            // 创建带有默认样式的新主题，使用 ThemeService 的标准默认样式
            const newTheme = window.themeService.addTheme(themeName);
            
            try {
                // newTheme 已经通过 addTheme 方法创建并保存了
                nameInput.value = ''; // 清空输入框
                window.ThemesView.render(); // 重新渲染
                window.Logger.debug('新主题创建成功:', themeName);
            } catch (error) {
                alert(error.message || '创建主题失败');
                window.Logger.error('创建主题失败:', error);
            }
        };

        // --- 绑定主题卡片的"应用/删除"事件（事件委托） ---
        grid.onclick = (event) => {
            const themeCard = event.target.closest('.theme-card');
            if (!themeCard) return;
            const themeName = themeCard.dataset.themeName;
            // 应用主题
            if (event.target.classList.contains('apply-theme-btn')) {
                window.themeService.applyTheme(themeName);
                window.ThemesView.render();
            }
            // 删除主题
            if (event.target.classList.contains('delete-theme-btn')) {
                if (confirm(`确定要删除主题 "${themeName}" 吗？`)) {
                    window.themeService.deleteTheme(themeName);
                    window.ThemesView.render();
                }
            }
        };
    }
}; 