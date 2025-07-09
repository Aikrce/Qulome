const THEMES_STORAGE_KEY = 'qulome_themes';
const ACTIVE_THEME_STORAGE_KEY = 'qulome_active_theme_id';

// Default theme to ensure there's always at least one
const defaultThemes = [
    {
        id: 'default-1',
        name: '默认主题',
        isSystemTheme: true,
        styles: {
            // 1. 标题系统
            '--h1-font-size': '24px', '--h1-color': '#1F2937', '--h1-font-weight': 'bold', '--h1-text-align': 'left',
            '--h2-font-size': '20px', '--h2-color': '#1F2937', '--h2-font-weight': 'bold', '--h2-text-align': 'left',
            '--h3-font-size': '18px', '--h3-color': '#1F2937', '--h3-font-weight': 'bold', '--h3-text-align': 'left',
            
            // 2. 正文系统
            '--p-font-family': 'sans-serif', '--p-font-size': '16px', '--p-color': '#374151',
            '--p-line-height': '1.7', '--p-margin-bottom': '20px', '--p-text-align': 'justify',
            
            // 3. 特殊文本
            '--a-color': '#4338CA', '--a-hover-color': '#312E81',
            '--strong-color': '#4338CA', '--em-color': '#4338CA',
            '--code-bg': '#E5E7EB', '--code-color': '#BE123C',
            
            // 4. 块级元素
            '--blockquote-bg': '#F3F4F6', '--blockquote-border-color': '#D1D5DB', '--blockquote-padding': '15px 20px', '--blockquote-color': '#4B5563',
            '--code-block-bg': '#111827', '--code-block-color': '#E5E7EB', '--code-block-padding': '15px', '--code-block-border-radius': '6px',
            '--ul-list-style': 'disc', '--ol-list-style': 'decimal', '--list-pl': '30px',
            
            // 5. 视觉分隔
            '--hr-color': '#D1D5DB', '--hr-height': '1px', '--hr-margin': '30px 0',
        }
    },
    {
        id: 'default-2',
        name: '夜空',
        isSystemTheme: true,
        styles: {
            // 1. 标题系统
            '--h1-font-size': '26px', '--h1-color': '#0E2A73', '--h1-font-weight': 'bold', '--h1-text-align': 'left',
            '--h2-font-size': '22px', '--h2-color': '#0E2A73', '--h2-font-weight': 'bold', '--h2-text-align': 'left',
            '--h3-font-size': '19px', '--h3-color': '#0E2A73', '--h3-font-weight': 'bold', '--h3-text-align': 'left',
            
            // 2. 正文系统
            '--p-font-family': '"Heiti SC", "Microsoft YaHei", sans-serif', '--p-font-size': '17px', '--p-color': '#333333',
            '--p-line-height': '1.8', '--p-margin-bottom': '22px', '--p-text-align': 'justify',
            
            // 3. 特殊文本
            '--a-color': '#0E2A73', '--a-hover-color': '#2C4BA3',
            '--strong-color': '#E0A26F', '--em-color': '#E0A26F',
            '--code-bg': '#F0F0F0', '--code-color': '#333',
            
            // 4. 块级元素
            '--blockquote-bg': '#F8F9FA', '--blockquote-border-color': '#0E2A73', '--blockquote-padding': '15px 20px', '--blockquote-color': '#333333',
            '--code-block-bg': '#0A1D4E', '--code-block-color': '#F8F9FA', '--code-block-padding': '15px', '--code-block-border-radius': '6px',
            '--ul-list-style': 'square', '--ol-list-style': 'decimal', '--list-pl': '30px',
            
            // 5. 视觉分隔
            '--hr-color': '#0E2A73', '--hr-height': '2px', '--hr-margin': '30px 0',
        }
    }
];

// window.Logger is handled globally by utils/logger.js

// 深层清理无效/重复主题（无id、空id、重复id、无名）
function cleanInvalidThemes() {
    let themes = getThemes();
    const seenIds = new Set();
    const validThemes = [];
    for (const t of themes) {
        if (!t || typeof t.id !== 'string' || !t.id.trim() || seenIds.has(t.id) || typeof t.name !== 'string' || !t.name.trim()) {
            continue;
        }
        seenIds.add(t.id);
        validThemes.push(t);
    }
    if (validThemes.length !== themes.length) {
        saveThemes(validThemes);
        if (window && window.window.Logger) window.window.Logger.info('已自动清理无效/重复主题');
    }
}

class ThemeService {
    constructor() {
        this.themes = [];
        this.activeThemeId = null;
        this.init();
    }

    init() {
        try {
            window.window.Logger.debug('Initializing ThemeService...');
            this.loadThemes();
            this.activeThemeId = localStorage.getItem('qulome_active_theme_id');
            window.window.Logger.debug('Active theme ID loaded', this.activeThemeId);
            if (this.themes.length === 0) {
                window.Logger.info('No themes found, adding default theme');
                this.addDefaultTheme();
            }
            window.Logger.debug('ThemeService initialization complete');
            cleanInvalidThemes();
        } catch (error) {
            window.Logger.error('Failed to initialize ThemeService', error);
        }
    }

