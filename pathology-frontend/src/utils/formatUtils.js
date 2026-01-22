/**
 * Converts a string to PascalCase (Title Case)
 * Each word starts with a capital letter, rest are lowercase
 * @param {string} str - The string to convert
 * @returns {string} - The PascalCase formatted string
 */
export const toPascalCase = (str) => {
    if (!str || typeof str !== 'string') return '';

    return str
        .trim()
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .split(' ')
        .map(word => {
            if (word.length === 0) return '';
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
};
