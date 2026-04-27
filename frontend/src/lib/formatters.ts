// src/lib/formatters.ts
import { format, formatDistanceToNow, isValid } from 'date-fns';
import { DATE_FORMAT, TIME_FORMAT, DATETIME_FORMAT, CURRENCY } from './constants';

/**
 * Formats a date string or Date object
 * @param date - Date string (ISO) or Date object
 * @param formatStr - date-fns format string (default: 'MMM dd, yyyy')
 * @returns Formatted date or 'Invalid date' if parsing fails
 */
export const formatDate = (
    date: string | Date | null | undefined,
    formatStr = DATE_FORMAT
): string => {
    if (!date) return '—';
    const parsed = new Date(date);
    return isValid(parsed) ? format(parsed, formatStr) : 'Invalid date';
};

/**
 * Formats time only
 */
export const formatTime = (date: string | Date | null | undefined): string => {
    if (!date) return '—';
    const parsed = new Date(date);
    return isValid(parsed) ? format(parsed, TIME_FORMAT) : 'Invalid time';
};

/**
 * Formats full date + time
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
    if (!date) return '—';
    const parsed = new Date(date);
    return isValid(parsed) ? format(parsed, DATETIME_FORMAT) : 'Invalid datetime';
};

/**
 * Relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
    if (!date) return '—';
    const parsed = new Date(date);
    return isValid(parsed) ? formatDistanceToNow(parsed, { addSuffix: true }) : 'Invalid date';
};

/**
 * Formats amount as ETB currency (e.g., ETB 1,250.00)
 */
export const formatCurrency = (
    amount: number | string | null | undefined,
    locale = 'en-ET'
): string => {
    if (amount == null) return 'ETB 0.00';

    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return 'ETB 0.00';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: CURRENCY,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

/**
 * Formats distance in meters → human-readable (m / km)
 */
export const formatDistance = (meters: number | null | undefined): string => {
    if (meters == null || meters < 0) return '—';
    if (meters < 1000) return `${meters.toFixed(0)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
};

/**
 * Formats Ethiopian phone numbers (e.g., +251912345678 → +251 912 345 678)
 */
export const formatPhone = (phone: string | null | undefined): string => {
    if (!phone) return '—';

    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    // Ethiopian numbers usually start with 251 or 9
    if (cleaned.startsWith('251')) {
        const national = cleaned.slice(3);
        if (national.length === 9) {
            return `+251 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
        }
    } else if (cleaned.startsWith('9') && cleaned.length === 9) {
        return `+251 ${cleaned}`;
    }

    // Fallback: return original or cleaned
    return cleaned.length >= 9 ? `+251 ${cleaned.slice(-9)}` : phone;
};