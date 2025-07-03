// theme-preview-view.js
window.ThemePreviewView = {
    /**
     * 渲染预览区
     * @param {HTMLElement} container - 预览区容器
     * @param {Object} data - 主题样式数据
     */
    render: (container, data) => {
        if (!container) return;
        container.innerHTML = window.ThemePreviewView.getPreviewHTML();
        window.ThemePreviewView.update(container, data);
    },
    /**
     * 更新预览区样式
     * @param {HTMLElement} container
     * @param {Object} data
     */
    update: (container, data) => {
        if (!container) return;
        // 根据 data 应用样式到预览区
        // 这里只做简单示例，实际可按你的 updateThemePreview 逻辑细化
        const preview = container.querySelector('.preview-content');
        if (!preview) return;
        // 示例：设置字体、主色等
        if (data['font-family']) preview.style.fontFamily = data['font-family'];
        if (data['theme-primary']) preview.style.color = data['theme-primary'];
        // ...更多样式同步...
    },
    getPreviewHTML: () => {
        return `
            <div class="preview-content">
                <h1 class="preview-h1">这是主标题 H1</h1>
                <h2 class="preview-h2">这是章节标题 H2</h2>
                <h3 class="preview-h3">这是小节标题 H3</h3>
                <p class="preview-p">这是正文段落。排版需要考虑移动端阅读体验，字体、行高、颜色都很重要。这是一个<a href="#" class="preview-a">链接</a>，还有<strong class="preview-strong">粗体</strong>和<em class="preview-em">斜体</em>。</p>
                <blockquote class="preview-blockquote">这是引用块。引用内容应与正文有明显视觉区分。</blockquote>
                <pre class="preview-code-block"><code>// 这是代码块
function helloWorld() {
  
}</code></pre>
                <ul class="preview-ul"><li>无序列表项 1</li><li>无序列表项 2</li></ul>
                <ol class="preview-ol"><li>有序列表项 1</li><li>有序列表项 2</li></ol>
                <hr class="preview-hr">
            </div>
        `;
    }
}; 