    loadThemes() {
        try {
            window.Logger.debug('Loading themes from localStorage...');
            const storedThemes = localStorage.getItem('qulome_themes');
            const result = storedThemes ? JSON.parse(storedThemes) : [];
            this.themes = result;
            window.Logger.debug('Themes loaded successfully', result);
        } catch (error) {
            window.Logger.error('Failed to load themes from localStorage', error);
            this.themes = [];
        }
    }

    saveThemes() {
        try {
            localStorage.setItem('qulome_themes', JSON.stringify(this.themes));
            window.Logger.debug('Themes saved successfully');
        } catch (error) {
            window.Logger.error('Failed to save themes to localStorage', error);
        }
    }

    getDefaultStyles() {
        return defaultThemes[0].styles;
    }

    addDefaultTheme() {
        try {
            const defaultTheme = defaultThemes[0];
            this.themes.push(defaultTheme);
            this.saveThemes();
            this.setActiveTheme(defaultTheme.id);
            window.window.Logger.debug('Default theme added');
        } catch (error) {
            window.window.Logger.error('Failed to add default theme', error);
        }
    }

    addTheme(name) {
        if (!name || typeof name !== 'string' || !name.trim()) {
            if (window && window.window.Logger) window.window.Logger.warn('禁止创建无名主题', name);
            throw new Error('主题名称不能为空');
        }
        let id;
        do {
            id = this.generateId();
        } while (this.themes.some(t => t.id === id));
        const newTheme = {
            id: id,
            name: name,
            isSystemTheme: false,
            styles: this.createDefaultStyles()
        };
        this.themes.push(newTheme);
        this.saveThemes();
        return newTheme;
    }

    setActiveTheme(themeId) {
        try {
            this.activeThemeId = themeId;
            localStorage.setItem('qulome_active_theme_id', themeId);
            this.saveThemes();
            window.Logger.debug('Active theme set', themeId);
        } catch (error) {
            window.Logger.error('Failed to set active theme', error);
        }
    }

    applyTheme(themeId) {
        try {
            const theme = this.themes.find(t => t.id === themeId);
            if (theme && theme.styles) {
                // Apply all style variables to the root element
                for (const [key, value] of Object.entries(theme.styles)) {
                    document.documentElement.style.setProperty(key, value);
                }
                this.setActiveTheme(theme.id);
                window.Logger.debug('Theme applied successfully', theme.name);
            } else {
                window.Logger.error('Theme not found or has no styles', themeId);
                throw new Error(`主题 "${themeId}" 未找到或无效`);
            }
        } catch (error) {
            window.Logger.error('Failed to apply theme', error);
            throw error;
        }
    }

    getActiveTheme() {
        if (!this.activeThemeId && this.themes.length > 0) {
            return this.themes[0];
        }
        return this.themes.find(t => t.id === this.activeThemeId) || this.themes[0];
    }

    getThemes() {
        // 过滤无效主题
        const validThemes = this.themes.filter(
            t => t && typeof t.id === 'string' && t.id.trim() && typeof t.name === 'string' && t.name.trim()
        );
        if (validThemes.length !== this.themes.length) {
            this.themes = validThemes;
            this.saveThemes();
            if (window && window.window.Logger) window.window.Logger.info('已自动清理无效/重复主题');
        }
        return this.themes;
    }

    getTheme(themeId) {
        return this.themes.find(t => t.id === themeId);
    }

    updateTheme(theme) {
        if (!theme || typeof theme.name !== 'string' || !theme.name.trim() || typeof theme.id !== 'string' || !theme.id.trim()) {
            if (window && window.window.Logger) window.window.Logger.warn('禁止保存无名或无效id主题', theme);
            throw new Error('主题名称和ID不能为空');
        }
        this.themes = this.themes.filter(t => t.id !== theme.id);
        this.themes.push(theme);
        this.saveThemes();
    }

    // 兼容性别名
    saveTheme(theme) {
        return this.updateTheme(theme);
    }

    generateId() {
        return `theme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Debug method
    test() {
        window.Logger.debug('ThemeService test');
        window.Logger.debug('Themes count', this.themes.length);
        window.Logger.debug('Themes', this.themes);
        window.Logger.debug('Active theme ID', this.activeThemeId);
        return 'ThemeService is working!';
    }

    deleteTheme(themeId) {
        let idx = this.themes.findIndex(t => t.id === themeId);
        if (idx === -1) {
            const before = this.themes.length;
            this.themes = this.themes.filter(t => t.isSystemTheme || (t.id && typeof t.id === 'string'));
            if (this.themes.length < before) {
                this.saveThemes();
            }
            return;
        }
        if (this.themes[idx].isSystemTheme) throw new Error('不能删除系统默认主题。');
        const wasActive = this.themes[idx].id === this.activeThemeId;
        this.themes.splice(idx, 1);
        this.saveThemes();
        if (wasActive) {
            if (this.themes.length > 0) this.setActiveTheme(this.themes[0].id);
            else this.setActiveTheme(null);
            document.dispatchEvent(new CustomEvent('themeChanged'));
        }
    }
}

// ThemeService is instantiated in app.js 