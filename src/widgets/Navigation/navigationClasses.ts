export const catalogNavMenu = {
  trigger: 'relative',
  dropdown: 'absolute top-full left-1/2 z-100 -translate-x-1/2 pt-1',
  panel:
    'min-w-[320px] rounded-sm border border-black/5 bg-white py-3 text-dark shadow-[0_8px_24px_rgb(0_0_0/8%)]',
  panelList: 'flex flex-col',
  panelLink:
    'block px-6 py-2.5 text-xs font-normal tracking-wide transition-colors hover:bg-black/5',
  panelLinkActive: 'bg-black/5',
} as const;
