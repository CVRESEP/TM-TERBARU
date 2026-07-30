/**
 * Formats a raw number or string of digits into Indonesian thousand separators (e.g. 2500000 -> "2.500.000")
 */
export const formatCurrencyInput = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('id-ID').format(Number(digits));
};

/**
 * Parses a formatted currency string back to a numeric value.
 * e.g. "2.500.000" -> 2500000
 */
export const parseCurrencyInput = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  const digits = String(val).replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

/**
 * Formats a date string (YYYY-MM-DD or ISO string) into DD-MM-YYYY for display across the application.
 * e.g. "2026-07-30" -> "30-07-2026"
 */
export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '-';
  const str = String(dateStr).split('T')[0];
  const parts = str.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year.length === 4) {
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    }
  }
  return dateStr;
};
