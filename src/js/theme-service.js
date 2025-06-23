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

class ThemeService {
    constructor() {
        console.log('ThemeService: Initializing...');
        this.themes = this.loadThemes();
        console.log('ThemeService: Loaded themes:', this.themes);
        this.activeThemeId = localStorage.getItem('activeThemeId') || null;
        console.log('ThemeService: Active theme ID:', this.activeThemeId);
        
        // Initialize with default theme if no themes exist
        if (this.themes.length === 0) {
            console.log('ThemeService: No themes found, adding default...');
            this.addDefaultTheme();
        }
        console.log('ThemeService: Initialization complete');
    }

    loadThemes() {
        console.log('ThemeService: Loading themes from localStorage...');
        const themes = localStorage.getItem('themes');
        const result = themes ? JSON.parse(themes) : [];
        console.log('ThemeService: Loaded themes result:', result);
        return result;
    }

    saveThemes() {
        localStorage.setItem('themes', JSON.stringify(this.themes));
    }

    addDefaultTheme() {
        const defaultTheme = {
            id: this.generateId(),
            name: '默认主题',
            styles: {
                '--h1-font-size': '24px',
                '--h1-color': '#001449',
                '--h2-font-size': '20px',
                '--h2-color': '#001449',
                '--p-font-size': '16px',
                '--p-color': '#374151',
                '--p-line-height': '1.6',
                '--p-margin-bottom': '16px',
                '--a-color': '#001449',
                '--blockquote-bg': '#F8F9FA',
                '--blockquote-border-color': '#001449',
                '--code-bg': '#F1F3F4',
                '--code-color': '#D63384'
            }
        };
        
        this.themes.push(defaultTheme);
        this.saveThemes();
        this.setActiveTheme(defaultTheme.id);
    }

    addTheme(name) {
        console.log('ThemeService: Adding new theme with name:', name);
        const newTheme = {
            id: this.generateId(),
            name: name,
            styles: {
                '--h1-font-size': '24px',
                '--h1-color': '#001449',
                '--h2-font-size': '20px',
                '--h2-color': '#001449',
                '--p-font-size': '16px',
                '--p-color': '#374151',
                '--p-line-height': '1.6',
                '--p-margin-bottom': '16px',
                '--a-color': '#001449',
                '--blockquote-bg': '#F8F9FA',
                '--blockquote-border-color': '#001449',
                '--code-bg': '#F1F3F4',
                '--code-color': '#D63384'
            }
        };
        
        console.log('ThemeService: Created theme object:', newTheme);
        this.themes.push(newTheme);
        console.log('ThemeService: Updated themes array:', this.themes);
        this.saveThemes();
        console.log('ThemeService: Theme saved successfully');
        return newTheme;
    }

    setActiveTheme(themeId) {
        this.activeThemeId = themeId;
        localStorage.setItem('activeThemeId', themeId);
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
        console.log('ThemeService test:');
        console.log('- Themes count:', this.themes.length);
        console.log('- Themes:', this.themes);
        console.log('- Active theme ID:', this.activeThemeId);
        return 'ThemeService is working!';
    }
}

window.themeService = new ThemeService(); 