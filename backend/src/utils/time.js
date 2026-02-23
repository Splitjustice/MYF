const { DateTime } = require('luxon');

const LONDON_TZ = 'Europe/London';

const WINDOWS = {
  ASIAN_RANGE: { startHour: 0, endHour: 5 },
  LONDON_KZ: { startHour: 7, endHour: 10 },
  NY_KZ: { startHour: 12, endHour: 15 }
};

const toLondonDateTime = (dateInput = new Date()) => {
  if (DateTime.isDateTime(dateInput)) return dateInput.setZone(LONDON_TZ);
  return DateTime.fromJSDate(new Date(dateInput), { zone: 'utc' }).setZone(LONDON_TZ);
};

const isWithinLondonWindow = (dateInput, window) => {
  const dt = toLondonDateTime(dateInput);
  const { startHour, endHour } = window;
  return dt.hour >= startHour && dt.hour < endHour;
};

const getSession = (dateInput = new Date()) => {
  if (isWithinLondonWindow(dateInput, WINDOWS.ASIAN_RANGE)) return 'Asian';
  if (isWithinLondonWindow(dateInput, WINDOWS.LONDON_KZ)) return 'London';
  if (isWithinLondonWindow(dateInput, WINDOWS.NY_KZ)) return 'NY';
  return 'Off';
};

const getKillzoneEndWithBuffer = (killzone, dateInput = new Date(), bufferMinutes = 15) => {
  const dt = toLondonDateTime(dateInput);
  const baseDate = dt.startOf('day');
  const endHour = killzone === 'London' ? WINDOWS.LONDON_KZ.endHour : WINDOWS.NY_KZ.endHour;
  return baseDate.plus({ hours: endHour, minutes: bufferMinutes });
};

module.exports = {
  LONDON_TZ,
  WINDOWS,
  toLondonDateTime,
  isWithinLondonWindow,
  getSession,
  getKillzoneEndWithBuffer
};
