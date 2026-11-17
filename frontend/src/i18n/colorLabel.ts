import type { Dictionary } from '@/i18n/locales/en';

/** Spellings that mean the same color as a dictionary key. */
const COLOR_ALIASES = new Map([
  ['grey', 'gray'],
  ['darkblue', 'navy'],
]);

/**
 * The API stores one (English) name per color. This shows it in the shopper's language, using the
 * `colors` section of the current dictionary. A color the dictionary does not know yet is shown
 * exactly as it was typed in the admin, so a new color never renders blank.
 */
export function getColorLabel(
  name: string | null | undefined,
  colors: Dictionary['colors'],
): string {
  const raw = (name ?? '').trim();
  if (!raw) return '';

  const key = raw.toLowerCase().replace(/[^a-z]/g, '');
  const dictionaryKey = COLOR_ALIASES.get(key) ?? key;

  return Object.prototype.hasOwnProperty.call(colors, dictionaryKey)
    ? (colors as Record<string, string>)[dictionaryKey]
    : raw;
}
