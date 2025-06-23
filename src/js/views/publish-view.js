import { Storage } from '../utils/storage.js';

export class PublishView {
    constructor(showMessageCallback) {
        if (typeof showMessageCallback !== 'function') {
            throw new Error('PublishView需要一个有效的回调函数来显示消息');
        }
        this.showMessage = showMessageCallback;
        this.selectedItems = new Set();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPublishedItems();
    }

    setupEventListeners() {
        document.getElementById('export-all')?.addEventListener('click', () => {
            this.exportAllItems();
        });
        document.getElementById('publish-list')?.addEventListener('click', (e) => {
            this.handlePublishListClick(e);
        });
        document.getElementById('publish-list')?.addEventListener('change', (e) => {
            this.handleCheckboxChange(e);
        });
    }

    loadPublishedItems() {
        const publishedItems = Storage.loadJSON('qulome_published', []);
        this.renderPublishList(publishedItems);
    }

    renderPublishList(items) {
        const publishList = document.getElementById('publish-list');
        if (!publishList) return;

        if (items.length === 0) {
            publishList.innerHTML = `<div class="empty-state">
                <i class="fas fa-rocket" style="font-size: 48px; color: #ccc; margin-bottom: 16px;"></i>
                <p style="color: #666; margin: 0;">还没有发布的内容</p>
                <p style="color: #999; font-size: 14px; margin: 8px 0 0 0;">从草稿仓发布内容后，会显示在这里</p>
            </div>`;
            return;
        }

        // 清空选中状态
        this.selectedItems.clear();

        publishList.innerHTML = `<div class="publish-header">
            <div class="publish-controls">
                <label class="checkbox-container">
                    <input type="checkbox" id="select-all-publish"><span class="checkmark"></span>全选 (${items.length})
                </label>
                <div class="selected-count" id="publish-selected-count" style="display: none;">
                    已选择 <span id="publish-selected-number">0</span> 项
                </div>
            </div>
            <div class="publish-actions" id="publish-actions" style="display: none;">
                <button class="btn btn-sm btn-secondary" id="batch-delete-publish"><i class="fas fa-trash"></i>删除选中</button>
                <button class="btn btn-sm btn-primary" id="batch-export-publish"><i class="fas fa-download"></i>导出选中</button>
            </div>
        </div>
        <div class="publish-grid">${items.map(item => this.createPublishCard(item)).join('')}</div>`;

        // 设置全选复选框事件
        document.getElementById('select-all-publish')?.addEventListener('change', (e) => {
            this.handleSelectAll(e.target.checked, items);
        });

        // 设置批量操作按钮事件
        document.getElementById('batch-delete-publish')?.addEventListener('click', () => {
            this.batchDeleteItems();
        });

        document.getElementById('batch-export-publish')?.addEventListener('click', () => {
            this.batchExportItems();
        });
    }

    createPublishCard(item) {
        const publishedDate = new Date(item.publishedAt).toLocaleString();
        const contentPreview = this.extractTextContent(item.content).substring(0, 120) + '...';
        
        return `<div class="publish-card" data-item-id="${item.id}">
            <div class="publish-card-header">
                <label class="checkbox-container">
                    <input type="checkbox" class="publish-checkbox" data-item-id="${item.id}">
                    <span class="checkmark"></span>
                </label>
                <div class="publish-title">${item.title}</div>
                <div class="publish-menu">
                    <button class="btn-icon" data-action="preview" data-item-id="${item.id}" title="预览"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" data-action="delete" data-item-id="${item.id}" title="删除"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="publish-content-preview">${contentPreview}</div>
            <div class="publish-meta">
                <span class="publish-date"><i class="fas fa-calendar"></i>${publishedDate}</span>
                <span class="publish-size">${this.formatFileSize(item.content.length)}</span>
                <span class="publish-status"><i class="fas fa-check-circle" style="color: #28a745;"></i>已发布</span>
            </div>
            <div class="publish-actions">
                <button class="btn btn-sm btn-secondary" data-action="preview" data-item-id="${item.id}"><i class="fas fa-eye"></i>预览</button>
                <button class="btn btn-sm btn-primary" data-action="export" data-item-id="${item.id}"><i class="fas fa-download"></i>导出HTML</button>
                <button class="btn btn-sm btn-success" data-action="copy-wechat" data-item-id="${item.id}"><i class="fab fa-weixin"></i>复制微信格式</button>
            </div>
        </div>`;
    }

