const ICONS_STORAGE_KEY = 'qulome_icons';

// Default icons to provide some initial content
const defaultIcons = [
    {
        id: 'icon-default-1',
        name: 'Right Arrow',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2h12.172z"/></svg>`,
        originalSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2h12.172z"/></svg>`,
        color: null,
        colorMode: 'main'
    },
    {
        id: 'icon-default-2',
        name: 'Check Mark',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"/></svg>`,
        originalSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"/></svg>`,
        color: '#22c55e',
        colorMode: 'main'
    }
];

/**
 * 分析SVG结构，找到可以设置颜色的元素
 * @param {string} svgString - SVG字符串
 * @returns {Array} 可设置颜色的元素数组
 */
function analyzeSvgStructure(svgString) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');
        
        if (!svgElement) {
            return [];
        }
        
        const colorableElements = [];
        
        // 递归查找可设置颜色的元素
        function findColorableElements(element) {
            if (element.tagName === 'path' || element.tagName === 'rect' || 
                element.tagName === 'circle' || element.tagName === 'polygon' ||
                element.tagName === 'line' || element.tagName === 'polyline') {
                colorableElements.push({
                    tagName: element.tagName,
                    hasFill: element.hasAttribute('fill') || element.style.fill,
                    hasStroke: element.hasAttribute('stroke') || element.style.stroke
                });
            }
            
            // 递归查找子元素
            for (let child of element.children) {
                findColorableElements(child);
            }
        }
        
        findColorableElements(svgElement);
        return colorableElements;
    } catch (error) {
        console.error('Failed to analyze SVG structure:', error);
        return [];
    }
}

/**
 * 应用颜色到SVG（统一的改色逻辑）
 * @param {string} svgString - 原始SVG字符串
 * @param {string} color - 要应用的颜色
 * @param {string} mode - 改色模式 ('main' 或 'fill')
 * @returns {string} 应用颜色后的SVG字符串
 */
function applyColorToSvg(svgString, color, mode = 'main') {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');
        
        if (!svgElement) {
            return svgString;
        }

        // 定义可改色的元素标签
        const colorableTags = ['path', 'circle', 'polygon', 'ellipse', 'line', 'polyline'];
        
        // 递归处理SVG元素
        function processElement(element) {
            if (colorableTags.includes(element.tagName)) {
                if (mode === 'fill') {
                    // 无论有无fill，强制设置fill
                    element.setAttribute('fill', color);
                } else {
                    // 主线条改色：优先改stroke，没有stroke时强制设置fill
                    if (element.hasAttribute('stroke') && element.getAttribute('stroke') !== 'none') {
                        element.setAttribute('stroke', color);
                    } else {
                        element.setAttribute('fill', color);
                    }
                }
            }
            // 递归处理子元素
            for (let child of element.children) {
                processElement(child);
            }
        }
        processElement(svgElement);
        // 可选：根节点如果fill=currentColor，也可以移除或替换
        if (svgElement.hasAttribute('fill') && svgElement.getAttribute('fill') === 'currentColor') {
            svgElement.removeAttribute('fill');
        }
        // 序列化回字符串
        const serializer = new XMLSerializer();
        return serializer.serializeToString(svgElement);
    } catch (error) {
        console.error('Failed to apply color to SVG:', error);
        return svgString;
    }
}

/**
 * 验证图标对象是否有效
 * @param {Object} icon - 图标对象
 * @returns {boolean} 是否有效
 */
function isValidIcon(icon) {
    if (!icon || typeof icon !== 'object') return false;
    if (!icon.id || !icon.name || !icon.svg) return false;
    if (typeof icon.svg !== 'string' || !icon.svg.includes('<svg') || !icon.svg.includes('</svg>')) return false;
    return true;
}

/**
 * 清理无效图标（仅在必要时调用）
 * @param {Array} icons - 图标数组
 * @returns {Array} 清理后的图标数组
 */
function cleanInvalidIcons(icons) {
    if (!Array.isArray(icons)) return [];
    return icons.filter(isValidIcon);
}

/**
 * 获取所有图标
 * @returns {Array} 图标数组
 */
function getIcons() {
    try {
        const icons = localStorage.getItem(ICONS_STORAGE_KEY);
        if (!icons) {
            localStorage.setItem(ICONS_STORAGE_KEY, JSON.stringify(defaultIcons));
            return defaultIcons;
        }
        
        const parsedIcons = JSON.parse(icons);
        // 只在数据明显损坏时才清理
        if (!Array.isArray(parsedIcons)) {
            localStorage.setItem(ICONS_STORAGE_KEY, JSON.stringify(defaultIcons));
            return defaultIcons;
        }
        
        return parsedIcons;
    } catch (error) {
        console.error('Failed to get icons:', error);
        localStorage.setItem(ICONS_STORAGE_KEY, JSON.stringify(defaultIcons));
        return defaultIcons;
    }
}

