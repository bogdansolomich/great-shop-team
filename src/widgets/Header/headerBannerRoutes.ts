const BANNER_HEADER_PATHS = ['/', '/catalog'] as const;

export function hasBannerHeader(pathname: string) {
  return BANNER_HEADER_PATHS.some((path) => {
    if (path === '/') {
      return pathname === '/';
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  });
}
