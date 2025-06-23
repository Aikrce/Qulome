import { Storage } from '../utils/storage.js';

/**
 * EditorView 模块
 * 负责富文本编辑器界面的所有逻辑
 */
export class EditorView {
    /**
     * @param {function(string, string): void} showMessageCallback - 显示通知的回调函数
     */
    constructor(showMessageCallback) {
        if (typeof showMessageCallback !== 'function') {
            throw new Error('EditorView需要一个有效的回调函数来显示消息');
        }
        this.showMessage = showMessageCallback;
        this.quillEditor = null;
        this.iconOverlay = null;
        this.init();
    }

    /**
     * 初始化编辑器和事件监听器
     */
    init() {
        this.initializeQuillEditor();
        this.setupEventListeners();
        this.createIconOverlay();
    }

    /**
     * 设置编辑器界面的事件监听器
     */
    setupEventListeners() {
        document.getElementById('import-md')?.addEventListener('click', () => {
            document.getElementById('md-file-input')?.click();
        });

        document.getElementById('md-file-input')?.addEventListener('change', (e) => {
            this.handleMDImport(e);
        });

        document.getElementById('save-draft')?.addEventListener('click', () => {
            this.saveDraft();
        });
    }

    /**
     * 初始化Quill富文本编辑器
     */
    initializeQuillEditor() {
        // 注册自定义图标按钮
        const icons = Quill.import('ui/icons');
        icons['icon-insert'] = '<i class="fas fa-icons"></i>';

        const toolbarOptions = [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['link', 'image', 'icon-insert'],
            ['clean']
        ];

        this.quillEditor = new Quill('#quill-editor', {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: toolbarOptions,
                    handlers: {
                        'icon-insert': () => this.showIconSelector()
                    }
                }
            },
            placeholder: '开始创作你的微信文章...'
        });

        this.quillEditor.on('text-change', () => this.handleContentChange());
    }

    /**
     * 创建图标选择浮层
     */
    createIconOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'icon-selector-overlay';
        overlay.className = 'icon-selector-overlay';
        overlay.innerHTML = `
            <div class="icon-selector-modal">
                <div class="icon-selector-header">
                    <h3>选择图标</h3>
                    <button class="close-btn" id="close-icon-selector">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="icon-selector-content">
                    <div class="icon-grid" id="icon-selector-grid">
                        <!-- 图标将在这里动态加载 -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.iconOverlay = overlay;

        // 添加事件监听器
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.id === 'close-icon-selector') {
                this.hideIconSelector();
            }
        });

        overlay.addEventListener('click', (e) => {
            const iconCard = e.target.closest('.icon-selector-card');
            if (iconCard) {
                const iconName = iconCard.dataset.iconName;
                this.insertIconMark(iconName);
                this.hideIconSelector();
            }
        });
    }

    /**
     * 显示图标选择器
     */
    showIconSelector() {
        this.loadIconsToSelector();
        this.iconOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * 隐藏图标选择器
     */
    hideIconSelector() {
        this.iconOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    /**
     * 加载图标到选择器
     */
    loadIconsToSelector() {
        const icons = Storage.loadJSON('qulome_icons', []);
        const grid = document.getElementById('icon-selector-grid');
        
        if (!grid) return;

        if (icons.length === 0) {
            grid.innerHTML = '<div class="no-icons">暂无图标，请先到图标库添加图标</div>';
            return;
        }

        grid.innerHTML = icons.map(icon => `
            <div class="icon-selector-card" data-icon-name="${icon.name}">
                <div class="icon-display">${icon.svg}</div>
                <div class="icon-name">${icon.name}</div>
            </div>
        `).join('');
    }

    /**
     * 插入图标标记到编辑器
     * @param {string} iconName - 图标名称
     */
    insertIconMark(iconName) {
        if (!this.quillEditor) return;

        const range = this.quillEditor.getSelection();
        if (range) {
            const iconMark = `[icon:${iconName}]`;
            this.quillEditor.insertText(range.index, iconMark);
            this.quillEditor.setSelection(range.index + iconMark.length);
            this.showMessage(`已插入图标标记: ${iconMark}`, 'success');
        }
    }
    
    /**
     * 处理编辑器内容变化（为未来的未保存状态提醒做准备）
     */
    handleContentChange() {
        // console.log('内容已更改...');
    }

    /**
     * 处理Markdown文件导入
     * @param {Event} event - 文件输入事件
     */
    async handleMDImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const content = await this.readFile(file);
            const cleanedContent = this.cleanMarkdownContent(content);
            const htmlContent = this.parseMarkdownToHTML(cleanedContent);
            if (this.quillEditor) {
                this.quillEditor.root.innerHTML = htmlContent;
                this.showMessage('Markdown文件已成功导入', 'success');
            }
        } catch (error) {
            this.showMessage(`导入失败: ${error.message}`, 'error');
            console.error('MD Import Error:', error);
        }
    }

    /**
     * 异步读取文件内容
     * @param {File} file - 文件对象
     * @returns {Promise<string>} 文件内容
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    /**
     * 清理Markdown内容，移除空行
     * @param {string} content - Markdown内容
     * @returns {string} 清理后的内容
     */
    cleanMarkdownContent(content) {
        return content.split('\n').filter(line => line.trim() !== '').join('\n');
    }

    /**
     * 将Markdown简单解析为HTML
     * 注意：这是一个非常基础的解析器，生产环境建议使用成熟的库
     * @param {string} markdown - Markdown文本
     * @returns {string} HTML文本
     */
    parseMarkdownToHTML(markdown) {
        // 将每一行都包裹在<p>标签中，这是Quill处理粘贴内容的默认方式
        return markdown.split('\n').map(line => `<p>${line}</p>`).join('');
    }

    /**
     * 保存草稿
     */
    saveDraft() {
        if (!this.quillEditor) return;
        const content = this.quillEditor.getContents();
        const html = this.quillEditor.root.innerHTML;

        if (content.ops.length === 1 && content.ops[0].insert.trim() === '') {
            this.showMessage('内容为空，无需保存', 'warning');
            return;
        }

        const title = this.extractTitle(html) || '无标题文档';
        const drafts = Storage.loadJSON('qulome_drafts', []);
        const newDraft = {
            id: `draft-${Date.now()}`,
            title: title,
            content: html,
            createdAt: new Date().toISOString()
        };

        drafts.unshift(newDraft);
        const result = Storage.saveJSON('qulome_drafts', drafts);

        if (result.success) {
            this.showMessage('草稿已保存', 'success');
        } else {
            this.showMessage(`保存失败: ${result.error}`, 'error');
        }
    }

    /**
     * 从HTML内容中提取第一个H1-H6标签作为标题
     * @param {string} html - HTML内容
     * @returns {string | null} 提取到的标题或null
     */
    extractTitle(html) {
        const match = html.match(/<h[1-6]>(.*?)<\/h[1-6]>/);
        return match ? match[1].replace(/<[^>]+>/g, '').trim() : null;
    }

    /**
     * 让编辑器获得焦点
     */
    focus() {
        this.quillEditor?.focus();
    }
} 