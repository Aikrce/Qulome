// 微信文章格式化工具
class WechatFormatter {
  constructor() {
    this.styles = {
      default: '默认样式',
      elegant: '优雅风格',
      modern: '现代风格', 
      classic: '经典风格'
    };
    
    this.currentStyle = 'default';
  }
  
  // 应用不同的样式主题
  applyStyle(styleName, content) {
    const wrapper = document.createElement('div');
    wrapper.className = 'wechat-content';
    wrapper.innerHTML = content;
    
    switch (styleName) {
      case 'elegant':
        this.applyElegantStyle(wrapper);
        break;
      case 'modern':
        this.applyModernStyle(wrapper);
        break;
      case 'classic':
        this.applyClassicStyle(wrapper);
        break;
      default:
        // 默认样式已经在CSS中定义
        break;
    }
    
    return wrapper.innerHTML;
  }
  
  // 优雅风格
  applyElegantStyle(wrapper) {
    // 修改标题样式
    const h2Elements = wrapper.querySelectorAll('h2');
    h2Elements.forEach(h2 => {
      h2.style.borderBottom = '2px solid #d4af37';
      h2.style.color = '#8b4513';
    });
    
    const h3Elements = wrapper.querySelectorAll('h3');
    h3Elements.forEach(h3 => {
      h3.style.borderLeft = '4px solid #d4af37';
      h3.style.color = '#8b4513';
    });
    
    // 修改引用样式
    const blockquotes = wrapper.querySelectorAll('blockquote');
    blockquotes.forEach(bq => {
      bq.style.borderLeft = '4px solid #d4af37';
      bq.style.background = '#faf8f0';
      bq.style.fontFamily = 'Georgia, serif';
    });
    
    // 修改列表样式
    const lis = wrapper.querySelectorAll('ul li');
    lis.forEach(li => {
      li.style.setProperty('--bullet-color', '#d4af37');
    });
  }
  
  // 现代风格
  applyModernStyle(wrapper) {
    // 现代化的配色方案
    const h2Elements = wrapper.querySelectorAll('h2');
    h2Elements.forEach(h2 => {
      h2.style.borderBottom = '3px solid #6c5ce7';
      h2.style.color = '#2d3436';
      h2.style.background = 'linear-gradient(120deg, #a29bfe 0%, #6c5ce7 100%)';
      h2.style.webkitBackgroundClip = 'text';
      h2.style.webkitTextFillColor = 'transparent';
    });
    
    const h3Elements = wrapper.querySelectorAll('h3');
    h3Elements.forEach(h3 => {
      h3.style.borderLeft = '4px solid #6c5ce7';
      h3.style.color = '#2d3436';
    });
    
    // 现代化引用样式
    const blockquotes = wrapper.querySelectorAll('blockquote');
    blockquotes.forEach(bq => {
      bq.style.borderLeft = '4px solid #6c5ce7';
      bq.style.background = 'linear-gradient(120deg, #f8f9ff 0%, #e8e6ff 100%)';
      bq.style.borderRadius = '8px';
    });
  }
  
  // 经典风格
  applyClassicStyle(wrapper) {
    // 传统的黑白配色
    const h2Elements = wrapper.querySelectorAll('h2');
    h2Elements.forEach(h2 => {
      h2.style.borderBottom = '2px solid #2c2c2c';
      h2.style.color = '#2c2c2c';
      h2.style.textTransform = 'uppercase';
      h2.style.letterSpacing = '1px';
    });
    
    const h3Elements = wrapper.querySelectorAll('h3');
    h3Elements.forEach(h3 => {
      h3.style.borderLeft = '4px solid #2c2c2c';
      h3.style.color = '#2c2c2c';
    });
    
    // 经典引用样式
    const blockquotes = wrapper.querySelectorAll('blockquote');
    blockquotes.forEach(bq => {
      bq.style.borderLeft = '4px solid #2c2c2c';
      bq.style.background = '#f8f8f8';
      bq.style.fontFamily = 'Times, serif';
      bq.style.fontStyle = 'italic';
    });
  }
  
  // 复制到剪贴板（针对Safari优化）
  async copyToClipboard(content) {
    try {
      // 创建一个临时的div来包含格式化的内容
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      
      // 使用现代 Clipboard API（Safari 13.1+支持）
      if (navigator.clipboard && window.isSecureContext) {
        // 尝试复制HTML格式
        const htmlBlob = new Blob([content], { type: 'text/html' });
        const textBlob = new Blob([tempDiv.textContent], { type: 'text/plain' });
        
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob
          })
        ]);
        
        document.body.removeChild(tempDiv);
        return true;
      } else {
        // 降级方案：使用传统的选择和复制
        const range = document.createRange();
        range.selectNodeContents(tempDiv);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        const success = document.execCommand('copy');
        selection.removeAllRanges();
        document.body.removeChild(tempDiv);
        
        return success;
      }
    } catch (error) {
      console.error('复制失败:', error);
      return false;
    }
  }
  
  // 获取可用的样式列表
  getAvailableStyles() {
    return this.styles;
  }
  
  // 设置当前样式
  setCurrentStyle(styleName) {
    if (this.styles[styleName]) {
      this.currentStyle = styleName;
    }
  }
  
  // 获取当前样式
  getCurrentStyle() {
    return this.currentStyle;
  }
  
  // 生成微信文章预览
  generatePreview(markdownContent) {
    const parser = new MarkdownParser();
    let htmlContent = parser.parse(markdownContent);
    
    // 应用当前选中的样式
    htmlContent = this.applyStyle(this.currentStyle, htmlContent);
    
    return htmlContent;
  }
  
  // Safari 特殊优化
  optimizeForSafari() {
    // 添加 Safari 特定的样式和行为
    const isWebKit = /WebKit/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isSafari) {
      // Safari 特定的优化
      document.body.style.webkitFontSmoothing = 'antialiased';
      document.body.style.webkitTextSizeAdjust = '100%';
      
      // 添加 Safari 特定的CSS类
      document.documentElement.classList.add('safari-browser');
    }
  }
}

// 导出格式化工具实例
window.WechatFormatter = WechatFormatter; 