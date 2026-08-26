/**
 * Persian Digits Global Input Handler and Formatter
 * Automatically converts entered and displayed Latin digits into Persian digits across all application pages
 */

export const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
export const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Converts any Latin digits (0-9) to Persian numerals (۰-۹)
 */
export function toPersianDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str.replace(/[0-9]/g, (w) => PERSIAN_DIGITS[parseInt(w, 10)]);
}

/**
 * Converts Persian numerals (۰-۹) to standard English digits (0-9)
 */
export function toEnglishDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str.replace(/[۰-۹]/g, (w) => String(PERSIAN_DIGITS.indexOf(w)));
}

/**
 * Global input listener that seamlessly converts typed Latin digits into Persian digits
 * while typing or pasting in any form input or textarea.
 */
export function initPersianDigitsAutoConvert(): void {
  if (typeof window === 'undefined') return;

  const isExcludedInput = (target: HTMLElement): boolean => {
    if (target instanceof HTMLInputElement) {
      // Exclude password, email, file, color, url where latin characters are strictly required
      const excludedTypes = ['password', 'email', 'file', 'color', 'url'];
      if (excludedTypes.includes(target.type)) return true;
      if (target.dataset.allowLatin === 'true') return true;
    }
    return false;
  };

  const handleInputEvent = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target) return;
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return;
    if (isExcludedInput(target)) return;

    const val = target.value;
    if (val && /[0-9]/.test(val)) {
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const converted = toPersianDigits(val);
      
      if (converted !== val) {
        target.value = converted;

        // Trigger react-compatible synthetic event so state updates with the Persian digits
        const event = new Event('input', { bubbles: true, cancelable: true });
        // Only set selection range for supported text inputs
        try {
          if (start !== null && end !== null && typeof target.setSelectionRange === 'function') {
            target.setSelectionRange(start, end);
          }
        } catch {
          // Ignore for input types that do not support selection
        }
      }
    }
  };

  // Attach in capture phase to process early
  window.addEventListener('input', handleInputEvent, true);
  window.addEventListener('paste', () => {
    setTimeout(() => {
      const activeEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        handleInputEvent({ target: activeEl } as unknown as Event);
      }
    }, 10);
  }, true);
}
