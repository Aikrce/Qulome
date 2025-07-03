/**
 * Theme Color Utils Module
 * 
 * 颜色处理工具函数集合
 * - RGB/HSL/HEX 颜色格式转换
 * - 颜色提取和映射
 * - 颜色调整相关工具
 */
window.ThemeColorUtils = {
    
    /**
     * RGB转HSL
     * @param {number} r - 红色值 (0-255)
     * @param {number} g - 绿色值 (0-255) 
     * @param {number} b - 蓝色值 (0-255)
     * @returns {Array} [h, s, l] - 色相(0-360), 饱和度(0-100), 亮度(0-100)
     */
    rgbToHsl: (r, g, b) => {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    },

    /**
     * HSL转RGB
     * @param {number} h - 色相 (0-360)
     * @param {number} s - 饱和度 (0-100)
     * @param {number} l - 亮度 (0-100)
     * @returns {Array} [r, g, b] - RGB值 (0-255)
     */
    hslToRgb: (h, s, l) => {
        h /= 360;
        s /= 100;
        l /= 100;
        
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        let r, g, b;
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    },

    /**
     * RGB转HEX
     * @param {number} r - 红色值 (0-255)
     * @param {number} g - 绿色值 (0-255)
     * @param {number} b - 蓝色值 (0-255)
     * @returns {string} HEX颜色值 (#RRGGBB)
     */
    rgbToHex: (r, g, b) => {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    /**
     * HEX转RGB
     * @param {string} hex - HEX颜色值 (#RRGGBB 或 #RGB)
     * @returns {Array} [r, g, b] - RGB值 (0-255)
     */
    hexToRgb: (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    },

    /**
     * 颜色映射规则
     * 将提取的颜色映射到主题的具体CSS变量
     */
    getColorMappingRules: () => {
        return {
            0: [
                { id: 'theme-primary', label: '主色调' },
                { id: 'h1-color', label: 'H1标题颜色' },
                { id: 'strong-color', label: '加粗文本颜色' }
            ],
            1: [
                { id: 'theme-secondary', label: '辅助色' },
                { id: 'a-color', label: '链接颜色' },
                { id: 'h2-color', label: 'H2标题颜色' }
            ],
            2: [
                { id: 'blockquote-border-color', label: '引用块边框' },
                { id: 'h3-color', label: 'H3标题颜色' },
                { id: 'em-color', label: '斜体文本颜色' }
            ],
            3: [
                { id: 'text-primary', label: '正文颜色' },
                { id: 'p-color', label: '段落颜色' },
                { id: 'blockquote-color', label: '引用块文本' }
            ],
            4: [
                { id: 'hr-color', label: '分割线颜色' },
                { id: 'code-color', label: '行内代码颜色' },
                { id: 'a-hover-color', label: '链接悬停颜色' }
            ]
        };
    },

    /**
     * 验证颜色值是否有效
     * @param {string} color - 颜色值
     * @returns {boolean} 是否有效
     */
    isValidColor: (color) => {
        if (!color || typeof color !== 'string') return false;
        
        // 检查HEX格式
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) return true;
        
        // 检查RGB格式
        if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color)) return true;
        
        // 检查RGBA格式
        if (/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(color)) return true;
        
        return false;
    },

    /**
     * 获取颜色的亮度值
     * @param {string} hex - HEX颜色值
     * @returns {number} 亮度值 (0-255)
     */
    getColorLuminance: (hex) => {
        const rgb = window.ThemeColorUtils.hexToRgb(hex);
        if (!rgb) return 0;
        
        // 使用相对亮度公式
        const [r, g, b] = rgb.map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    },

    /**
     * 判断颜色是否为深色
     * @param {string} hex - HEX颜色值
     * @returns {boolean} 是否为深色
     */
    isDarkColor: (hex) => {
        return window.ThemeColorUtils.getColorLuminance(hex) < 0.5;
    },

    /**
     * 获取对比色（黑色或白色）
     * @param {string} hex - HEX颜色值
     * @returns {string} 对比色 (#000000 或 #FFFFFF)
     */
    getContrastColor: (hex) => {
        return window.ThemeColorUtils.isDarkColor(hex) ? '#FFFFFF' : '#000000';
    }
}; 