const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
const KNOWN_CDN_PATTERNS = [
  'images.unsplash.com',
  'images.pexels.com',
  'cdn.pixabay.com',
];

export function isDirectImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    if (IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
      return true;
    }
    return KNOWN_CDN_PATTERNS.some((cdn) => parsed.hostname.includes(cdn));
  } catch {
    return false;
  }
}

export function sanitizeUnsplashUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('unsplash.com') && !parsed.searchParams.has('w')) {
      parsed.searchParams.set('w', '1920');
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}
