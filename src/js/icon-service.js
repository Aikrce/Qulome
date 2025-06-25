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
            const colorTags = ['path', 'circle', 'polygon', 'line', 'polyline'];
            let hasFill = element.hasAttribute('fill') && element.getAttribute('fill') !== 'none';
            let hasStroke = element.hasAttribute('stroke') && element.getAttribute('stroke') !== 'none';
            if (colorTags.includes(element.tagName)) {
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
                updateElementColor(child, hasFill || parentHasFill, hasStroke || parentHasStroke);
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

function getIcons() {
    const icons = localStorage.getItem(ICONS_STORAGE_KEY);
    if (!icons) {
        localStorage.setItem(ICONS_STORAGE_KEY, JSON.stringify(defaultIcons));
        return defaultIcons;
    }
    return JSON.parse(icons);
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
        color: null // New icons start without a custom color
    };
    icons.push(newIcon);
    saveIcons(icons);
    return newIcon;
}

function deleteIcon(iconId) {
    let icons = getIcons();
    icons = icons.filter(i => i.id !== iconId);
    saveIcons(icons);
}

function getIcon(iconId) {
    const icons = getIcons();
    return icons.find(icon => icon.id === iconId);
}

/**
 * 更新图标颜色
 * @param {string} iconId - 图标ID
 * @param {string} color - 新颜色
 * @returns {Object|null} 更新后的图标对象
 */
function updateIconColor(iconId, color) {
    let icons = getIcons();
    const iconIndex = icons.findIndex(i => i.id === iconId);
    
    if (iconIndex > -1) {
        const icon = icons[iconIndex];
        
        // 应用颜色到SVG
        const coloredSvg = applyColorToSvg(icon.svg, color);
        
        // 更新图标
        icons[iconIndex] = {
            ...icon,
            svg: coloredSvg,
            color: color
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
        // Support both old and new parameter styles for backward compatibility
        if (typeof updates === 'string') {
            // Old style: updateIcon(iconId, newName, newColor)
            const newName = updates;
            const newColor = arguments[2];
            if(newName !== undefined) {
                icons[iconIndex].name = newName;
            }
            if(newColor !== undefined) {
                // 使用新的颜色处理逻辑
                const coloredSvg = applyColorToSvg(icons[iconIndex].svg, newColor);
                icons[iconIndex].svg = coloredSvg;
                icons[iconIndex].color = newColor;
            }
        } else if (typeof updates === 'object') {
            // New style: updateIcon(iconId, { name, svg, color })
            Object.keys(updates).forEach(key => {
                if (updates[key] !== undefined) {
                    if (key === 'color') {
                        // 使用新的颜色处理逻辑
                        const coloredSvg = applyColorToSvg(icons[iconIndex].svg, updates.color);
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
    applyColorToSvg
}; 