// 简单的 Markdown 解析器 - 专为微信文章优化
class MarkdownParser {
  constructor() {
    this.rules = [
      // 标题规则
      { pattern: /^# (.*$)/gm, replacement: '<h1>$1</h1>' },
      { pattern: /^## (.*$)/gm, replacement: '<h2>$1</h2>' },
      { pattern: /^### (.*$)/gm, replacement: '<h3>$1</h3>' },
      { pattern: /^#### (.*$)/gm, replacement: '<h4>$1</h4>' },
      
      // 粗体和斜体
      { pattern: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
      { pattern: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
      
      // 代码
      { pattern: /`([^`]+)`/g, replacement: '<code>$1</code>' },
      
      // 链接
      { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '<a href="$2">$1</a>' },
      
      // 引用
      { pattern: /^> (.*$)/gm, replacement: '<blockquote><p>$1</p></blockquote>' },
      
      // 分割线
      { pattern: /^---$/gm, replacement: '<hr>' },
      
      // 无序列表
      { pattern: /^[\*\-\+] (.*$)/gm, replacement: '<li>$1</li>' },
      
      // 有序列表
      { pattern: /^\d+\. (.*$)/gm, replacement: '<li>$1</li>' },
    ];
  }

  parse(markdown) {
    if (!markdown) return '';
    
    let html = markdown;
    
    // 应用所有规则
    this.rules.forEach(rule => {
      html = html.replace(rule.pattern, rule.replacement);
    });
    
    // 处理段落
    html = this.processParagraphs(html);
    
    // 处理列表
    html = this.processLists(html);
    
    // 处理连续的引用
    html = this.processBlockquotes(html);
    
    return html;
  }
  
  processParagraphs(html) {
    // 将非HTML标签的行包装成段落
    const lines = html.split('\n');
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 跳过空行和已经是HTML标签的行
      if (line === '' || 
          line.startsWith('<h') || 
          line.startsWith('<blockquote') || 
          line.startsWith('<hr') || 
          line.startsWith('<li') ||
          line.startsWith('<ul') ||
          line.startsWith('<ol') ||
          line.startsWith('</')) {
        processedLines.push(line);
      } else {
        // 普通文本行包装成段落
        processedLines.push(`<p>${line}</p>`);
      }
    }
    
    return processedLines.join('\n');
  }
  
  processLists(html) {
    // 处理无序列表
    html = html.replace(/(<li>.*?<\/li>)/gs, (match) => {
      const items = match.match(/<li>.*?<\/li>/g);
      if (items) {
        return `<ul>\n${items.join('\n')}\n</ul>`;
      }
      return match;
    });
    
    // 处理有序列表（简化版）
    html = html.replace(/(<li>.*?<\/li>)/gs, (match, p1, offset, string) => {
      // 检查前面是否已经有ul标签
      const before = string.substring(0, offset);
      if (!before.includes('<ul>') || before.lastIndexOf('</ul>') > before.lastIndexOf('<ul>')) {
        return match;
      }
      return match;
    });
    
    return html;
  }
  
  processBlockquotes(html) {
    // 合并连续的引用
    html = html.replace(/(<blockquote><p>.*?<\/p><\/blockquote>\s*)+/gs, (match) => {
      const quotes = match.match(/<blockquote><p>(.*?)<\/p><\/blockquote>/gs);
      if (quotes && quotes.length > 1) {
        const content = quotes.map(q => q.replace(/<blockquote><p>(.*?)<\/p><\/blockquote>/s, '$1')).join('<br>');
        return `<blockquote><p>${content}</p></blockquote>`;
      }
      return match;
    });
    
    return html;
  }
  
  // 添加微信特殊样式
  addWechatStyles(html) {
    // 为特定内容添加微信样式类
    html = html.replace(/<strong>(.*?)<\/strong>/g, '<strong class="wechat-highlight">$1</strong>');
    
    return html;
  }
}

// 导出解析器实例
window.MarkdownParser = MarkdownParser; 