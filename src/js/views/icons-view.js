/**
 * Icons View Module
 * 
 * This module manages all the logic for the Icon Library view, including:
 * - Rendering the grid of saved icons
 * - Handling manual SVG input via form
 * - Handling icon deletion
 */
window.IconsView = {
    init: () => {
        window.IconsView.render();
        window.IconsView.bindEvents();
    },

    render: () => {
        const icons = window.iconService.getIcons();
        const grid = document.getElementById('icons-grid');
        if (!grid) {
            window.Logger.error('[IconsView] 图标网格容器 #icons-grid 未找到');
            return;
        }

        grid.innerHTML = icons.map(icon => `
            <div class="icon-card" data-icon-id="${icon.id}">
                <div class="icon-preview">${icon.svg}</div>
                <p class="icon-name">${icon.name}</p>
                <div class="icon-actions">
                    <button class="btn btn-secondary copy-svg-btn">复制</button>
                    <button class="btn btn-danger delete-icon-btn">删除</button>
                </div>
            </div>
        `).join('');
    },

    bindEvents: () => {
        const form = document.getElementById('add-icon-form');
        const grid = document.getElementById('icons-grid');

        if (!form || !grid) {
            window.Logger.error('[IconsView] 表单或图标网格容器未找到');
            return;
        }

        // 防止重复绑定：先解绑旧事件
        form.onsubmit = null;
        grid.onclick = null;

        // 绑定表单提交事件
        form.onsubmit = (event) => {
            event.preventDefault();
            const nameInput = document.getElementById('icon-name');
            const svgInput = document.getElementById('icon-svg');
            
            if (!nameInput || !svgInput) {
                window.Logger.error('[IconsView] 表单输入元素未找到');
                return;
            }

            const name = nameInput.value.trim();
            const svg = svgInput.value.trim();
            
            if (!name || !svg) {
                alert('请填写图标名称和 SVG 代码。');
                return;
            }

            try {
                window.iconService.addIcon(name, svg);
                window.Logger.debug('图标添加成功:', name);
                
                // 清空表单并重新渲染
                nameInput.value = '';
                svgInput.value = '';
                window.IconsView.render();
            } catch (error) {
                alert(error.message || '添加图标失败');
                window.Logger.error('添加图标失败:', error);
            }
        };

        // 绑定图标操作事件（复制和删除）
        grid.onclick = (event) => {
            event.stopPropagation();
            const iconCard = event.target.closest('.icon-card');
            if (!iconCard) return;
            
            const iconId = iconCard.dataset.iconId;
            
            // 处理复制SVG按钮
            if (event.target.classList.contains('copy-svg-btn')) {
                const icon = window.iconService.getIcon(iconId);
                if (icon) {
                    navigator.clipboard.writeText(icon.svg).then(() => {
                        alert(`已复制图标 "${icon.name}" 的 SVG 代码！`);
                    }).catch(err => {
                        window.Logger.error('复制 SVG 失败', err);
                        alert('复制失败，请手动复制。');
                    });
                }
            }
            // 处理删除图标按钮
            else if (event.target.classList.contains('delete-icon-btn')) {
                const icon = window.iconService.getIcon(iconId);
                if (icon && confirm(`确定要删除图标 "${icon.name}" 吗？`)) {
                    window.iconService.deleteIcon(iconId);
                    window.IconsView.render();
                }
            }
        };
    }
}; 