const ICONS_STORAGE_KEY = 'qulome_icons';

// Default icons to provide some initial content
const defaultIcons = [
    {
        id: 'icon-default-1',
        name: 'Right Arrow',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2h12.172z"/></svg>`,
        color: null
    },
    {
        id: 'icon-default-2',
        name: 'Check Mark',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"/></svg>`,
        color: '#22c55e' // A nice green for check marks
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
 * 应用颜色到SVG
 * @param {string} svgString - 原始SVG字符串
 * @param {string} color - 要应用的颜色
 * @returns {string} 应用颜色后的SVG字符串
 */
function applyColorToSvg(svgString, color) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');
        if (!svgElement) {
            return svgString;
        }
        // 递归应用颜色
        function updateElementColor(element, parentHasFill, parentHasStroke) {
            // 只对主图形元素变色，不对 <rect> 变色
            const colorTags = ['path', 'circle', 'polygon', 'ellipse', 'line', 'polyline'];
            if (colorTags.includes(element.tagName)) {
                let hasFill = element.hasAttribute('fill') && element.getAttribute('fill') !== 'none';
                let hasStroke = element.hasAttribute('stroke') && element.getAttribute('stroke') !== 'none';
                if (hasFill) {
                    element.setAttribute('fill', color);
                } else if (!hasFill && !hasStroke && parentHasFill) {
                    element.setAttribute('fill', color);
                }
                if (hasStroke) {
                    element.setAttribute('stroke', color);
                } else if (!hasFill && !hasStroke && parentHasStroke) {
                    element.setAttribute('stroke', color);
                }
            }
            // 递归处理子元素
            for (let child of element.children) {
                updateElementColor(child, parentHasFill, parentHasStroke);
            }
        }
        // 判断 SVG 根节点整体是实心还是虚心
        let rootHasFill = false, rootHasStroke = false;
        svgElement.querySelectorAll('*').forEach(el => {
            if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') rootHasFill = true;
            if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') rootHasStroke = true;
        });
        updateElementColor(svgElement, rootHasFill, rootHasStroke);
        // 将修改后的SVG转换回字符串
        const serializer = new XMLSerializer();
        return serializer.serializeToString(svgElement);
    } catch (error) {
        console.error('Failed to apply color to SVG:', error);
        return svgString;
    }
}

// 新增：只改 fill，不动 stroke，且跳过rect
function applyColorToSvgFillOnly(svgString, color) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');
        if (!svgElement) return svgString;
        function updateFill(element) {
            const mainTags = ['path', 'circle', 'polygon', 'ellipse', 'line', 'polyline'];
            if (mainTags.includes(element.tagName)) {
                // 只改 fill，不动 stroke
                if (element.hasAttribute('fill') && element.getAttribute('fill') !== 'none') {
                    element.setAttribute('fill', color);
                }
            }
            for (let child of element.children) updateFill(child);
        }
        updateFill(svgElement);
        const serializer = new XMLSerializer();
        return serializer.serializeToString(svgElement);
    } catch (error) {
        console.error('Failed to apply fill color to SVG:', error);
        return svgString;
    }
}

function isValidIcon(icon) {
    if (!icon || typeof icon !== 'object') return false;
    if (!icon.id || !icon.name || !icon.svg) return false;
    // 简单校验 svg 格式
    if (typeof icon.svg !== 'string' || !icon.svg.includes('<svg') || !icon.svg.includes('</svg>')) return false;
    return true;
}

function cleanOrphanIcons() {
    let icons = getIcons();
    const validIcons = icons.filter(isValidIcon);
    if (validIcons.length !== icons.length) {
        saveIcons(validIcons);
        if (window && window.Logger) window.Logger.info('已自动清理无效/orphan 图标');
    }
    return validIcons;
}

