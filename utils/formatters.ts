
const formatNumber = (value: number, locale: string = 'fr-FR', options: Intl.NumberFormatOptions = {}) => {
    return new Intl.NumberFormat(locale, options).format(value);
};

/**
 * Formats a number into Moroccan Dirham (MAD) currency format.
 * e.g., 12345.67 -> "12 345,67 MAD"
 * @param value - The number to format.
 * @returns The formatted string.
 */
export const formatToMAD = (value: number | undefined | null): string => {
    if (value === undefined || value === null) {
        return 'N/A';
    }
    return `${formatNumber(value, 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
};

/**
 * Formats a number into thousands of Moroccan Dirhams (KDH) currency format.
 * e.g., 1234567 -> "1 234,57 KDH"
 * @param value - The number to format.
 * @returns The formatted string.
 */
export const formatToKDH = (value: number | undefined | null): string => {
    if (value === undefined || value === null) {
        return 'N/A';
    }
    return `${formatNumber(value / 1000, 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KDH`;
};

/**
 * Formats a number into millions of Moroccan Dirhams (MDH) currency format.
 * e.g., 1234567 -> "1,23 MDH"
 * @param value - The number to format.
 * @returns The formatted string.
 */
export const formatToMDH = (value: number | undefined | null): string => {
    if (value === undefined || value === null) {
        return 'N/A';
    }
    return `${formatNumber(value / 1_000_000, 'fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MDH`;
};
