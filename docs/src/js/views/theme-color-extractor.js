/**
 * Theme Color Extractor Module
 * 
 * 图片颜色提取和调整功能
 * - 图片上传处理
 * - ColorThief 颜色提取
 * - 颜色调色板渲染
 * - HSL 颜色调整面板
 * - 一键应用到主题
 */
window.ThemeColorExtractor = {
    
    // 状态管理
    uploadedImg: null,
    extractedColors: null,
    currentAdjustingColor: null,
    currentAdjustingIndex: -1,

    /**
     * 初始化颜色提取功能
     * @param {HTMLElement} modal - 主题编辑器模态框
     */
    init: (modal) => {
        if (!modal) return;

        // 获取相关元素
        const uploadInput = modal.querySelector('#image-upload');
        const previewImg = modal.querySelector('#uploaded-preview');
        const extractBtn = modal.querySelector('#extract-colors-btn');
        const applyBtn = modal.querySelector('#apply-colors-btn');
        const colorPalette = modal.querySelector('#color-palette');

        // 初始化事件监听
        window.ThemeColorExtractor.bindUploadEvents(uploadInput, previewImg, extractBtn, applyBtn, colorPalette);
        window.ThemeColorExtractor.bindExtractionEvents(modal, extractBtn, applyBtn, colorPalette);
        window.ThemeColorExtractor.bindColorAdjustmentEvents(modal, colorPalette);
        
        // 加载 ColorThief 库
        window.ThemeColorExtractor.loadColorThief();
    },

    /**
     * 绑定图片上传相关事件
     */
    bindUploadEvents: (uploadInput, previewImg, extractBtn, applyBtn, colorPalette) => {
        if (!uploadInput || !previewImg) return;

        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (ev) => {
                previewImg.src = ev.target.result;
                previewImg.style.display = 'block';
                
                window.ThemeColorExtractor.uploadedImg = new Image();
                window.ThemeColorExtractor.uploadedImg.crossOrigin = 'Anonymous';
                window.ThemeColorExtractor.uploadedImg.src = ev.target.result;
                
                extractBtn.disabled = false;
                applyBtn.disabled = true;
                colorPalette.innerHTML = '';
                window.ThemeColorExtractor.extractedColors = null;
            };
            reader.readAsDataURL(file);
        });
    },

    /**
     * 绑定颜色提取相关事件
     */
    bindExtractionEvents: (modal, extractBtn, applyBtn, colorPalette) => {
        if (!extractBtn) return;

        // 提取颜色按钮事件
        extractBtn.addEventListener('click', () => {
            if (extractBtn.disabled || !window.ThemeColorExtractor.uploadedImg) return;
            
            if (!window.ColorThief) {
                window.ThemeUtils.showError('颜色提取库未加载，请稍后重试');
                return;
            }

            extractBtn.textContent = '提取中...';
            extractBtn.disabled = true;
            applyBtn.disabled = true;

            try {
                const colorThief = new window.ColorThief();
                const uploadedImg = window.ThemeColorExtractor.uploadedImg;
                
                if (!uploadedImg.complete) {
                    uploadedImg.onload = () => extractBtn.click();
                    return;
                }

                setTimeout(() => {
                    try {
                        // 提取主色和调色板
                        const mainColor = colorThief.getColor(uploadedImg);
                        let palette = [];
                        try {
                            palette = colorThief.getPalette(uploadedImg, 5);
                        } catch (e) {
                            palette = [mainColor];
                        }
                        
                        window.ThemeColorExtractor.extractedColors = palette.length ? palette : [mainColor];
                        window.ThemeColorExtractor.renderColorPalette(window.ThemeColorExtractor.extractedColors, colorPalette);
                        
                        extractBtn.textContent = '重新提取';
                        extractBtn.disabled = false;
                        applyBtn.disabled = false;
                        
                        window.ThemeUtils.showSuccess('颜色提取成功！');
                    } catch (err) {
                        window.ThemeUtils.showError('颜色提取失败，请换一张图片重试');
                        extractBtn.textContent = '提取图片配色';
                        extractBtn.disabled = false;
                        applyBtn.disabled = true;
                        colorPalette.innerHTML = '';
                        window.Logger && window.Logger.error('颜色提取失败', err);
                    }
                }, 100);
            } catch (err) {
                window.ThemeUtils.showError('颜色提取失败，请换一张图片重试');
                extractBtn.textContent = '提取图片配色';
                extractBtn.disabled = false;
                applyBtn.disabled = true;
                colorPalette.innerHTML = '';
                window.Logger && window.Logger.error('颜色提取失败', err);
            }
        });

        // 一键应用颜色按钮事件
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                window.ThemeColorExtractor.applyColorsToTheme(modal, applyBtn);
            });
        }
    },

    /**
     * 渲染颜色调色板
     * @param {Array} colors - 颜色数组
     * @param {HTMLElement} colorPalette - 调色板容器
     */
    renderColorPalette: (colors, colorPalette) => {
        if (!colorPalette || !colors) return;
        
        colorPalette.innerHTML = '';
        const colorNames = ['主色调', '辅助色', '点缀色', '背景色', '强调色'];
        
        colors.forEach((color, idx) => {
            const hex = '#' + color.map(x => x.toString(16).padStart(2, '0')).join('');
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.innerHTML = `
                <div class="swatch-color" style="background: ${hex}"></div>
                <div class="swatch-info">
                    <span class="swatch-name">${colorNames[idx] || `颜色${idx + 1}`}</span>
                    <span class="swatch-hex">${hex}</span>
                    <button type="button" class="adjust-color-btn" data-index="${idx}" title="微调颜色">
                        🎨
                    </button>
                </div>
            `;
            swatch.title = `${colorNames[idx] || `颜色${idx + 1}`}: ${hex}`;
            
            // 添加调整按钮事件
            const adjustBtn = swatch.querySelector('.adjust-color-btn');
            adjustBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.ThemeColorExtractor.showColorAdjustment(color, idx);
            });
            
            colorPalette.appendChild(swatch);
        });
    },

    /**
     * 应用颜色到主题
     * @param {HTMLElement} modal - 模态框元素
     * @param {HTMLElement} applyBtn - 应用按钮
     */
    applyColorsToTheme: (modal, applyBtn) => {
        const extractedColors = window.ThemeColorExtractor.extractedColors;
        if (!extractedColors || !extractedColors.length) return;
        
        // 获取颜色映射规则
        const mappingRules = window.ThemeColorUtils.getColorMappingRules();
        
        // 将RGB数组转换为HEX
        const toHex = (color) => '#' + color.map(x => x.toString(16).padStart(2, '0')).join('');
        
        // 应用到主题相关输入框
        const setColor = (id, hex) => {
            const input = modal.querySelector('#' + id);
            if (input) {
                input.value = hex;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };

        // 根据映射规则应用颜色
        extractedColors.forEach((color, index) => {
            const hex = toHex(color);
            const rules = mappingRules[index];
            
            if (rules) {
                rules.forEach(rule => {
                    setColor(rule.id, hex);
                });
            }
        });

        applyBtn.textContent = '已应用';
        applyBtn.disabled = true;
        
        setTimeout(() => {
            applyBtn.textContent = '一键应用到主题';
            applyBtn.disabled = false;
        }, 2000);
        
        window.ThemeUtils.showSuccess('配色已应用到主题！');
    },

    /**
     * 绑定颜色调整面板事件
     * @param {HTMLElement} modal - 模态框元素
     * @param {HTMLElement} colorPalette - 调色板容器
     */
    bindColorAdjustmentEvents: (modal, colorPalette) => {
        // 获取调整面板相关元素
        const adjustmentPanel = modal.querySelector('#color-adjustment-panel');
        const currentColorPreview = modal.querySelector('#current-color-preview');
        const hueSlider = modal.querySelector('#hue-slider');
        const saturationSlider = modal.querySelector('#saturation-slider');
        const lightnessSlider = modal.querySelector('#lightness-slider');
        const hueValue = modal.querySelector('#hue-value');
        const saturationValue = modal.querySelector('#saturation-value');
        const lightnessValue = modal.querySelector('#lightness-value');
        const applyAdjustmentBtn = modal.querySelector('#apply-adjustment-btn');
        const cancelAdjustmentBtn = modal.querySelector('#cancel-adjustment-btn');

        if (!adjustmentPanel) return;

        // HSL滑块事件监听
        [hueSlider, saturationSlider, lightnessSlider].forEach((slider, index) => {
            if (!slider) return;
            
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                const unit = index === 0 ? '°' : '%';
                const valueElements = [hueValue, saturationValue, lightnessValue];
                if (valueElements[index]) {
                    valueElements[index].textContent = value + unit;
                }
                window.ThemeColorExtractor.updateColorPreview(modal);
            });
        });

        // 应用颜色调整
        if (applyAdjustmentBtn) {
            applyAdjustmentBtn.addEventListener('click', () => {
                const h = parseInt(hueSlider.value);
                const s = parseInt(saturationSlider.value);
                const l = parseInt(lightnessSlider.value);
                
                const [r, g, b] = window.ThemeColorUtils.hslToRgb(h, s, l);
                
                // 更新提取的颜色数组
                if (window.ThemeColorExtractor.extractedColors && window.ThemeColorExtractor.currentAdjustingIndex >= 0) {
                    window.ThemeColorExtractor.extractedColors[window.ThemeColorExtractor.currentAdjustingIndex] = [r, g, b];
                    window.ThemeColorExtractor.renderColorPalette(window.ThemeColorExtractor.extractedColors, colorPalette);
                }
                
                adjustmentPanel.style.display = 'none';
                window.ThemeUtils.showSuccess('颜色调整已应用！');
            });
        }

        // 取消颜色调整
        if (cancelAdjustmentBtn) {
            cancelAdjustmentBtn.addEventListener('click', () => {
                adjustmentPanel.style.display = 'none';
            });
        }
    },

    /**
     * 显示颜色调整面板
     * @param {Array} colorArray - 颜色RGB数组
     * @param {number} colorIndex - 颜色索引
     */
    showColorAdjustment: (colorArray, colorIndex) => {
        window.ThemeColorExtractor.currentAdjustingColor = colorArray;
        window.ThemeColorExtractor.currentAdjustingIndex = colorIndex;
        
        const modal = document.querySelector('.theme-editor-view');
        if (!modal) return;

        const adjustmentPanel = modal.querySelector('#color-adjustment-panel');
        const hueSlider = modal.querySelector('#hue-slider');
        const saturationSlider = modal.querySelector('#saturation-slider');
        const lightnessSlider = modal.querySelector('#lightness-slider');
        const hueValue = modal.querySelector('#hue-value');
        const saturationValue = modal.querySelector('#saturation-value');
        const lightnessValue = modal.querySelector('#lightness-value');

        if (!adjustmentPanel || !hueSlider || !saturationSlider || !lightnessSlider) return;
        
        const [h, s, l] = window.ThemeColorUtils.rgbToHsl(colorArray[0], colorArray[1], colorArray[2]);
        
        hueSlider.value = h;
        saturationSlider.value = s;
        lightnessSlider.value = l;
        
        if (hueValue) hueValue.textContent = h + '°';
        if (saturationValue) saturationValue.textContent = s + '%';
        if (lightnessValue) lightnessValue.textContent = l + '%';
        
        window.ThemeColorExtractor.updateColorPreview(modal);
        adjustmentPanel.style.display = 'block';
    },

    /**
     * 更新颜色预览
     * @param {HTMLElement} modal - 模态框元素
     */
    updateColorPreview: (modal) => {
        const currentColorPreview = modal.querySelector('#current-color-preview');
        const hueSlider = modal.querySelector('#hue-slider');
        const saturationSlider = modal.querySelector('#saturation-slider');
        const lightnessSlider = modal.querySelector('#lightness-slider');

        if (!currentColorPreview || !hueSlider || !saturationSlider || !lightnessSlider) return;

        const h = parseInt(hueSlider.value);
        const s = parseInt(saturationSlider.value);
        const l = parseInt(lightnessSlider.value);
        
        const [r, g, b] = window.ThemeColorUtils.hslToRgb(h, s, l);
        const hex = window.ThemeColorUtils.rgbToHex(r, g, b);
        
        currentColorPreview.style.cssText = `
            background: ${hex};
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 3px solid #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            margin: 0 auto 16px;
        `;
    },

    /**
     * 动态加载 ColorThief 库
     */
    loadColorThief: () => {
        if (!window.ColorThief) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/colorthief@2.3.2/dist/color-thief.umd.js';
            script.onload = () => { 
                window.Logger && window.Logger.debug('ColorThief loaded'); 
            };
            script.onerror = () => {
                window.Logger && window.Logger.error('Failed to load ColorThief');
                window.ThemeUtils.showError('颜色提取库加载失败，请检查网络连接');
            };
            document.head.appendChild(script);
        }
    },

    /**
     * 重置颜色提取状态
     */
    reset: () => {
        window.ThemeColorExtractor.uploadedImg = null;
        window.ThemeColorExtractor.extractedColors = null;
        window.ThemeColorExtractor.currentAdjustingColor = null;
        window.ThemeColorExtractor.currentAdjustingIndex = -1;
    }
};