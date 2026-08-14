export function scopeKeyFor(url) {
  let key = '';
  try {
    const parsed = new URL(String(url));
    const isWeb = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    if (isWeb) {
      key = parsed.hostname.toLowerCase();
    }
  } catch (error) {
    key = '';
  }
  return key;
}