// 修改 getIcons，始终返回已清理的图标
function getIcons() {
    const icons = localStorage.getItem(ICONS_STORAGE_KEY);
    let arr;
    if (!icons) {
        localStorage.setItem(ICONS_STORAGE_KEY, JSON.stringify(defaultIcons));
        arr = defaultIcons;
    } else {
        arr = JSON.parse(icons);
    }
    return cleanOrphanIconsRaw(arr);
}
// 内部用，避免递归死循环
function cleanOrphanIconsRaw(arr) {
    return Array.isArray(arr) ? arr.filter(isValidIcon) : [];
}

function saveIcons(icons) {
    localStorage.setItem(ICONS_STORAGE_KEY, JSON.stringify(icons));
}

function addIcon(name, svg) {
    if (!name || !svg) {
        throw new Error("Icon name and SVG content are required.");
        return null;
    }
    const icons = getIcons();
    const newIcon = {
        id: `icon-${new Date().getTime()}`,
        name: name,
        svg: svg,
        originalSvg: svg,
        color: null,
        colorMode: 'main'
    };
    icons.push(newIcon);
    saveIcons(icons);
    cleanOrphanIcons();
    return newIcon;
}

function deleteIcon(iconId) {
    let icons = getIcons();
    icons = icons.filter(i => i.id !== iconId);
    saveIcons(icons);
    cleanOrphanIcons();
}

function getIcon(iconId) {
    const icons = getIcons();
    return icons.find(icon => icon.id === iconId);
}

/**
 * 更新图标颜色
 * @param {string} iconId - 图标ID
 * @param {string} color - 新颜色
 * @param {string} mode - 更新模式 ('main' 或 'fill')
 * @returns {Object|null} 更新后的图标对象
 */
function updateIconColor(iconId, color, mode = 'main') {
    let icons = getIcons();
    const iconIndex = icons.findIndex(i => i.id === iconId);
    if (iconIndex > -1) {
        const icon = icons[iconIndex];
        if (!icon.originalSvg) {
            icon.originalSvg = icon.svg;
        }
        let coloredSvg;
        if (mode === 'fill') {
            coloredSvg = applyColorToSvgFillOnly(icon.originalSvg, color);
        } else {
            coloredSvg = applyColorToSvg(icon.originalSvg, color);
        }
        icons[iconIndex] = {
            ...icon,
            svg: coloredSvg,
            color: color,
            colorMode: mode,
            originalSvg: icon.originalSvg
        };
        saveIcons(icons);
        return icons[iconIndex];
    }
    return null;
}

function updateIcon(iconId, updates) {
    let icons = getIcons();
    const iconIndex = icons.findIndex(i => i.id === iconId);
    if(iconIndex > -1) {
        if (typeof updates === 'string') {
            const newName = updates;
            const newColor = arguments[2];
        if(newName !== undefined) {
            icons[iconIndex].name = newName;
        }
        if(newColor !== undefined) {
                if (!icons[iconIndex].originalSvg) icons[iconIndex].originalSvg = icons[iconIndex].svg;
                const coloredSvg = applyColorToSvg(icons[iconIndex].originalSvg, newColor);
                icons[iconIndex].svg = coloredSvg;
            icons[iconIndex].color = newColor;
            }
        } else if (typeof updates === 'object') {
            Object.keys(updates).forEach(key => {
                if (updates[key] !== undefined) {
                    if (key === 'color') {
                        if (!icons[iconIndex].originalSvg) icons[iconIndex].originalSvg = icons[iconIndex].svg;
                        const coloredSvg = applyColorToSvg(icons[iconIndex].originalSvg, updates.color);
                        icons[iconIndex].svg = coloredSvg;
                        icons[iconIndex].color = updates.color;
                    } else {
                        icons[iconIndex][key] = updates[key];
                    }
                }
            });
        }
        saveIcons(icons);
        return icons[iconIndex];
    }
    return null;
}

window.iconService = {
    getIcons,
    getIcon,
    addIcon,
    deleteIcon,
    updateIcon,
    updateIconColor,
    analyzeSvgStructure,
    applyColorToSvg,
    applyColorToSvgFillOnly,
    cleanOrphanIcons
}; 