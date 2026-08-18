import slugify from 'slugify';

export function createSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
    replacement: '-',
  });
}

export function createUniqueSlug(text: string, suffix?: string | number): string {
  const base = createSlug(text);
  if (suffix !== undefined) {
    return `${base}-${suffix}`;
  }
  return base;
}