/**
 * 保存图标到本地存储
 * @param {Array} icons - 图标数组
 */
function saveIcons(icons) {
    try {
        if (!Array.isArray(icons)) {
            throw new Error('Icons must be an array');
        }
        localStorage.setItem(ICONS_STORAGE_KEY, JSON.stringify(icons));
    } catch (error) {
        console.error('Failed to save icons:', error);
    }
}

/**
 * 添加新图标
 * @param {string} name - 图标名称
 * @param {string} svg - SVG代码
 * @returns {Object} 新图标对象
 */
function addIcon(name, svg) {
    if (!name || !svg) {
        throw new Error("Icon name and SVG content are required.");
    }
    
    // 验证SVG格式
    if (!svg.includes('<svg') || !svg.includes('</svg>')) {
        throw new Error("Invalid SVG format");
    }
    
    const icons = getIcons();
    
    // 检查名称重复
    if (icons.some(icon => icon.name === name)) {
        throw new Error("Icon name already exists");
    }
    
    const newIcon = {
        id: `icon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name,
        svg: svg,
        originalSvg: svg,
        color: null,
        colorMode: 'main'
    };
    
    icons.push(newIcon);
    saveIcons(icons);
    
    return newIcon;
}

/**
 * 删除图标
 * @param {string} iconId - 图标ID
 */
function deleteIcon(iconId) {
    const icons = getIcons();
    const filteredIcons = icons.filter(icon => icon.id !== iconId);
    saveIcons(filteredIcons);
}

/**
 * 获取单个图标
 * @param {string} iconId - 图标ID
 * @returns {Object|null} 图标对象
 */
function getIcon(iconId) {
    const icons = getIcons();
    return icons.find(icon => icon.id === iconId) || null;
}

/**
 * 更新图标颜色（统一的颜色更新接口）
 * @param {string} iconId - 图标ID
 * @param {string} color - 新颜色
 * @param {string} mode - 改色模式 ('main' 或 'fill')
 * @returns {Object|null} 更新后的图标对象
 */
function updateIconColor(iconId, color, mode = 'main') {
    const icons = getIcons();
    const iconIndex = icons.findIndex(icon => icon.id === iconId);
    
    if (iconIndex === -1) {
        return null;
    }
    
    const icon = icons[iconIndex];
    
    // 确保有原始SVG
    if (!icon.originalSvg) {
        icon.originalSvg = icon.svg;
    }
    
    // 应用颜色
    const coloredSvg = applyColorToSvg(icon.originalSvg, color, mode);
    
    // 更新图标
    const updatedIcon = {
        ...icon,
        svg: coloredSvg,
        color: color,
        colorMode: mode
    };
    
    icons[iconIndex] = updatedIcon;
    saveIcons(icons);
    
    return updatedIcon;
}

/**
 * 更新图标信息（通用更新接口）
 * @param {string} iconId - 图标ID
 * @param {Object} updates - 更新内容
 * @returns {Object|null} 更新后的图标对象
 */
function updateIcon(iconId, updates) {
    const icons = getIcons();
    const iconIndex = icons.findIndex(icon => icon.id === iconId);
    
    if (iconIndex === -1) {
        return null;
    }
    
    const icon = icons[iconIndex];
    
    // 处理颜色更新
    if (updates.color !== undefined) {
        const mode = updates.colorMode || icon.colorMode || 'main';
        const coloredSvg = applyColorToSvg(icon.originalSvg || icon.svg, updates.color, mode);
        icon.svg = coloredSvg;
        icon.color = updates.color;
        icon.colorMode = mode;
    }
    
    // 处理其他字段更新
    Object.keys(updates).forEach(key => {
        if (key !== 'color' && key !== 'svg' && updates[key] !== undefined) {
            icon[key] = updates[key];
        }
    });
    
    icons[iconIndex] = icon;
    saveIcons(icons);
    
    return icon;
}

// 导出服务接口
window.iconService = {
    getIcons,
    getIcon,
    addIcon,
    deleteIcon,
    updateIcon,
    updateIconColor,
    applyColorToSvg,
    isValidIcon,
    cleanInvalidIcons,
    analyzeSvgStructure
}; 