export const headerActionBaseClass =
  'inline-flex items-center justify-center border-b px-4 pt-2 pb-1 text-inherit transition-[border-color] duration-300 ease-in-out';

export function getHeaderActionClass(isActive: boolean) {
  return `${headerActionBaseClass} ${
    isActive ? 'border-current' : 'border-transparent hover:border-current'
  }`;
}

export function isActivePath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
