/**
 * Farm Despatch Date & Time Formatting Utilities
 * Standardizes all date/time representations to:
 * - Date: dd-mmm-yy (e.g. "13-Oct-26")
 * - Time: hh:mm am/pm (e.g. "03:30 PM")
 * - Combined: dd-mmm-yy hh:mm am/pm (e.g. "13-Oct-26 03:30 PM")
 * 
 * Completely eliminates Google Sheets 1899 epoch artifacts ("Sat, Dec 30 1899..."),
 * excessive day/timezone strings, and non-standard timestamps.
 */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format date string or Date object into 'dd-mmm-yy' (e.g. '13-Oct-26')
 */
export function formatFarmDate(val?: string | Date | null): string {
    if (!val) return '';

    // If string contains 1899 (Google Sheets time-only serial), ignore it
    if (typeof val === 'string' && val.includes('1899')) {
        return '';
    }

    if (val instanceof Date) {
        if (isNaN(val.getTime()) || val.getFullYear() <= 1900) return '';
        const dd = String(val.getDate()).padStart(2, '0');
        const mmm = MONTH_NAMES[val.getMonth()];
        const yy = String(val.getFullYear()).slice(-2);
        return `${dd}-${mmm}-${yy}`;
    }

    const s = String(val).trim();
    if (!s) return '';

    // Handle YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
    const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        if (year <= 1900) return '';
        const monthIdx = parseInt(isoMatch[2], 10) - 1;
        const day = parseInt(isoMatch[3], 10);
        const dd = String(day).padStart(2, '0');
        const mmm = MONTH_NAMES[monthIdx] || String(monthIdx + 1);
        const yy = String(year).slice(-2);
        return `${dd}-${mmm}-${yy}`;
    }

    // Handle DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const monthIdx = parseInt(dmyMatch[2], 10) - 1;
        let year = parseInt(dmyMatch[3], 10);
        if (year < 100) year += 2000;
        if (year <= 1900) return '';
        const dd = String(day).padStart(2, '0');
        const mmm = MONTH_NAMES[monthIdx] || String(monthIdx + 1);
        const yy = String(year).slice(-2);
        return `${dd}-${mmm}-${yy}`;
    }

    // Try parsing as generic date
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
        const dd = String(parsed.getDate()).padStart(2, '0');
        const mmm = MONTH_NAMES[parsed.getMonth()];
        const yy = String(parsed.getFullYear()).slice(-2);
        return `${dd}-${mmm}-${yy}`;
    }

    return s;
}

/**
 * Format time string or Date object into 'hh:mm AM/PM' (e.g. '03:30 PM')
 */
export function formatFarmTime(val?: string | Date | null): string {
    if (!val) return '';

    if (val instanceof Date) {
        if (isNaN(val.getTime())) return '';
        let h = val.getHours();
        const m = String(val.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        const hh = String(h).padStart(2, '0');
        return `${hh}:${m} ${ampm}`;
    }

    const s = String(val).trim();
    if (!s) return '';

    // If already in 12-hour format e.g. "03:30 PM" or "3:30 pm"
    const ampmMatch = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|am|pm)$/i);
    if (ampmMatch) {
        let h = parseInt(ampmMatch[1], 10);
        const m = ampmMatch[2];
        const ampm = ampmMatch[3].toUpperCase();
        h = h % 12 || 12;
        const hh = String(h).padStart(2, '0');
        return `${hh}:${m} ${ampm}`;
    }

    // If 24-hour e.g. "15:30" or "09:15:00"
    const militaryMatch = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (militaryMatch) {
        let h = parseInt(militaryMatch[1], 10);
        const m = militaryMatch[2];
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        const hh = String(h).padStart(2, '0');
        return `${hh}:${m} ${ampm}`;
    }

    // If date string containing time (e.g. "Sat Dec 30 1899 15:30:00 GMT+0530..." or ISO string)
    const timeInStr = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (timeInStr) {
        let h = parseInt(timeInStr[1], 10);
        const m = timeInStr[2];
        const isPm = /pm/i.test(s) || (!/am/i.test(s) && h >= 12);
        const ampm = isPm ? 'PM' : 'AM';
        h = h % 12 || 12;
        const hh = String(h).padStart(2, '0');
        return `${hh}:${m} ${ampm}`;
    }

    return s;
}

/**
 * Format combined date and time:
 * Returns: "dd-mmm-yy hh:mm AM/PM" (e.g. "13-Oct-26 03:30 PM")
 */
export function formatFarmDateTime(dateVal?: string | Date | null, timeVal?: string | Date | null): string {
    const formattedDate = formatFarmDate(dateVal);
    // If timeVal is not provided, check if dateVal contains time
    const formattedTime = formatFarmTime(timeVal || (typeof dateVal === 'string' && (dateVal.includes('T') || dateVal.includes(':')) ? dateVal : undefined));

    if (formattedDate && formattedTime) {
        return `${formattedDate} ${formattedTime}`;
    }
    if (formattedDate) return formattedDate;
    if (formattedTime) return formattedTime;
    return '';
}
