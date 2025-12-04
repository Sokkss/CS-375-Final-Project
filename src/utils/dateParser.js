// This function tries its best to parse a timestamp from a date string of unknown format. It will not always work.
function parseDateString(dateString) {
    if (!dateString) {
        return null;
    }

    const trimmed = dateString.trim();
    if (trimmed.length === 0) {
        return null;
    }

    if (trimmed.toLowerCase().includes('dates vary') || 
        trimmed.toLowerCase().includes('varies') ||
        trimmed.toLowerCase().includes('multiple dates')) {
        return null;
    }

    const now = new Date();
    let parsedDate = null;

    // This behemoth regex (thanks AI) is checking for a full date and time string, ex: Sunday, December 4th at 1:00 PM
    let match = trimmed.match(/(?:through|until|from|on)?\s*([A-Za-z]+day)?\s*,?\s*([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})\s+(?:at\s+)?(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
        const monthName = match[2];
        const monthIndex = getMonthIndex(monthName);
        if (monthIndex >= 0) {
            const day = parseInt(match[3]);
            const year = parseInt(match[4]);
            let hours = parseInt(match[5]);
            const minutes = parseInt(match[6]);
            const ampm = match[7].toUpperCase();
            
            if (ampm === 'PM' && hours !== 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            
            parsedDate = new Date(year, monthIndex, day, hours, minutes, 0);
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString();
            }
        }
    }
    
    // Another behemoth checking for a full date string, ex: Sunday, December 4th
    match = trimmed.match(/(?:through|until|from|on)?\s*([A-Za-z]+day)?\s*,?\s*([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/i);
    if (match) {
        const monthName = match[2];
        const monthIndex = getMonthIndex(monthName);
        if (monthIndex >= 0) {
            const day = parseInt(match[3]);
            const year = parseInt(match[4]);
            
            parsedDate = new Date(year, monthIndex, day, 12, 0, 0);
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString();
            }
        }
    }
    
    // Relative dates like Today, Tomorrow
    match = trimmed.match(/^(today|tomorrow)$/i);
    if (match) {
        if (match[1].toLowerCase() === 'today') {
            parsedDate = new Date(now);
        } else {
            parsedDate = new Date(now);
            parsedDate.setDate(parsedDate.getDate() + 1);
        }
        parsedDate.setHours(12, 0, 0, 0);
        return parsedDate.toISOString();
    }
    
    // Day of week (no date) with time like Sunday 1:00 PM or Sunday at 1:00 PM
    match = trimmed.match(/^([A-Za-z]+day)\s+(?:at\s+)?(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
        const dayName = match[1];
        let hours = parseInt(match[2]);
        const minutes = parseInt(match[3]);
        const ampm = match[4].toUpperCase();
        
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        parsedDate = findNextDayOfWeek(dayName, hours, minutes);
        if (parsedDate) {
            return parsedDate.toISOString();
        }
    }
    
    // Day of week only like Sunday
    match = trimmed.match(/^([A-Za-z]+day)$/i);
    if (match) {
        const dayName = match[1];
        parsedDate = findNextDayOfWeek(dayName, 12, 0);
        if (parsedDate) {
            return parsedDate.toISOString();
        }
    }

    // Try native date parsing as last resort
    parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear();
        if (year === now.getFullYear()) {
            parsedDate.setHours(12, 0, 0, 0);
            return parsedDate.toISOString();
        }
    }

    return null;
}

function getMonthIndex(monthName) {
    const months = {
        'january': 0, 'february': 1, 'march': 2, 'april': 3,
        'may': 4, 'june': 5, 'july': 6, 'august': 7,
        'september': 8, 'october': 9, 'november': 10, 'december': 11
    };
    return months[monthName.toLowerCase()] ?? -1;
}

function findNextDayOfWeek(dayName, hours = 12, minutes = 0) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = dayNames.indexOf(dayName.toLowerCase());
    
    if (targetDay === -1) {
        return null;
    }

    const now = new Date();
    const currentDay = now.getDay();
    let daysUntilTarget = targetDay - currentDay;

    if (daysUntilTarget < 0) {
        daysUntilTarget += 7;
    } else if (daysUntilTarget === 0) {
        const targetTime = new Date(now);
        targetTime.setHours(hours, minutes, 0, 0);
        if (now > targetTime) {
            daysUntilTarget = 7;
        }
    }

    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysUntilTarget);
    targetDate.setHours(hours, minutes, 0, 0);
    
    return targetDate;
}

module.exports = { parseDateString };
