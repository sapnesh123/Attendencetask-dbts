// server/helpers/dateUtils.js

/**
 * Gets the start of a day in IST (UTC+5:30)
 * @param {Date|string} date - Input date
 * @returns {Date} - Start of day (00:00:00) in IST, as a UTC Date object
 */
export const getStartOfDayIST = (date = new Date()) => {
    const d = new Date(date);
    // Convert to IST (UTC + 5.5 hours)
    // Shift the date to the beginning of the IST day, then adjust back to UTC
    // 00:00 IST is 18:30 UTC of previous day
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utcTime = d.getTime();
    const istTime = utcTime + istOffset;
    const istDate = new Date(istTime);

    istDate.setUTCHours(0, 0, 0, 0);

    return new Date(istDate.getTime() - istOffset);
};

/**
 * Gets the end of a day in IST (UTC+5:30)
 * @param {Date|string} date - Input date
 * @returns {Date} - End of day (23:59:59.999) in IST, as a UTC Date object
 */
export const getEndOfDayIST = (date = new Date()) => {
    const d = new Date(date);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = d.getTime() + istOffset;
    const istDate = new Date(istTime);

    istDate.setUTCHours(23, 59, 59, 999);

    return new Date(istDate.getTime() - istOffset);
};

/**
 * Gets the start of a month in IST
 */
export const getStartOfMonthIST = (date = new Date()) => {
    const d = new Date(date);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(d.getTime() + istOffset);

    istDate.setUTCDate(1);
    istDate.setUTCHours(0, 0, 0, 0);

    return new Date(istDate.getTime() - istOffset);
};

/**
 * Gets the end of a month in IST
 */
export const getEndOfMonthIST = (date = new Date()) => {
    const d = new Date(date);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(d.getTime() + istOffset);

    istDate.setUTCMonth(istDate.getUTCMonth() + 1);
    istDate.setUTCDate(0);
    istDate.setUTCHours(23, 59, 59, 999);

    return new Date(istDate.getTime() - istOffset);
};
