const THEMES_STORAGE_KEY = 'qulome_themes';
const ACTIVE_THEME_STORAGE_KEY = 'qulome_active_theme_id';

// Default theme to ensure there's always at least one
const defaultThemes = [
    {
        id: 'default-1',
        name: '默认主题',
        styles: {
            '--h1-color': '#000000',
            '--p-color': '#333333',
            '--a-color': '#A78BFA',
            '--p-margin-bottom': '1rem',
            '--blockquote-bg': '#F8FAFC',
            '--blockquote-border-color': '#E2E8F0',
        }
    },
    {
        id: 'default-2',
        name: '夜空',
        styles: {
            '--h1-color': '#d2691e',
            '--p-color': '#5c5c5c',
            '--a-color': '#F472B6',
            '--p-margin-bottom': '1.2rem',
            '--blockquote-bg': '#1F2937',
            '--blockquote-border-color': '#374151',
        }
    }
];

// 统一的日志管理
const Logger = {
    debug: (message, data = null) => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(`[ThemeService Debug] ${message}`, data || '');
        }
    },
    error: (message, error = null) => {
        console.error(`[ThemeService Error] ${message}`, error || '');
    },
    info: (message, data = null) => {
        console.info(`[ThemeService Info] ${message}`, data || '');
    }
};

class ThemeService {
    constructor() {
        this.themes = [];
        this.activeThemeId = null;
        this.init();
    }

    init() {
        try {
            Logger.debug('Initializing ThemeService...');
            this.loadThemes();
            
            this.activeThemeId = localStorage.getItem('qulome_active_theme_id');
            Logger.debug('Active theme ID loaded', this.activeThemeId);

            if (this.themes.length === 0) {
                Logger.info('No themes found, adding default theme');
                this.addDefaultTheme();
            }
            Logger.debug('ThemeService initialization complete');
        } catch (error) {
            Logger.error('Failed to initialize ThemeService', error);
        }
    }

    loadThemes() {
        try {
            Logger.debug('Loading themes from localStorage...');
            const storedThemes = localStorage.getItem('qulome_themes');
            const result = storedThemes ? JSON.parse(storedThemes) : [];
            this.themes = result;
            Logger.debug('Themes loaded successfully', result);
        } catch (error) {
            Logger.error('Failed to load themes from localStorage', error);
            this.themes = [];
        }
    }

    saveThemes() {
        try {
            localStorage.setItem('qulome_themes', JSON.stringify(this.themes));
            Logger.debug('Themes saved successfully');
        } catch (error) {
            Logger.error('Failed to save themes to localStorage', error);
        }
    }

    createDefaultStyles() {
        return {
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
        };
    }

    addDefaultTheme() {
        try {
            const defaultTheme = DEFAULT_THEMES[0];
            this.themes.push(defaultTheme);
            this.saveThemes();
            this.setActiveTheme(defaultTheme.id);
            Logger.debug('Default theme added');
        } catch (error) {
            Logger.error('Failed to add default theme', error);
        }
    }

    addDefaultThemes() {
        const defaultThemes = [
            {
                id: this.generateId(),
                name: '默认主题 (纯色)',
                styles: this.createDefaultStyles()
            },
            {
                id: this.generateId(),
                name: '央视新闻',
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
        
        this.themes.push(...defaultThemes);
        this.saveThemes();
        this.setActiveTheme(defaultThemes[0].id);
    }

    addTheme(name) {
        const newTheme = {
            id: this.generateId(),
            name: name,
            styles: this.createDefaultStyles() // New themes start with default styles
        };
        
        this.themes.push(newTheme);
        this.saveThemes();
        return newTheme;
    }

    setActiveTheme(themeId) {
        try {
            this.activeThemeId = themeId;
            localStorage.setItem('qulome_active_theme_id', themeId);
            Logger.debug('Active theme set', themeId);
        } catch (error) {
            Logger.error('Failed to set active theme', error);
        }
    }

    getActiveTheme() {
        if (!this.activeThemeId && this.themes.length > 0) {
            return this.themes[0];
        }
        return this.themes.find(t => t.id === this.activeThemeId) || this.themes[0];
    }

    getThemes() {
        return this.themes;
    }

    getTheme(themeId) {
        return this.themes.find(t => t.id === themeId);
    }

    updateTheme(updatedTheme) {
        this.themes = this.themes.map(theme => {
            if (theme.id === updatedTheme.id) {
                return updatedTheme;
            }
            return theme;
        });
        this.saveThemes();
    }

    generateId() {
        return `theme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Debug method
    test() {
        Logger.debug('ThemeService test');
        Logger.debug('Themes count', this.themes.length);
        Logger.debug('Themes', this.themes);
        Logger.debug('Active theme ID', this.activeThemeId);
        return 'ThemeService is working!';
    }
}

window.themeService = new ThemeService(); 