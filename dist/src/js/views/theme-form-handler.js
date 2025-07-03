/**
 * Theme Form Handler Module
 * 
 * 主题预览和表单处理功能
 * - 实时预览更新
 * - 表单数据收集和验证
 * - 竖线系统处理
 * - 默认值重置
 * - 确认弹窗系统
 */
window.ThemeFormHandler = {
    /**
     * 统一的输入值获取函数
     * @param {HTMLElement} modal - 模态框元素
     * @param {string} id - 输入元素的ID
     * @returns {string} 输入值
     */
    getInputValue: (modal, id) => {
        const input = modal.querySelector('#' + id);
        return input ? input.value : '';
    },

    /**
     * 更新主题预览
     * @param {HTMLElement} modal - 主题编辑器模态框
     */
    updateThemePreview: (modal) => {
        try {
            // 更新所有范围值显示
            const rangeInputs = modal.querySelectorAll('input[type="range"]');
            rangeInputs.forEach(input => {
                const valueSpan = input.nextElementSibling;
                if (valueSpan && valueSpan.classList.contains('range-value')) {
                    const value = parseFloat(input.value);
                    const unit = input.id.includes('height') && value < 10 ? 'px' : 
                                input.id.includes('size') ? 'px' : 
                                input.id.includes('line-height') ? '' : 'px';
                    valueSpan.textContent = value + unit;
                }
            });

            // 获取所有样式值
            const getInputValue = (id) => window.ThemeFormHandler.getInputValue(modal, id);

            // 字体设置
            const fontFamily = getInputValue('font-family');

            // 标题样式
            const h1Color = getInputValue('h1-color');
            const h1Size = getInputValue('h1-size');
            const h1Weight = getInputValue('h1-weight');
            const h1Align = getInputValue('h1-align');

            const h2Color = getInputValue('h2-color');
            const h2Size = getInputValue('h2-size');

            const h3Color = getInputValue('h3-color');
            const h3Size = getInputValue('h3-size');

            // 正文样式
            const pColor = getInputValue('p-color');
            const pSize = getInputValue('p-size');
            const pLineHeight = getInputValue('p-line-height');
            const pMargin = getInputValue('p-margin');
            const pAlign = getInputValue('p-align');

            // 特殊文本
            const aColor = getInputValue('a-color');
            const aHoverColor = getInputValue('a-hover-color');
            const strongColor = getInputValue('strong-color');
            const emColor = getInputValue('em-color');
            const codeColor = getInputValue('code-color');
            const codeBg = getInputValue('code-bg');

            // 块级元素
            const blockquoteBg = getInputValue('blockquote-bg');
            const blockquoteBorder = getInputValue('blockquote-border');
            const blockquoteColor = getInputValue('blockquote-color');
            const blockquotePadding = getInputValue('blockquote-padding');
            const codeBlockBg = getInputValue('code-block-bg');
            const codeBlockColor = getInputValue('code-block-color');

            // 视觉分隔
            const hrColor = getInputValue('hr-color');
            const hrHeight = getInputValue('hr-height');
            const hrMargin = getInputValue('hr-margin');
            const olStyle = getInputValue('ol-style');
            const ulStyle = getInputValue('ul-style');
            const listPadding = getInputValue('list-padding');

            // 应用样式到预览元素
            const previewContent = modal.querySelector('.preview-content');
            if (previewContent) {
                previewContent.style.fontFamily = fontFamily;
            }

            // H1 样式和竖线
            const previewH1 = modal.querySelector('.preview-h1');
            if (previewH1) {
                previewH1.style.color = h1Color;
                previewH1.style.fontSize = h1Size + 'px';
                previewH1.style.fontWeight = h1Weight;
                previewH1.style.textAlign = h1Align;
                previewH1.style.fontFamily = fontFamily;
                
                // 处理竖线显示
                const h1BorderEnabled = modal.querySelector('#h1-border-enabled')?.checked;
                const h1BorderPosition = getInputValue('h1-border-position');
                const h1BorderColor = getInputValue('h1-border-color');
                const h1BorderWidth = getInputValue('h1-border-width');
                
                previewH1.className = 'preview-h1';
                if (h1BorderEnabled && h1BorderPosition) {
                    previewH1.classList.add('border-' + h1BorderPosition);
                }
                
                previewH1.style.setProperty('--h1-border-color', h1BorderColor);
                previewH1.style.setProperty('--h1-border-width', h1BorderWidth + 'px');
            }

            // H2 样式和竖线
            const previewH2 = modal.querySelector('.preview-h2');
            if (previewH2) {
                previewH2.style.color = h2Color;
                previewH2.style.fontSize = h2Size + 'px';
                previewH2.style.fontWeight = '600';
                previewH2.style.fontFamily = fontFamily;
                
                // 处理竖线显示
                const h2BorderEnabled = modal.querySelector('#h2-border-enabled')?.checked;
                const h2BorderPosition = getInputValue('h2-border-position');
                const h2BorderColor = getInputValue('h2-border-color');
                const h2BorderWidth = getInputValue('h2-border-width');
                
                previewH2.className = 'preview-h2';
                if (h2BorderEnabled && h2BorderPosition) {
                    previewH2.classList.add('border-' + h2BorderPosition);
                }
                
                previewH2.style.setProperty('--h2-border-color', h2BorderColor);
                previewH2.style.setProperty('--h2-border-width', h2BorderWidth + 'px');
            }

            // H3 样式和竖线
            const previewH3 = modal.querySelector('.preview-h3');
            if (previewH3) {
                previewH3.style.color = h3Color;
                previewH3.style.fontSize = h3Size + 'px';
                previewH3.style.fontWeight = '600';
                previewH3.style.fontFamily = fontFamily;
                
                // 处理竖线显示
                const h3BorderEnabled = modal.querySelector('#h3-border-enabled')?.checked;
                const h3BorderPosition = getInputValue('h3-border-position');
                const h3BorderColor = getInputValue('h3-border-color');
                const h3BorderWidth = getInputValue('h3-border-width');
                
                previewH3.className = 'preview-h3';
                if (h3BorderEnabled && h3BorderPosition) {
                    previewH3.classList.add('border-' + h3BorderPosition);
                }
                
                previewH3.style.setProperty('--h3-border-color', h3BorderColor);
                previewH3.style.setProperty('--h3-border-width', h3BorderWidth + 'px');
            }

            // 正文样式
            const previewP = modal.querySelectorAll('.preview-p');
            previewP.forEach(p => {
                p.style.color = pColor;
                p.style.fontSize = pSize + 'px';
                p.style.lineHeight = pLineHeight;
                p.style.marginBottom = pMargin + 'px';
                p.style.textAlign = pAlign;
                p.style.fontFamily = fontFamily;
            });

            // 链接样式
            const previewA = modal.querySelector('.preview-a');
            if (previewA) {
                previewA.style.color = aColor;
                previewA.style.textDecoration = 'none';
            }

            // 强调文本样式
            const previewStrong = modal.querySelector('.preview-strong');
            if (previewStrong) {
                previewStrong.style.color = strongColor;
                previewStrong.style.fontWeight = 'bold';
            }

            const previewEm = modal.querySelector('.preview-em');
            if (previewEm) {
                previewEm.style.color = emColor;
                previewEm.style.fontStyle = 'italic';
            }

            // 内联代码样式
            const previewCode = modal.querySelector('.preview-code');
            if (previewCode) {
                previewCode.style.backgroundColor = codeBg;
                previewCode.style.color = codeColor;
                previewCode.style.padding = '2px 4px';
                previewCode.style.borderRadius = '3px';
                previewCode.style.fontFamily = 'Consolas, Monaco, "Courier New", monospace';
            }

            // 引用块样式
            const previewBlockquote = modal.querySelector('.preview-blockquote');
            if (previewBlockquote) {
                previewBlockquote.style.backgroundColor = blockquoteBg;
                previewBlockquote.style.borderLeft = `4px solid ${blockquoteBorder}`;
                previewBlockquote.style.color = blockquoteColor;
                previewBlockquote.style.padding = `${blockquotePadding}px ${blockquotePadding * 1.3}px`;
                previewBlockquote.style.margin = '16px 0';
                previewBlockquote.style.borderRadius = '4px';
                previewBlockquote.style.fontFamily = fontFamily;
            }

            // 代码块样式
            const previewCodeBlock = modal.querySelector('.preview-code-block');
            if (previewCodeBlock) {
                previewCodeBlock.style.backgroundColor = codeBlockBg;
                previewCodeBlock.style.color = codeBlockColor;
                previewCodeBlock.style.padding = '15px';
                previewCodeBlock.style.borderRadius = '6px';
                previewCodeBlock.style.margin = '16px 0';
                previewCodeBlock.style.overflow = 'auto';
            }

            // 分隔线样式
            const previewHr = modal.querySelector('.preview-hr');
            if (previewHr) {
                previewHr.style.border = 'none';
                previewHr.style.height = hrHeight + 'px';
                previewHr.style.backgroundColor = hrColor;
                previewHr.style.margin = `${hrMargin}px 0`;
            }

            // 列表样式
            const previewUl = modal.querySelector('.preview-ul');
            if (previewUl) {
                previewUl.style.listStyleType = ulStyle;
                previewUl.style.paddingLeft = listPadding + 'px';
                previewUl.style.fontFamily = fontFamily;
            }

            const previewOl = modal.querySelector('.preview-ol');
            if (previewOl) {
                previewOl.style.listStyleType = olStyle;
                previewOl.style.paddingLeft = listPadding + 'px';
                previewOl.style.fontFamily = fontFamily;
            }

        } catch (error) {
            window.Logger && window.Logger.error('更新预览失败:', error);
        }
    },

    /**
     * 从编辑器保存主题
     * @param {HTMLElement} modal - 模态框元素
     * @param {Object} theme - 主题对象
     */
    saveThemeFromEditor: (modal, theme) => {
        try {
            // 获取所有表单值的辅助函数
            const getInputValue = (id) => window.ThemeFormHandler.getInputValue(modal, id);

            // 收集所有样式设置
            const updatedStyles = {
                ...theme.styles,
                
                // 基础设置
                '--theme-primary': getInputValue('theme-primary'),
                '--theme-secondary': getInputValue('theme-secondary'),
                '--text-primary': getInputValue('text-primary'),
                '--p-font-family': getInputValue('font-family'),
                
                // 标题系统
                '--h1-font-size': getInputValue('h1-size') + 'px',
                '--h1-color': getInputValue('h1-color'),
                '--h1-font-weight': getInputValue('h1-weight'),
                '--h1-text-align': getInputValue('h1-align'),
                
                // H1竖线设置
                '--h1-border-enabled': modal.querySelector('#h1-border-enabled')?.checked ? 'true' : 'false',
                '--h1-border-position': getInputValue('h1-border-position'),
                '--h1-border-color': getInputValue('h1-border-color'),
                '--h1-border-width': getInputValue('h1-border-width') + 'px',
                
                '--h2-font-size': getInputValue('h2-size') + 'px',
                '--h2-color': getInputValue('h2-color'),
                '--h2-font-weight': '600',
                '--h2-text-align': 'left',
                
                // H2竖线设置
                '--h2-border-enabled': modal.querySelector('#h2-border-enabled')?.checked ? 'true' : 'false',
                '--h2-border-position': getInputValue('h2-border-position'),
                '--h2-border-color': getInputValue('h2-border-color'),
                '--h2-border-width': getInputValue('h2-border-width') + 'px',
                
                '--h3-font-size': getInputValue('h3-size') + 'px',
                '--h3-color': getInputValue('h3-color'),
                '--h3-font-weight': '600',
                '--h3-text-align': 'left',
                
                // H3竖线设置
                '--h3-border-enabled': modal.querySelector('#h3-border-enabled')?.checked ? 'true' : 'false',
                '--h3-border-position': getInputValue('h3-border-position'),
                '--h3-border-color': getInputValue('h3-border-color'),
                '--h3-border-width': getInputValue('h3-border-width') + 'px',
                
                // 正文系统
                '--p-font-size': getInputValue('p-size') + 'px',
                '--p-color': getInputValue('p-color'),
                '--p-line-height': getInputValue('p-line-height'),
                '--p-margin-bottom': getInputValue('p-margin') + 'px',
                '--p-text-align': getInputValue('p-align'),
                
                // 特殊文本
                '--a-color': getInputValue('a-color'),
                '--a-hover-color': getInputValue('a-hover-color'),
                '--strong-color': getInputValue('strong-color'),
                '--em-color': getInputValue('em-color'),
                '--code-bg': getInputValue('code-bg'),
                '--code-color': getInputValue('code-color'),
                
                // 块级元素
                '--blockquote-bg': getInputValue('blockquote-bg'),
                '--blockquote-border-color': getInputValue('blockquote-border'),
                '--blockquote-color': getInputValue('blockquote-color'),
                '--blockquote-padding': getInputValue('blockquote-padding') + 'px ' + (getInputValue('blockquote-padding') * 1.3) + 'px',
                '--code-block-bg': getInputValue('code-block-bg'),
                '--code-block-color': getInputValue('code-block-color'),
                '--code-block-padding': '15px',
                '--code-block-border-radius': '6px',
                
                // 视觉分隔
                '--hr-color': getInputValue('hr-color'),
                '--hr-height': getInputValue('hr-height') + 'px',
                '--hr-margin': getInputValue('hr-margin') + 'px 0',
                '--ol-list-style': getInputValue('ol-style'),
                '--ul-list-style': getInputValue('ul-style'),
                '--list-pl': getInputValue('list-padding') + 'px'
            };

            const updatedTheme = {
                ...theme,
                styles: updatedStyles
            };

            window.themeService.updateTheme(updatedTheme);
            window.ThemesView.render();
            window.ThemeUtils.showSuccess(`主题 "${theme.name}" 已更新！`);

            // 如果是当前激活的主题，重新应用
            if (theme.isActive) {
                window.themeService.applyTheme(theme.name);
                window.ThemesView.notifyThemeChange();
            }

        } catch (error) {
            window.Logger && window.Logger.error('保存主题失败:', error);
            window.ThemeUtils.showError('保存主题失败');
        }
    },

    /**
     * 重置主题为默认设置
     * @param {HTMLElement} modal - 模态框元素
     * @param {Object} theme - 主题对象
     */
    resetThemeToDefault: (modal, theme) => {
        try {
            // 默认样式配置
            const defaultStyles = {
                // 1. 标题系统 - 根据用户要求调整
                '--h1-font-size': '18px', '--h1-color': '#1F2937', '--h1-font-weight': '700', '--h1-text-align': 'left',
                '--h1-line-height': '1.2', '--h1-margin-top': '24px', '--h1-margin-bottom': '24px', '--h1-letter-spacing': '0.5px',
                '--h2-font-size': '16px', '--h2-color': '#1F2937', '--h2-font-weight': '700', '--h2-text-align': 'left',
                '--h2-line-height': '1.3', '--h2-margin-top': '12px', '--h2-margin-bottom': '12px', '--h2-letter-spacing': '0.3px',
                '--h3-font-size': '15px', '--h3-color': '#1F2937', '--h3-font-weight': '600', '--h3-text-align': 'left',
                '--h3-line-height': '1.4', '--h3-margin-top': '16px', '--h3-margin-bottom': '8px', '--h3-letter-spacing': '0.2px',
                
                // 2. 正文系统 - 根据用户要求调整
                '--p-font-family': 'sans-serif', '--p-font-size': '14px', '--p-color': '#374151',
                '--p-line-height': '1.75', '--p-margin-bottom': '16px', '--p-text-align': 'justify', '--p-letter-spacing': '0.5px',
                
                // 3. 特殊文本
                '--a-color': '#4338CA', '--a-hover-color': '#312E81',
                '--strong-color': '#4338CA', '--em-color': '#4338CA',
                '--code-bg': '#E5E7EB', '--code-color': '#BE123C',
                
                // 4. 块级元素
                '--blockquote-bg': '#F3F4F6', '--blockquote-border-color': '#D1D5DB', '--blockquote-padding': '16px 20px', '--blockquote-color': '#4B5563', '--blockquote-margin': '16px 0',
                '--code-block-bg': '#111827', '--code-block-color': '#E5E7EB', '--code-block-padding': '16px', '--code-block-border-radius': '6px', '--code-block-margin': '16px 0',
                '--ul-list-style': 'disc', '--ol-list-style': 'decimal', '--list-pl': '24px', '--list-margin': '12px 0',
                
                // 5. 视觉分隔
                '--hr-color': '#D1D5DB', '--hr-height': '1px', '--hr-margin': '24px 0',
            };

            // 重置表单值
            Object.entries(defaultStyles).forEach(([key, value]) => {
                const inputId = key.replace('--', '').replace(/-/g, '-');
                const input = modal.querySelector('#' + inputId);
                if (input) {
                    if (input.type === 'color') {
                        input.value = value;
                    } else if (input.type === 'range') {
                        input.value = parseFloat(value);
                    } else if (input.tagName === 'SELECT') {
                        input.value = value;
                    }
                }
            });

            // 更新预览
            window.ThemeFormHandler.updateThemePreview(modal);
            
            window.ThemeUtils.showSuccess('已重置为默认样式');

        } catch (error) {
            window.Logger && window.Logger.error('重置主题失败:', error);
            window.ThemeUtils.showError('重置主题失败');
        }
    },



    /**
     * 初始化表单事件监听
     * @param {HTMLElement} modal - 模态框元素
     */
    initFormEvents: (modal) => {
        if (!modal) return;

        // 为所有输入元素添加预览更新事件
        const inputs = modal.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const events = input.type === 'range' ? ['input'] : ['input', 'change'];
            events.forEach(event => {
                input.addEventListener(event, () => {
                    // 更新 range 滑块的值显示
                    if (input.type === 'range') {
                        const rangeValue = input.parentElement.querySelector('.range-value');
                        if (rangeValue) {
                            const unit = input.name.includes('font-size') || input.name.includes('margin') || input.name.includes('padding') ? 'px' : '';
                            rangeValue.textContent = input.value + unit;
                        }
                    }
                    
                    // 更新主题预览
                    window.ThemeFormHandler.updateThemePreview(modal);
                });
            });
        });

        // 竖线开关特殊处理
        const borderToggles = modal.querySelectorAll('[id$="-border-enabled"]');
        borderToggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
                window.ThemeFormHandler.updateThemePreview(modal);
            });
        });
        
        // 初始化时更新所有 range 滑块的值显示
        const rangeInputs = modal.querySelectorAll('input[type="range"]');
        rangeInputs.forEach(input => {
            const rangeValue = input.parentElement.querySelector('.range-value');
            if (rangeValue) {
                const unit = input.name.includes('font-size') || input.name.includes('margin') || input.name.includes('padding') ? 'px' : '';
                rangeValue.textContent = input.value + unit;
            }
        });
    },

    /**
     * 验证表单数据
     * @param {HTMLElement} modal - 模态框元素
     * @returns {Object} 验证结果
     */
    validateForm: (modal) => {
        const errors = [];
        const warnings = [];

        // 获取输入值的辅助函数
        const getInputValue = (id) => window.ThemeFormHandler.getInputValue(modal, id).trim();

        // 验证颜色值
        const validateColor = (id, name) => {
            const value = getInputValue(id);
            if (value && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
                errors.push(`${name}颜色格式不正确`);
            }
        };

        // 验证数值范围
        const validateRange = (id, name, min, max) => {
            const value = parseFloat(getInputValue(id));
            if (isNaN(value) || value < min || value > max) {
                errors.push(`${name}值应在 ${min}-${max} 之间`);
            }
        };

        // 颜色验证
        validateColor('h1-color', 'H1标题');
        validateColor('h2-color', 'H2标题');
        validateColor('h3-color', 'H3标题');
        validateColor('p-color', '正文');
        validateColor('a-color', '链接');
        validateColor('strong-color', '粗体');

        // 数值验证
        validateRange('h1-size', 'H1字号', 12, 48);
        validateRange('h2-size', 'H2字号', 10, 36);
        validateRange('h3-size', 'H3字号', 10, 32);
        validateRange('p-size', '正文字号', 10, 24);
        validateRange('p-line-height', '行高', 1, 3);

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    },

    /**
     * 获取表单数据摘要
     * @param {HTMLElement} modal - 模态框元素
     * @returns {Object} 表单数据摘要
     */
    getFormSummary: (modal) => {
        const getInputValue = (id) => window.ThemeFormHandler.getInputValue(modal, id);

        return {
            fontFamily: getInputValue('font-family'),
            h1: {
                size: getInputValue('h1-size') + 'px',
                color: getInputValue('h1-color'),
                weight: getInputValue('h1-weight'),
                align: getInputValue('h1-align')
            },
            h2: {
                size: getInputValue('h2-size') + 'px',
                color: getInputValue('h2-color')
            },
            h3: {
                size: getInputValue('h3-size') + 'px',
                color: getInputValue('h3-color')
            },
            paragraph: {
                size: getInputValue('p-size') + 'px',
                color: getInputValue('p-color'),
                lineHeight: getInputValue('p-line-height'),
                align: getInputValue('p-align')
            }
        };
    }
}; 