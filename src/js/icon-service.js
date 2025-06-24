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

function updateIcon(iconId, newName, newColor) {
    let icons = getIcons();
    const iconIndex = icons.findIndex(i => i.id === iconId);
    if(iconIndex > -1) {
        if(newName !== undefined) {
            icons[iconIndex].name = newName;
        }
        if(newColor !== undefined) {
            icons[iconIndex].color = newColor;
        }
        saveIcons(icons);
    }
}

window.iconService = {
    getIcons,
    addIcon,
    deleteIcon,
    updateIcon
}; 