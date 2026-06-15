export const INSTITUTION_LOGO_URL = 'https://i.imgur.com/cVBYyq3.png';

export const colors = {
    primary: 'blue-800', 
    secondary: 'red-600',
    light: 'white',
    darkText: 'gray-800',
    lightText: 'white',
    accent: 'blue-600',
    danger: 'red-600',
    warning: 'yellow-500',
};

export const DEFAULT_COLORS = ['#3182CE', '#38A169', '#DD6B20', '#805AD5', '#E53E3E'];

export const getTextColorForBackground = (hexColor) => {
    if (!hexColor || hexColor.length < 7) return 'text-white';
    try {
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'text-black' : 'text-white';
    } catch (e) {
        return 'text-white';
    }
};
