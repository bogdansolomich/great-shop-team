// Явно указываем страницы, где сверху лежит баннер
const BANNER_HEADER_PATHS = [
  '/',
  '/catalog',
  '/catalog/men',
  '/catalog/women',
  '/catalog/accessories',
] as const;

export function hasBannerHeader(pathname: string) {
  return BANNER_HEADER_PATHS.some((path) => {
    return pathname === path;
  });
}
