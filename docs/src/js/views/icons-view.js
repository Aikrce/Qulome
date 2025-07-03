/**
 * Icons View Module
 * 
 * This module manages all the logic for the icons view, including:
 * - Icon grid rendering
 * - Icon operations (add, delete, copy, color change)
 * - Form validation and submission
 * - Event binding management
 */

window.IconsView = {
    /**
     * Initialize the icons view
     */
    init: () => {
        try {
            window.IconsView.render();
            window.IconsView.bindEvents();
            window.Logger.debug('Icons view initialized');
        } catch (error) {
            window.Logger.error('Failed to initialize icons view', error);
        }
    },

    /**
     * Render the icons grid
     */
    render: () => {
        try {
            const icons = window.iconService.getIcons();
            const grid = document.getElementById('icons-grid');
            const sidebar = document.querySelector('.icons-sidebar');

            if (!grid) {
                throw new Error('图标网格容器 #icons-grid 未找到');
            }

            // 渲染图标库按钮组
            if (sidebar) {
                const iconLibs = [
                    { name: 'Feather Icons', url: 'https://feathericons.com/' },
                    { name: 'Heroicons', url: 'https://heroicons.com/' },
                    { name: 'Hola SVG Icons', url: 'https://icons.holasvg.com/' },
                    { name: 'Lucide Icons', url: 'https://lucide.dev/' },
                    { name: 'Reshot', url: 'https://www.reshot.com/free-svg-icons/' },
                    { name: 'SVG Repo', url: 'https://www.svgrepo.com/' },
                    { name: 'Tabler Icons', url: 'https://tabler-icons.io/' }
                ];
                // 找到icon-resources容器
                const resources = sidebar.querySelector('.icon-resources');
                if (resources) {
                    // 清除已有按钮组
                    const oldBar = resources.querySelector('.icon-libs-bar');
                    if (oldBar) oldBar.remove();
                    // 插入按钮组
                    const bar = document.createElement('div');
                    bar.className = 'icon-libs-bar';
                    bar.innerHTML = iconLibs.map(lib => `<button class="btn btn-outline-primary icon-lib-btn" onclick="window.open('${lib.url}','_blank')">${lib.name}</button>`).join('');
                    resources.appendChild(bar);
                }
            }

            // 渲染图标网格
            if (icons.length === 0) {
                grid.innerHTML = '<p class="empty-state">还没有图标，添加第一个图标吧！</p>';
                return;
            }

            grid.innerHTML = icons.map(icon => `
                <div class="icon-card" data-icon-id="${icon.id}">
                    <button class="icon-card-delete delete-icon-btn" title="删除图标">&times;</button>
                    <div class="icon-preview" title="${window.ThemeUtils.escapeHtml(icon.name)}">
                        ${icon.svg || ''}
                    </div>
                    <p class="icon-name">${window.ThemeUtils.escapeHtml(icon.name)}</p>
                    <div class="icon-actions">
                        <div class="icon-color-picker">
                            <button class="btn btn-accent color-picker-btn" title="改变颜色">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="13.5" cy="6.5" r=".5"></circle>
                                    <circle cx="17.5" cy="10.5" r=".5"></circle>
                                    <circle cx="8.5" cy="7.5" r=".5"></circle>
                                    <circle cx="6.5" cy="11.5" r=".5"></circle>
                                    <polygon points="13,2 3,14 12,14 13,2"></polygon>
                                </svg>
                                调色
                            </button>
                            <input type="color" class="icon-color-input" data-icon-id="${icon.id}" value="${icon.color || '#222'}" />
                        </div>
                        <button class="btn btn-secondary toggle-color-mode-btn" data-icon-id="${icon.id}" title="切换改色模式">
                            ${icon.colorMode === 'fill' ? '内部改色' : '主线条改色'}
                        </button>
                    </div>
                </div>
            `).join('');

            // 强制刷新所有颜色输入框的值
            grid.querySelectorAll('.icon-color-input').forEach(input => {
                const iconId = input.dataset.iconId;
                const icon = icons.find(i => i.id === iconId);
                if (icon) {
                    input.value = icon.color || '#222';
                }
            });

            window.Logger.debug(`Rendered ${icons.length} icons`);
        } catch (error) {
            window.Logger.error('Failed to render icons', error);
            window.IconsView.showError('渲染图标列表失败');
        }
    },

    /**
     * Bind events for the icons view
     */
    bindEvents: () => {
        try {
            const form = document.getElementById('add-icon-form');
            const grid = document.getElementById('icons-grid');

            if (!form) {
                throw new Error('图标表单未找到');
            }
            if (!grid) {
                throw new Error('图标网格容器未找到');
            }

            // 绑定表单提交
            window.IconsView.addEventHandler(form, 'submit', (event) => {
                event.preventDefault();
                window.IconsView.handleAddIcon();
            });

            // 绑定图标操作（使用事件委托）
            window.IconsView.addEventHandler(grid, 'click', (event) => {
                if (event.target.classList.contains('toggle-color-mode-btn')) {
                    const iconId = event.target.dataset.iconId;
                    window.IconsView.handleToggleColorMode(iconId, event.target);
                    return;
                }
                window.IconsView.handleIconCardClick(event);
            });
            
            // 绑定颜色选择器变化
            window.IconsView.addEventHandler(grid, 'change', (event) => {
                if (event.target.classList.contains('icon-color-input')) {
                    window.IconsView.handleColorChange(event);
                }
            });

            // 绑定输入验证
            const nameInput = document.getElementById('icon-name');
            const svgInput = document.getElementById('icon-svg');

            if (nameInput) {
                window.IconsView.addEventHandler(nameInput, 'input', () => {
                    window.IconsView.validateIconNameInput(nameInput);
                });
            }

            if (svgInput) {
                window.IconsView.addEventHandler(svgInput, 'input', () => {
                    window.IconsView.validateSvgInput(svgInput);
                    window.IconsView.autoResizeTextarea(svgInput);
                });
            }

            window.Logger.debug('Icons view events bound');
        } catch (error) {
            window.Logger.error('Failed to bind icons view events', error);
        }
    },

    /**
     * Add event handler with proper cleanup
     */
    addEventHandler: (element, event, handler) => {
        if (element && typeof handler === 'function') {
            element.addEventListener(event, handler);
        }
    },

    /**
     * Handle adding a new icon
     */
    handleAddIcon: () => {
        try {
            const nameInput = document.getElementById('icon-name');
            const svgInput = document.getElementById('icon-svg');
            
            if (!nameInput || !svgInput) {
                throw new Error('表单输入元素未找到');
            }

            const name = nameInput.value.trim();
            const svg = svgInput.value.trim();
            
            // 验证输入
            if (!name) {
                throw new Error('请填写图标名称');
            }
            
            if (!svg) {
                throw new Error('请填写 SVG 代码');
            }

            if (name.length > 50) {
                throw new Error('图标名称不能超过50个字符');
            }

            // 检查名称重复
            const existingIcons = window.iconService.getIcons();
            if (existingIcons.some(icon => icon.name === name)) {
                throw new Error('图标名称已存在，请使用其他名称');
            }

            // 验证SVG格式
            if (!window.IconsView.isValidSvg(svg)) {
                throw new Error('SVG 代码格式不正确，请检查语法');
            }

            // 添加图标
            window.iconService.addIcon(name, svg);
            window.Logger.debug('图标添加成功:', name);
                
            // 清空表单并重新渲染
            nameInput.value = '';
            svgInput.value = '';
            nameInput.classList.remove('error');
            svgInput.classList.remove('error');
            window.IconsView.autoResizeTextarea(svgInput);
            window.IconsView.render();
            
            // 显示成功消息
            window.IconsView.showSuccess(`图标 "${name}" 添加成功！`);
            
        } catch (error) {
            window.Logger.error('添加图标失败:', error);
            window.IconsView.showError(error.message || '添加图标失败');

            // 高亮错误输入
            const nameInput = document.getElementById('icon-name');
            const svgInput = document.getElementById('icon-svg');
            
            if (error.message.includes('名称')) {
                nameInput?.classList.add('error');
            }
            if (error.message.includes('SVG')) {
                svgInput?.classList.add('error');
            }
        }
    },

    /**
     * Handle icon card click events
     */
    handleIconCardClick: (event) => {
        try {
            event.stopPropagation();
            const iconCard = event.target.closest('.icon-card');
            if (!iconCard) return;
            
            const iconId = iconCard.dataset.iconId;
            if (!iconId) return;
            
            // 处理颜色选择器按钮
            if (event.target.closest('.color-picker-btn')) {
                const colorInput = iconCard.querySelector('.icon-color-input');
                if (colorInput) {
                    colorInput.click();
                }
            }
            // 处理删除图标按钮
            else if (event.target.closest('.delete-icon-btn')) {
                window.IconsView.handleDeleteIcon(iconId);
            }
        } catch (error) {
            window.Logger.error('处理图标卡片点击失败', error);
            window.IconsView.showError('操作失败，请重试');
        }
    },

    /**
     * Handle color change for an icon
     */
    handleColorChange: (event) => {
        try {
            const colorInput = event.target;
            const iconId = colorInput.dataset.iconId;
            const newColor = colorInput.value;
            
            if (!iconId || !newColor) {
                throw new Error('缺少图标ID或颜色值');
            }

            window.Logger.debug(`Updating color for icon ${iconId} to ${newColor}`);
            
            // 使用新的颜色处理逻辑
            const icon = window.iconService.getIcon(iconId);
            const mode = icon && icon.colorMode ? icon.colorMode : 'main';
            const updatedIcon = window.iconService.updateIconColor(iconId, newColor, mode);
            
            if (updatedIcon) {
                // 重新渲染图标网格以显示更新后的颜色
                window.IconsView.render();
                window.IconsView.showSuccess(`图标颜色已更新为 ${newColor}`);
                window.Logger.debug('图标颜色更新成功');
            } else {
                throw new Error('图标颜色更新失败');
            }
        } catch (error) {
            window.Logger.error('更新图标颜色失败:', error);
            window.IconsView.showError(error.message || '更新图标颜色失败');
        }
    },

    /**
     * Handle toggling color mode for an icon
     */
    handleToggleColorMode: (iconId, btn) => {
        try {
            const icon = window.iconService.getIcon(iconId);
            if (!icon) {
                throw new Error('图标未找到');
            }
            
            const newMode = icon.colorMode === 'fill' ? 'main' : 'fill';
            
            // 更新颜色模式
            const updatedIcon = window.iconService.updateIcon(iconId, { colorMode: newMode });
            
            if (updatedIcon) {
                // 重新渲染，按钮文本会自动切换
                window.IconsView.render();
                window.IconsView.showSuccess(`已切换为${newMode === 'fill' ? '内部改色' : '主线条改色'}模式`);
            } else {
                throw new Error('切换颜色模式失败');
            }
        } catch (error) {
            window.Logger.error('切换颜色模式失败:', error);
            window.IconsView.showError(error.message || '切换颜色模式失败');
        }
    },

    /**
     * Handle deleting an icon
     */
    handleDeleteIcon: (iconId) => {
        try {
            const icon = window.iconService.getIcon(iconId);
            if (!icon) {
                throw new Error('图标未找到');
            }

            if (!confirm(`确定要删除图标 "${icon.name}" 吗？此操作不可撤销。`)) {
                return;
            }

            window.iconService.deleteIcon(iconId);
            window.IconsView.render();
            window.IconsView.showSuccess(`图标 "${icon.name}" 已删除`);
            window.Logger.debug('图标删除成功:', icon.name);
        } catch (error) {
            window.Logger.error('删除图标失败:', error);
            window.IconsView.showError(error.message || '删除图标失败');
        }
    },

    /**
     * Validate icon name input
     */
    validateIconNameInput: (input) => {
        const value = input.value.trim();
        
        // 移除之前的错误状态
        input.classList.remove('error');
        
        // 实时验证
        if (value.length > 50) {
            input.classList.add('error');
            return;
        }
        
        // 检查重复名称
        if (value) {
            const existingIcons = window.iconService.getIcons();
            if (existingIcons.some(icon => icon.name === value)) {
                input.classList.add('error');
            }
        }
    },

    /**
     * Validate SVG input
     */
    validateSvgInput: (input) => {
        const value = input.value.trim();
        
        // 移除之前的错误状态
        input.classList.remove('error');
        
        // 基本SVG验证
        if (value && !window.IconsView.isValidSvg(value)) {
            input.classList.add('error');
        }
    },

    /**
     * Auto-resize textarea based on content
     */
    autoResizeTextarea: (textarea) => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(100, textarea.scrollHeight) + 'px';
    },

    /**
     * Validate SVG format
     */
    isValidSvg: (svgString) => {
        try {
            // 基本检查
            if (!svgString.trim()) return false;
            if (!svgString.includes('<svg')) return false;
            if (!svgString.includes('</svg>')) return false;
            
            // 尝试解析为XML
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgString, 'image/svg+xml');
            const svgElement = doc.querySelector('svg');
            
            return svgElement !== null;
        } catch (error) {
            return false;
        }
    },

    /**
     * Show success message
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
     * Show error message
     */
    showError: (message) => {
        alert(message);
    }
}; 