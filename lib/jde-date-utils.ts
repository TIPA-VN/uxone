/**
 * JDE Date Utilities
 * Convert JDE Julian dates to Gregorian dates
 */

// Convert JDE Julian Date to Gregorian date
export function jdeJulianToGregorian(jdeJulian: number | string | null | undefined) {
    if (!jdeJulian) return null;
    
    // Convert to number if it's a string
    const jdeNum = typeof jdeJulian === 'string' ? parseInt(jdeJulian) : jdeJulian;
    
    if (isNaN(jdeNum) || jdeNum <= 0) return null;
    
    // JDE Julian format: CYYDDD where C=century, YY=year within century, DDD=day of year
    const jdeStr = jdeNum.toString().padStart(6, '0');
    
    const century = parseInt(jdeStr.substring(0, 1));
    const yearInCentury = parseInt(jdeStr.substring(1, 3));
    const dayOfYear = parseInt(jdeStr.substring(3, 6));
    
    // Calculate the actual year
    // Century 0 = 1900s, Century 1 = 2000s, etc.
    const year = 1900 + (century * 100) + yearInCentury;
    
    // Create date from year and day of year
    const startOfYear = new Date(year, 0, 1); // January 1st of the year
    const targetDate = new Date(startOfYear);
    targetDate.setDate(startOfYear.getDate() + dayOfYear - 1);
    
    return {
        year: targetDate.getFullYear(),
        month: targetDate.getMonth() + 1, // JavaScript months are 0-based
        day: targetDate.getDate(),
        date: targetDate,
        isoDate: targetDate.toISOString().split('T')[0]
    };
}

// Format JDE Julian date for display
export function formatJDEDate(jdeJulian: number | string | null | undefined): string {
    const result = jdeJulianToGregorian(jdeJulian);
    if (!result) return 'N/A';
    
    return result.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Get Date object from JDE Julian date
export function jdeJulianToDate(jdeJulian: number | string | null | undefined): Date | null {
    const result = jdeJulianToGregorian(jdeJulian);
    return result ? result.date : null;
}

// Get ISO date string from JDE Julian date
export function jdeJulianToISO(jdeJulian: number | string | null | undefined): string | null {
    const result = jdeJulianToGregorian(jdeJulian);
    return result ? result.isoDate : null;
} 