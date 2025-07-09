/**
 * Data Manager - 数据管理器
 * 
 * 提供数据的导出和导入功能，支持多种格式
 */

window.DataManager = {
    // 支持的导出格式
    exportFormats: {
        JSON: 'json',
        MARKDOWN: 'md',
        HTML: 'html',
        TXT: 'txt'
    },

    /**
     * 导出所有数据
     * @param {string} format - 导出格式
     * @returns {Promise<boolean>} 导出是否成功
     */
    async exportAllData(format = 'json') {
        try {
            const data = this.collectAllData();
            const filename = this.generateFilename('qulome-backup', format);
            
            switch (format.toLowerCase()) {
                case 'json':
                    await this.downloadJSON(data, filename);
                    break;
                case 'md':
                    await this.downloadMarkdown(data, filename);
                    break;
                case 'html':
                    await this.downloadHTML(data, filename);
                    break;
                case 'txt':
                    await this.downloadText(data, filename);
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            
            window.Logger.info(`Data exported successfully as ${format}`);
            return true;
        } catch (error) {
            window.Logger.error('Failed to export data', error);
            window.ErrorHandler.handle(error, 'DataManager.exportAllData');
            return false;
        }
    },

    /**
     * 导入数据
     * @param {File} file - 要导入的文件
     * @returns {Promise<boolean>} 导入是否成功
     */
    async importData(file) {
        try {
            if (!file) {
                throw new Error('No file provided');
            }

            const fileExtension = file.name.split('.').pop().toLowerCase();
            const fileContent = await this.readFile(file);
            
            let importedData;
            
            switch (fileExtension) {
                case 'json':
                    importedData = JSON.parse(fileContent);
                    break;
                case 'md':
                case 'markdown':
                    importedData = this.parseMarkdownFile(fileContent, file.name);
                    break;
                default:
                    throw new Error(`Unsupported import format: ${fileExtension}`);
            }
            
            await this.mergeImportedData(importedData);
            
            window.Logger.info(`Data imported successfully from ${file.name}`);
            return true;
        } catch (error) {
            window.Logger.error('Failed to import data', error);
            window.ErrorHandler.handle(error, 'DataManager.importData');
            return false;
        }
    },

    /**
     * 收集所有应用数据
     * @returns {Object} 所有数据的集合
     */
    collectAllData() {
        const data = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: window.QulomeConfig?.app?.version || '1.0.0',
                appName: 'Qulome'
            },
            themes: [],
            drafts: [],
            published: [],
            icons: [],
            settings: {}
        };

        try {
            // 收集主题数据
            if (window.themeService) {
                data.themes = window.themeService.getThemes() || [];
                data.activeThemeId = window.themeService.getActiveTheme()?.id;
            }

            // 收集草稿数据
            if (window.draftService) {
                data.drafts = window.draftService.getDrafts() || [];
                data.currentDraftId = window.draftService.getCurrentDraftId();
            }

            // 收集已发布数据
            if (window.publishService) {
                data.published = window.publishService.getPublished() || [];
            }

            // 收集图标数据
            if (window.iconService) {
                data.icons = window.iconService.getIcons() || [];
            }

            // 收集设置数据
            const storageKeys = window.QulomeConfig?.storage?.keys || {};
            Object.keys(storageKeys).forEach(key => {
                const storageKey = storageKeys[key];
                const value = localStorage.getItem(storageKey);
                if (value) {
                    try {
                        data.settings[key] = JSON.parse(value);
                    } catch {
                        data.settings[key] = value;
                    }
                }
            });

        } catch (error) {
            window.Logger.error('Error collecting data', error);
        }

        return data;
    },

    /**
     * 合并导入的数据
     * @param {Object} importedData - 导入的数据
     */
    async mergeImportedData(importedData) {
        const confirmOverwrite = confirm(\n            '导入数据将会覆盖现有数据。是否继续？\\n' +\n            '建议先导出当前数据作为备份。'\n        );\n        \n        if (!confirmOverwrite) {\n            throw new Error('Import cancelled by user');\n        }\n\n        try {\n            // 导入主题\n            if (importedData.themes && window.themeService) {\n                importedData.themes.forEach(theme => {\n                    window.themeService.saveTheme(theme);\n                });\n                \n                if (importedData.activeThemeId) {\n                    window.themeService.setActiveTheme(importedData.activeThemeId);\n                }\n            }\n\n            // 导入草稿\n            if (importedData.drafts && window.draftService) {\n                importedData.drafts.forEach(draft => {\n                    window.draftService.saveDraft(draft);\n                });\n                \n                if (importedData.currentDraftId) {\n                    window.draftService.setCurrentDraftId(importedData.currentDraftId);\n                }\n            }\n\n            // 导入已发布内容\n            if (importedData.published && window.publishService) {\n                importedData.published.forEach(item => {\n                    window.publishService.addToPublished(item);\n                });\n            }\n\n            // 导入图标\n            if (importedData.icons && window.iconService) {\n                importedData.icons.forEach(icon => {\n                    window.iconService.saveIcon(icon);\n                });\n            }\n\n            // 刷新当前视图\n            if (window.Router) {\n                window.Router.handleRouteChange();\n            }\n\n        } catch (error) {\n            throw new Error(`Failed to merge imported data: ${error.message}`);\n        }\n    },

    /**\n     * 读取文件内容\n     * @param {File} file - 文件对象\n     * @returns {Promise<string>} 文件内容\n     */\n    readFile(file) {\n        return new Promise((resolve, reject) => {\n            const reader = new FileReader();\n            reader.onload = (e) => resolve(e.target.result);\n            reader.onerror = (e) => reject(new Error('Failed to read file'));\n            reader.readAsText(file);\n        });\n    },\n\n    /**\n     * 解析Markdown文件\n     * @param {string} content - 文件内容\n     * @param {string} filename - 文件名\n     * @returns {Object} 解析后的数据\n     */\n    parseMarkdownFile(content, filename) {\n        const title = filename.replace(/\\.md$/, '').replace(/\\.markdown$/, '');\n        \n        return {\n            drafts: [{\n                id: 'imported-' + Date.now(),\n                title: title,\n                content: content,\n                createdAt: new Date().toISOString(),\n                updatedAt: new Date().toISOString(),\n                isImported: true\n            }]\n        };\n    },\n\n    /**\n     * 生成文件名\n     * @param {string} baseName - 基础名称\n     * @param {string} extension - 文件扩展名\n     * @returns {string} 完整文件名\n     */\n    generateFilename(baseName, extension) {\n        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');\n        return `${baseName}-${timestamp}.${extension}`;\n    },\n\n    /**\n     * 下载JSON文件\n     * @param {Object} data - 数据对象\n     * @param {string} filename - 文件名\n     */\n    async downloadJSON(data, filename) {\n        const jsonString = JSON.stringify(data, null, 2);\n        this.downloadFile(jsonString, filename, 'application/json');\n    },\n\n    /**\n     * 下载Markdown文件\n     * @param {Object} data - 数据对象\n     * @param {string} filename - 文件名\n     */\n    async downloadMarkdown(data, filename) {\n        let markdown = `# Qulome 数据导出\\n\\n`;\n        markdown += `导出时间: ${data.metadata.exportDate}\\n\\n`;\n        \n        if (data.drafts && data.drafts.length > 0) {\n            markdown += `## 草稿 (${data.drafts.length})\\n\\n`;\n            data.drafts.forEach((draft, index) => {\n                markdown += `### ${index + 1}. ${draft.title}\\n\\n`;\n                markdown += `${draft.content}\\n\\n---\\n\\n`;\n            });\n        }\n        \n        if (data.published && data.published.length > 0) {\n            markdown += `## 已发布 (${data.published.length})\\n\\n`;\n            data.published.forEach((item, index) => {\n                markdown += `### ${index + 1}. ${item.title}\\n\\n`;\n                markdown += `${item.content}\\n\\n---\\n\\n`;\n            });\n        }\n        \n        this.downloadFile(markdown, filename, 'text/markdown');\n    },\n\n    /**\n     * 下载HTML文件\n     * @param {Object} data - 数据对象\n     * @param {string} filename - 文件名\n     */\n    async downloadHTML(data, filename) {\n        let html = `<!DOCTYPE html>\n<html lang=\"zh-CN\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Qulome 数据导出</title>\n    <style>\n        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }\n        h1, h2, h3 { color: #333; }\n        .draft, .published { border: 1px solid #ddd; margin: 20px 0; padding: 20px; border-radius: 8px; }\n        .meta { color: #666; font-size: 0.9em; }\n    </style>\n</head>\n<body>\n    <h1>Qulome 数据导出</h1>\n    <p class=\"meta\">导出时间: ${data.metadata.exportDate}</p>\n`;\n        \n        if (data.drafts && data.drafts.length > 0) {\n            html += `    <h2>草稿 (${data.drafts.length})</h2>\n`;\n            data.drafts.forEach(draft => {\n                html += `    <div class=\"draft\">\n        <h3>${draft.title}</h3>\n        <div class=\"meta\">创建时间: ${draft.createdAt}</div>\n        <div class=\"content\">${draft.content}</div>\n    </div>\n`;\n            });\n        }\n        \n        if (data.published && data.published.length > 0) {\n            html += `    <h2>已发布 (${data.published.length})</h2>\n`;\n            data.published.forEach(item => {\n                html += `    <div class=\"published\">\n        <h3>${item.title}</h3>\n        <div class=\"meta\">发布时间: ${item.publishedAt}</div>\n        <div class=\"content\">${item.content}</div>\n    </div>\n`;\n            });\n        }\n        \n        html += `</body>\n</html>`;\n        \n        this.downloadFile(html, filename, 'text/html');\n    },\n\n    /**\n     * 下载纯文本文件\n     * @param {Object} data - 数据对象\n     * @param {string} filename - 文件名\n     */\n    async downloadText(data, filename) {\n        let text = `Qulome 数据导出\\n${'='.repeat(50)}\\n\\n`;\n        text += `导出时间: ${data.metadata.exportDate}\\n\\n`;\n        \n        if (data.drafts && data.drafts.length > 0) {\n            text += `草稿 (${data.drafts.length})\\n${'-'.repeat(20)}\\n\\n`;\n            data.drafts.forEach((draft, index) => {\n                text += `${index + 1}. ${draft.title}\\n`;\n                text += `创建时间: ${draft.createdAt}\\n`;\n                text += `内容:\\n${draft.content}\\n\\n${'*'.repeat(30)}\\n\\n`;\n            });\n        }\n        \n        if (data.published && data.published.length > 0) {\n            text += `已发布 (${data.published.length})\\n${'-'.repeat(20)}\\n\\n`;\n            data.published.forEach((item, index) => {\n                text += `${index + 1}. ${item.title}\\n`;\n                text += `发布时间: ${item.publishedAt}\\n`;\n                text += `内容:\\n${item.content}\\n\\n${'*'.repeat(30)}\\n\\n`;\n            });\n        }\n        \n        this.downloadFile(text, filename, 'text/plain');\n    },\n\n    /**\n     * 通用文件下载方法\n     * @param {string} content - 文件内容\n     * @param {string} filename - 文件名\n     * @param {string} mimeType - MIME类型\n     */\n    downloadFile(content, filename, mimeType) {\n        const blob = new Blob([content], { type: mimeType });\n        const url = URL.createObjectURL(blob);\n        \n        const link = document.createElement('a');\n        link.href = url;\n        link.download = filename;\n        link.style.display = 'none';\n        \n        document.body.appendChild(link);\n        link.click();\n        document.body.removeChild(link);\n        \n        // 清理对象URL\n        setTimeout(() => URL.revokeObjectURL(url), 1000);\n    },\n\n    /**\n     * 显示导出/导入对话框\n     */\n    showDataManagementModal() {\n        const modal = document.createElement('div');\n        modal.className = 'modal-overlay';\n        modal.innerHTML = `\n            <div class=\"modal-content data-management-modal\">\n                <h3 class=\"modal-title\">数据管理</h3>\n                \n                <div class=\"data-section\">\n                    <h4>导出数据</h4>\n                    <p>将您的所有数据导出为备份文件</p>\n                    <div class=\"export-buttons\">\n                        <button class=\"btn btn-primary\" data-format=\"json\">导出为 JSON</button>\n                        <button class=\"btn btn-secondary\" data-format=\"md\">导出为 Markdown</button>\n                        <button class=\"btn btn-secondary\" data-format=\"html\">导出为 HTML</button>\n                        <button class=\"btn btn-secondary\" data-format=\"txt\">导出为文本</button>\n                    </div>\n                </div>\n                \n                <div class=\"data-section\">\n                    <h4>导入数据</h4>\n                    <p>从备份文件恢复数据（将覆盖现有数据）</p>\n                    <div class=\"import-area\">\n                        <input type=\"file\" id=\"import-file-input\" accept=\".json,.md,.markdown\" style=\"display: none;\">\n                        <button class=\"btn btn-accent\" id=\"import-btn\">选择文件导入</button>\n                        <div id=\"import-status\" class=\"import-status\"></div>\n                    </div>\n                </div>\n                \n                <button class=\"modal-close-btn\">&times;</button>\n            </div>\n        `;\n        \n        document.body.appendChild(modal);\n        \n        // 导出按钮事件\n        modal.querySelectorAll('.export-buttons button').forEach(btn => {\n            btn.addEventListener('click', async (e) => {\n                const format = e.target.dataset.format;\n                btn.disabled = true;\n                btn.textContent = '导出中...';\n                \n                await this.exportAllData(format);\n                \n                btn.disabled = false;\n                btn.textContent = btn.textContent.replace('导出中...', '导出为 ' + format.toUpperCase());\n            });\n        });\n        \n        // 导入按钮事件\n        const importBtn = modal.querySelector('#import-btn');\n        const importInput = modal.querySelector('#import-file-input');\n        const importStatus = modal.querySelector('#import-status');\n        \n        importBtn.addEventListener('click', () => {\n            importInput.click();\n        });\n        \n        importInput.addEventListener('change', async (e) => {\n            const file = e.target.files[0];\n            if (file) {\n                importStatus.textContent = '导入中...';\n                importStatus.className = 'import-status importing';\n                \n                const success = await this.importData(file);\n                \n                if (success) {\n                    importStatus.textContent = '导入成功！';\n                    importStatus.className = 'import-status success';\n                    setTimeout(() => {\n                        this.closeModal(modal);\n                    }, 1500);\n                } else {\n                    importStatus.textContent = '导入失败，请检查文件格式';\n                    importStatus.className = 'import-status error';\n                }\n            }\n        });\n        \n        // 关闭模态框\n        const closeBtn = modal.querySelector('.modal-close-btn');\n        closeBtn.addEventListener('click', () => this.closeModal(modal));\n        modal.addEventListener('click', (e) => {\n            if (e.target === modal) this.closeModal(modal);\n        });\n    },\n\n    /**\n     * 关闭模态框\n     * @param {Element} modal - 模态框元素\n     */\n    closeModal(modal) {\n        if (document.body.contains(modal)) {\n            document.body.removeChild(modal);\n        }\n    }\n};