    extractTextContent(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / (1024 * 1024)) + ' MB';
    }

    handlePublishListClick(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const itemId = button.dataset.itemId;

        switch (action) {
            case 'preview':
                this.previewItem(itemId);
                break;
            case 'export':
                this.exportItem(itemId);
                break;
            case 'copy-wechat':
                this.copyWechatFormat(itemId);
                break;
            case 'delete':
                this.deleteItem(itemId);
                break;
        }
    }

    handleCheckboxChange(event) {
        if (event.target.classList.contains('publish-checkbox')) {
            const itemId = event.target.dataset.itemId;
            if (event.target.checked) {
                this.selectedItems.add(itemId);
            } else {
                this.selectedItems.delete(itemId);
            }
            this.updateSelectionUI();
        }
    }

    handleSelectAll(checked, items) {
        const checkboxes = document.querySelectorAll('.publish-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const itemId = checkbox.dataset.itemId;
            if (checked) {
                this.selectedItems.add(itemId);
            } else {
                this.selectedItems.delete(itemId);
            }
        });
        this.updateSelectionUI();
    }

    updateSelectionUI() {
        const selectedCount = this.selectedItems.size;
        const selectedCountEl = document.getElementById('publish-selected-count');
        const selectedNumberEl = document.getElementById('publish-selected-number');
        const actionsEl = document.getElementById('publish-actions');

        if (selectedCount > 0) {
            selectedCountEl.style.display = 'block';
            actionsEl.style.display = 'flex';
            selectedNumberEl.textContent = selectedCount;
        } else {
            selectedCountEl.style.display = 'none';
            actionsEl.style.display = 'none';
        }

        // 更新全选复选框状态
        const selectAllCheckbox = document.getElementById('select-all-publish');
        const totalCheckboxes = document.querySelectorAll('.publish-checkbox').length;
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = selectedCount === totalCheckboxes && totalCheckboxes > 0;
            selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalCheckboxes;
        }
    }

    previewItem(itemId) {
        const items = Storage.loadJSON('qulome_published', []);
        const item = items.find(i => i.id === itemId);
        
        if (!item) {
            this.showMessage('发布项不存在', 'error');
            return;
        }

        // 创建预览窗口
        this.showPreviewModal(item);
    }

    showPreviewModal(item) {
        const modal = this.createModal('preview-modal', item.title, item.content, [
            { text: '关闭', class: 'btn-secondary', action: 'close' },
            { text: '导出HTML', class: 'btn-primary', action: 'export', data: item.id }
        ]);
        
        // 导出按钮事件
        modal.querySelector('[data-action="export"]')?.addEventListener('click', (e) => {
            this.exportItem(e.target.dataset.data);
            modal.remove();
        });
    }

    exportItem(itemId) {
        const items = Storage.loadJSON('qulome_published', []);
        const item = items.find(i => i.id === itemId);
        
        if (!item) {
            this.showMessage('发布项不存在', 'error');
            return;
        }

        const htmlContent = this.generateExportHTML(item);
        this.downloadHTML(htmlContent, `${item.title}.html`);
        this.showMessage(`已导出: ${item.title}`, 'success');
    }

    /**
     * 复制微信格式
     * @param {string} itemId - 发布项ID
     */
    copyWechatFormat(itemId) {
        const items = Storage.loadJSON('qulome_published', []);
        const item = items.find(i => i.id === itemId);
        
        if (!item) {
            this.showMessage('发布项不存在', 'error');
            return;
        }

        // 转换图标标记为实际SVG
        const wechatContent = this.convertIconMarksToSVG(item.content);
        const wechatHTML = this.generateWechatHTML(item, wechatContent);
        
        this.showCopyModal(wechatHTML, `复制微信格式 - ${item.title}`);
    }

    /**
     * 将图标标记转换为实际SVG代码
     * @param {string} content - 包含图标标记的内容
     * @returns {string} 转换后的内容
     */
    convertIconMarksToSVG(content) {
        // 加载图标库数据
        const icons = Storage.loadJSON('qulome_icons', []);
        
        // 创建图标名称到SVG的映射
        const iconMap = {};
        icons.forEach(icon => {
            iconMap[icon.name] = icon.svg;
        });

        // 替换所有图标标记
        return content.replace(/\[icon:([^\]]+)\]/g, (match, iconName) => {
            const svg = iconMap[iconName];
            if (svg) {
                // 如果是Font Awesome图标，保持原样
                if (svg.includes('<i class="fas')) {
                    return svg;
                }
                // 如果是SVG代码，确保适合微信编辑器
                if (svg.includes('<svg')) {
                    return this.optimizeSVGForWechat(svg);
                }
                return svg;
            }
            // 如果找不到图标，返回原始标记
            return match;
        });
    }

    /**
     * 优化SVG代码以适应微信编辑器
     * @param {string} svg - SVG代码
     * @returns {string} 优化后的SVG代码
     */
    optimizeSVGForWechat(svg) {
        // 确保SVG有固定尺寸
        if (!svg.includes('width=') && !svg.includes('height=')) {
            svg = svg.replace('<svg', '<svg width="20" height="20"');
        }
        
        // 添加内联样式以确保显示正常
        if (!svg.includes('style=')) {
            svg = svg.replace('<svg', '<svg style="display: inline-block; vertical-align: middle;"');
        }
        
        return svg;
    }

    /**
     * 生成微信编辑器兼容的HTML
     * @param {Object} item - 发布项对象
     * @param {string} content - 转换后的内容
     * @returns {string} 微信兼容的HTML
     */
    generateWechatHTML(item, content) {
        // 应用微信编辑器兼容的样式
        const styledContent = this.applyWechatStyles(content);
        
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${item.title}</title>
    <style>
        /* 微信编辑器兼容样式 */
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 100%;
            margin: 0;
            padding: 16px;
            background: #fff;
        }
        
        h1, h2, h3, h4, h5, h6 {
            margin: 24px 0 16px 0;
            font-weight: 600;
            line-height: 1.4;
        }
        
        h1 { font-size: 24px; color: #1a1a1a; }
        h2 { font-size: 20px; color: #2a2a2a; }
        h3 { font-size: 18px; color: #3a3a3a; }
        
        p {
            margin: 16px 0;
            font-size: 16px;
            line-height: 1.6;
        }
        
        a {
            color: #576b95;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        strong {
            font-weight: 600;
            color: #1a1a1a;
        }
        
        em {
            font-style: italic;
            color: #555;
        }
        
        code {
            background: #f6f8fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 14px;
            color: #e83e8c;
        }
        
        blockquote {
            margin: 16px 0;
            padding: 12px 16px;
            border-left: 4px solid #dfe2e5;
            background: #f6f8fa;
            color: #6a737d;
        }
        
        ul, ol {
            margin: 16px 0;
            padding-left: 24px;
        }
        
        li {
            margin: 8px 0;
        }
        
        /* 图标样式 */
        .icon {
            display: inline-block;
            vertical-align: middle;
            margin: 0 2px;
        }
        
        /* 微信编辑器特殊处理 */
        img {
            max-width: 100%;
            height: auto;
        }
    </style>
</head>
<body>
    ${styledContent}
    
    <!-- 生成信息 -->
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
        由 Qulome 生成 • ${new Date().toLocaleString()}
    </div>
</body>
</html>`;
    }

    /**
     * 应用微信编辑器兼容样式
     * @param {string} content - HTML内容
     * @returns {string} 应用样式后的内容
     */
    applyWechatStyles(content) {
        // 为图标添加CSS类
        content = content.replace(/(<i class="fas[^>]*>)/g, '<span class="icon">$1</span>');
        content = content.replace(/(<svg[^>]*>.*?<\/svg>)/g, '<span class="icon">$1</span>');
        
        // 确保段落有正确的样式
        if (!content.includes('<p>') && content.trim()) {
            // 如果内容没有段落标签，包装在段落中
            content = content.split('\n').filter(line => line.trim()).map(line => `<p>${line}</p>`).join('');
        }
        
        return content;
    }

    createModal(id, title, content, buttons = []) {
        const buttonsHTML = buttons.map(btn => 
            `<button class="btn ${btn.class}" data-action="${btn.action}" ${btn.data ? `data-data="${btn.data}"` : ''}>${btn.text}</button>`
        ).join('');

        const modalHTML = `
            <div class="modal-overlay" id="${id}">
                <div class="modal-content ${id.includes('preview') ? 'preview-modal' : ''}">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" data-action="close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">${content}</div>
                    <div class="modal-footer">${buttonsHTML}</div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById(id);
        
        // 设置关闭事件
        modal.querySelectorAll('[data-action="close"]').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        return modal;
    }

    showCopyModal(content, title) {
        const bodyContent = `
            <p style="margin-bottom: 12px; color: #666;">请手动复制以下内容到微信编辑器：</p>
            <textarea class="copy-textarea" readonly>${content}</textarea>
        `;
        
        const modal = this.createModal('copy-modal', `复制微信格式 - ${title}`, bodyContent, [
            { text: '关闭', class: 'btn-secondary', action: 'close' },
            { text: '全选', class: 'btn-primary', action: 'select' }
        ]);

        // 全选按钮事件
        modal.querySelector('[data-action="select"]')?.addEventListener('click', () => {
            modal.querySelector('.copy-textarea').select();
        });
    }

    deleteItem(itemId) {
        const items = Storage.loadJSON('qulome_published', []);
        const itemIndex = items.findIndex(i => i.id === itemId);
        
        if (itemIndex === -1) {
            this.showMessage('发布项不存在', 'error');
            return;
        }

        const item = items[itemIndex];
        
        if (!confirm(`确定要删除发布项 "${item.title}" 吗？`)) {
            return;
        }

        items.splice(itemIndex, 1);
        const result = Storage.saveJSON('qulome_published', items);
        
        if (result.success) {
            this.showMessage('发布项已删除', 'success');
            this.loadPublishedItems();
        } else {
            this.showMessage(`删除失败: ${result.error}`, 'error');
        }
    }

    performBatchAction(action, items) {
        if (action === 'delete') {
            const updatedItems = Storage.loadJSON('qulome_published', []).filter(item => !this.selectedItems.has(item.id));
            const result = Storage.saveJSON('qulome_published', updatedItems);
            if (result.success) {
                this.showMessage(`已删除 ${this.selectedItems.size} 个发布项`, 'success');
                this.selectedItems.clear();
                this.loadPublishedItems();
            } else {
                this.showMessage(`批量删除失败: ${result.error}`, 'error');
            }
        } else if (action === 'export') {
            items.forEach(item => {
                const htmlContent = this.generateExportHTML(item);
                this.downloadHTML(htmlContent, `${item.title}.html`);
            });
            this.showMessage(`已导出 ${items.length} 个发布项`, 'success');
        }
    }

    batchDeleteItems() {
        if (this.selectedItems.size === 0) {
            this.showMessage('请先选择要删除的发布项', 'warning');
            return;
        }
        if (confirm(`确定要删除选中的 ${this.selectedItems.size} 个发布项吗？`)) {
            this.performBatchAction('delete');
        }
    }

    batchExportItems() {
        if (this.selectedItems.size === 0) {
            this.showMessage('请先选择要导出的发布项', 'warning');
            return;
        }
        const items = Storage.loadJSON('qulome_published', []);
        const selectedItemsList = items.filter(item => this.selectedItems.has(item.id));
        this.performBatchAction('export', selectedItemsList);
    }

    exportAllItems() {
        const items = Storage.loadJSON('qulome_published', []);
        if (items.length === 0) {
            this.showMessage('没有可导出的发布项', 'warning');
            return;
        }
        if (confirm(`确定要导出所有 ${items.length} 个发布项吗？`)) {
            this.performBatchAction('export', items);
        }
    }

    generateExportHTML(item) {
        const css = `body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;max-width:800px;margin:0 auto;padding:20px;background:#fff;color:#333}h1,h2,h3,h4,h5,h6{margin:24px 0 16px;font-weight:600}p{margin-bottom:16px}a{color:#576b95;text-decoration:none}a:hover{text-decoration:underline}code{background:#f6f8fa;padding:2px 6px;border-radius:3px;font-family:'SFMono-Regular',Consolas,monospace}.export-meta{border-top:1px solid #eee;margin-top:40px;padding-top:20px;font-size:14px;color:#666}`;
        
        return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${item.title}</title><style>${css}</style></head><body><article>${item.content}</article><div class="export-meta"><p>发布时间: ${new Date(item.publishedAt).toLocaleString()}</p><p>由 Qulome 微信文章排版工具生成</p></div></body></html>`;
    }

    downloadHTML(content, filename) {
        const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    refresh() {
        this.loadPublishedItems();
    }

    getSelectedCount() {
        return this.selectedItems.size;
    }
} 