/**
 * Icons View Module
 * 
 * This module manages all the logic for the Icon Library view, including:
 * - Rendering the grid of saved icons
 * - Handling manual SVG input via form
 * - Handling icon deletion and copying
 * - Input validation and error handling
 * - Event binding management
 */
window.IconsView = {
    // State management
    isInitialized: false,
    eventHandlers: new Map(),

    /**
     * Initialize the icons view
     */
    init: () => {
        try {
            if (window.IconsView.isInitialized) {
                window.Logger.debug('IconsView already initialized, refreshing...');
                window.IconsView.render();
                return;
            }

        window.IconsView.render();
        window.IconsView.bindEvents();
            window.IconsView.isInitialized = true;
            window.Logger.debug('IconsView initialized successfully');
        } catch (error) {
            window.Logger.error('Failed to initialize IconsView', error);
            window.IconsView.showError('图标视图初始化失败，请刷新页面重试');
        }
    },

    /**
     * Clean up event handlers and resources
     */
    cleanup: () => {
        window.IconsView.eventHandlers.forEach((handler, element) => {
            if (element && typeof element.removeEventListener === 'function') {
                element.removeEventListener(handler.event, handler.callback);
            }
        });
        window.IconsView.eventHandlers.clear();
        window.IconsView.isInitialized = false;
        window.Logger.debug('IconsView cleaned up');
    },

    /**
     * Add event handler with tracking for cleanup
     */
    addEventHandler: (element, event, callback) => {
        if (!element) return;
        
        // Remove existing handler if any
        const existingHandler = window.IconsView.eventHandlers.get(element);
        if (existingHandler && existingHandler.event === event) {
            element.removeEventListener(event, existingHandler.callback);
        }

        // Add new handler
        element.addEventListener(event, callback);
        window.IconsView.eventHandlers.set(element, { event, callback });
    },

    /**
     * Render the icons grid
     */
    render: () => {
        try {
        const icons = window.iconService.getIcons();
        const main = document.querySelector('.icons-main');
        const sidebar = document.querySelector('.icons-sidebar');
        const grid = document.getElementById('icons-grid');
        const form = document.getElementById('add-icon-form');

        // 新增：免费图标库按钮数据
        const iconLibs = [
            { name: 'Tabler Icons', url: 'https://tabler.io/icons' },
            { name: 'Lucide', url: 'https://lucide.dev/icons' },
            { name: 'Heroicons', url: 'https://heroicons.com/' },
            { name: 'Feather', url: 'https://feathericons.com/' },
            { name: 'Remix Icon', url: 'https://remixicon.com/' },
            { name: 'Material Symbols', url: 'https://fonts.google.com/icons' },
            { name: 'Iconoir', url: 'https://iconoir.com/' },
        ];

        // 渲染免费图标库按钮
        const iconLibBtns = `<div class="icon-libs-bar">
            ${iconLibs.map(lib => `<button class="btn btn-outline-primary icon-lib-btn" onclick="window.open('${lib.url}','_blank')">${lib.name}</button>`).join('')}
        </div>`;

        // 渲染表单和按钮区域
        if (sidebar && form) {
            sidebar.innerHTML = '';
            sidebar.appendChild(form);
            sidebar.innerHTML += iconLibBtns;
        }

        // 渲染已存图标
        if (!grid) {
                throw new Error('图标网格容器 #icons-grid 未找到');
            }
        if (icons.length === 0) {
            grid.innerHTML = '<p class="empty-state">还没有图标，添加第一个图标吧！</p>';
            return;
        }
        grid.innerHTML = icons.map(icon => `
            <div class="icon-card" data-icon-id="${icon.id}">
                    <button class="icon-card-delete delete-icon-btn" title="删除图标">&times;</button>
                    <div class="icon-preview" title="${window.IconsView.escapeHtml(icon.name)}">
                        ${(icon.svg || icon.originalSvg) ? (icon.svg || icon.originalSvg) : ''}
                    </div>
                    <p class="icon-name">${window.IconsView.escapeHtml(icon.name)}</p>
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
        // 强制刷新所有input[type=color]的value，彻底消除历史污染
        grid.querySelectorAll('.icon-color-input').forEach(input => {
            const iconId = input.dataset.iconId;
            const icon = icons.find(i => i.id === iconId);
            if (icon) input.value = icon.color || '#222';
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

            // Bind form submission
            window.IconsView.addEventHandler(form, 'submit', (event) => {
                event.preventDefault();
                window.IconsView.handleAddIcon();
            });

            // Bind icon operations (copy, edit, delete) using event delegation
            window.IconsView.addEventHandler(grid, 'click', (event) => {
                if (event.target.classList.contains('toggle-color-mode-btn')) {
                    const iconId = event.target.dataset.iconId;
                    window.IconsView.handleToggleColorMode(iconId, event.target);
            return;
        }
                window.IconsView.handleIconCardClick(event);
            });
            
            // Bind color picker changes
            window.IconsView.addEventHandler(grid, 'change', (event) => {
                if (event.target.classList.contains('icon-color-input')) {
                    window.IconsView.handleColorChange(event);
                }
            });

            // Bind input validation
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
                });
                
                // Auto-resize textarea
                window.IconsView.addEventHandler(svgInput, 'input', () => {
                    window.IconsView.autoResizeTextarea(svgInput);
                });
            }

            window.Logger.debug('IconsView events bound successfully');
        } catch (error) {
            window.Logger.error('Failed to bind events', error);
            window.IconsView.showError('事件绑定失败');
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
            
            // Validate inputs
            if (!name) {
                throw new Error('请填写图标名称');
            }
            
            if (!svg) {
                throw new Error('请填写 SVG 代码');
            }

            if (name.length > 50) {
                throw new Error('图标名称不能超过50个字符');
            }

            // Check for duplicate names
            const existingIcons = window.iconService.getIcons();
            if (existingIcons.some(icon => icon.name === name)) {
                throw new Error('图标名称已存在，请使用其他名称');
            }

            // Validate SVG format
            if (!window.IconsView.isValidSvg(svg)) {
                throw new Error('SVG 代码格式不正确，请检查语法');
            }

            // Add the icon
                window.iconService.addIcon(name, svg);
                window.Logger.debug('图标添加成功:', name);
                
            // Clear form and re-render
                nameInput.value = '';
                svgInput.value = '';
            nameInput.classList.remove('error');
            svgInput.classList.remove('error');
            window.IconsView.autoResizeTextarea(svgInput);
                window.IconsView.render();
            
            // Show success message
            window.IconsView.showSuccess(`图标 "${name}" 添加成功！`);
            
            } catch (error) {
                window.Logger.error('添加图标失败:', error);
            window.IconsView.showError(error.message || '添加图标失败');

            // Highlight error inputs
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
            
            // Handle copy SVG button
            if (event.target.closest('.copy-svg-btn')) {
                window.IconsView.handleCopyIcon(iconId);
            }
            // Handle color picker button
            else if (event.target.closest('.color-picker-btn')) {
                const colorInput = iconCard.querySelector('.icon-color-input');
                if (colorInput) {
                    colorInput.click();
                }
            }
            // Handle delete icon button
            else if (event.target.closest('.delete-icon-btn')) {
                window.IconsView.handleDeleteIcon(iconId);
            }
        } catch (error) {
            window.Logger.error('处理图标卡片点击失败', error);
            window.IconsView.showError('操作失败，请重试');
        }
    },

    /**
     * Handle copying icon SVG
     */
    handleCopyIcon: async (iconId) => {
        try {
            const icon = window.iconService.getIcon(iconId);
            if (!icon) {
                throw new Error('图标未找到');
            }

            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(icon.svg);
                window.IconsView.showSuccess(`已复制图标 "${icon.name}" 的 SVG 代码！`);
            } else {
                // Fallback for older browsers
                window.IconsView.fallbackCopyToClipboard(icon.svg);
                window.IconsView.showSuccess(`已复制图标 "${icon.name}" 的 SVG 代码！`);
            }
        } catch (error) {
            window.Logger.error('复制 SVG 失败', error);
            window.IconsView.showError('复制失败，请手动复制');
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
            
            // 使用 icon-service 中的新颜色处理逻辑
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
            // Basic checks
            if (!svgString.trim()) return false;
            if (!svgString.includes('<svg')) return false;
            if (!svgString.includes('</svg>')) return false;
            
            // Try to parse as XML
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgString, 'image/svg+xml');
            const svgElement = doc.querySelector('svg');
            
            return svgElement !== null;
        } catch (error) {
            return false;
        }
    },

    /**
     * Fallback copy to clipboard for older browsers
     */
    fallbackCopyToClipboard: (text) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            throw new Error('复制操作不支持');
        } finally {
            document.body.removeChild(textArea);
        }
    },

    /**
     * HTML escape to prevent XSS
     */
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
        
        // Remove previous error state
        input.classList.remove('error');
        
        // Real-time validation
        if (value.length > 50) {
            input.classList.add('error');
            return;
    }
        
        // Check for duplicate names
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
        
        // Remove previous error state
        input.classList.remove('error');
        
        // Basic SVG validation
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
            // Basic checks
            if (!svgString.trim()) return false;
            if (!svgString.includes('<svg')) return false;
            if (!svgString.includes('</svg>')) return false;
            
            // Try to parse as XML
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgString, 'image/svg+xml');
            const svgElement = doc.querySelector('svg');
            
            return svgElement !== null;
        } catch (error) {
            return false;
        }
    },

    /**
     * Handle toggling color mode for an icon
     */
    handleToggleColorMode: (iconId, btn) => {
        const icon = window.iconService.getIcon(iconId);
        if (!icon) return;
        const newMode = icon.colorMode === 'fill' ? 'main' : 'fill';
        // 只更新 colorMode，不改色值
        const icons = window.iconService.getIcons();
        const idx = icons.findIndex(i => i.id === iconId);
        if (idx > -1) {
            icons[idx].colorMode = newMode;
            window.localStorage.setItem('qulome_icons', JSON.stringify(icons));
        }
        // 重新渲染，按钮文本会自动切换
        window.IconsView.render();
        window.IconsView.showSuccess(`已切换为${newMode === 'fill' ? '内部改色' : '主线条改色'}模式`);
    },
}; 