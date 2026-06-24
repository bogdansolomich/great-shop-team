/** Shared layout & typography for all auth overlay screens */
export const authForm = {
  panel:
    'relative z-1 box-border min-h-full w-full max-w-full overflow-x-hidden bg-white px-20 py-6 max-md:px-4',
  content: 'box-border flex w-full max-w-full flex-col',
  title:
    'm-0 mb-2 font-(family-name:--font-unbounded) text-[24px] font-bold leading-tight text-dark',
  subtitle: 'm-0 mb-6 text-sm font-normal leading-snug text-gray',
  fieldLabel: 'text-sm text-dark',
  form: 'flex w-full max-w-full flex-col gap-2',
  inputContainer: 'flex flex-col',
  submitBtn:
    'mt-2 w-full cursor-pointer rounded-lg border-0 bg-dark px-[18px] py-[18px] text-base font-medium text-white transition-all duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-50',
  errorBanner:
    'mb-4 box-border w-full max-w-full rounded-md border border-[#ffccc7] bg-[#fff2f0] px-3 py-2 text-center text-sm break-words text-[#e40014]',
  successBanner:
    'mb-4 box-border w-full max-w-full rounded-md border border-success-border bg-success-bg px-3 py-2 text-center text-sm break-words text-success',
  errorText: 'm-0 text-sm leading-5 text-error',
  successText: 'm-0 text-sm leading-5 text-success',
  footer: 'mt-4 w-full text-right text-sm font-normal text-dark',
  footerLinkBtn:
    'cursor-pointer border-0 bg-transparent p-0 font-semibold text-dark hover:underline',
  checkbox:
    'peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white transition-all checked:border-dark checked:bg-dark',
  checkboxIcon:
    'pointer-events-none absolute top-1/2 left-1 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100',
  checkboxLabel: 'text-sm text-dark select-none',
  socialRow: 'flex items-center justify-center gap-6',
  socialBtn: 'flex h-10 w-10 items-center justify-center',
  socialIcon: 'h-6 w-6',
  codeInput:
    'h-12 w-12 shrink-0 rounded-[10px] border border-dark bg-white text-center text-base font-medium text-dark outline-none focus:border-dark',
  closeBtn:
    'absolute top-4 right-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-2xl leading-none font-normal text-gray transition-colors hover:text-dark max-md:top-3 max-md:right-3',
} as const;

export const authPanel = {
  root: authForm.panel,
  back: 'mb-8 flex h-10 w-10 cursor-pointer items-center justify-center self-start border-0 bg-transparent p-0 text-[36px] leading-none font-normal text-gray',
  title: authForm.title,
  subtitle: authForm.subtitle,
  subtitleLinkEmail: 'm-0 mb-8 text-sm leading-snug font-normal text-gray',
  emailHighlight: 'font-medium text-dark',
  form: authForm.form,
  errorText: authForm.errorText,
  successText: authForm.successText,
  submitBtn: authForm.submitBtn,
  footerLink: 'mt-auto pt-10 text-right text-sm font-normal text-dark',
  welcomeFooter: 'mt-auto pt-10 text-right text-sm font-normal text-dark',
  linkButton: authForm.footerLinkBtn,
  resendTimer:
    'inline-flex items-center gap-1 no-underline [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
  codeRow: 'mb-2 flex max-w-full flex-wrap gap-3',
  codeInput: authForm.codeInput,
  illustration: 'm-0 mb-6 flex justify-center',
} as const;

export const loginForm = {
  panel: `${authForm.panel} flex min-h-full flex-col justify-center`,
  content: `${authForm.content} mt-8 md:mt-12`,
  title: authForm.title,
  subtitle: authForm.subtitle,
  form: authForm.form,
  inputContainer: authForm.inputContainer,
  optionalRow: 'flex flex-wrap items-center justify-between gap-3',
  forgotBtn:
    'cursor-pointer border-0 bg-transparent p-0 text-sm font-normal text-dark hover:underline',
  errorMessage: authForm.errorBanner,
  successMessage: authForm.successBanner,
  loginBtn: authForm.submitBtn,
  registerVariant: authForm.footer,
  registerLink: authForm.footerLinkBtn,
  checkboxWrap: 'relative inline-flex cursor-pointer items-center gap-2',
  checkboxInput: authForm.checkbox,
  checkboxIcon: authForm.checkboxIcon,
  checkboxLabel: authForm.checkboxLabel,
  socialRow: authForm.socialRow,
  socialBtn: authForm.socialBtn,
  socialIcon: authForm.socialIcon,
} as const;

export const registerForm = {
  panel:
    'relative z-1 box-border flex min-h-full w-full max-w-full flex-col justify-center overflow-x-hidden bg-white px-20 py-4 max-md:px-4',
  content: authForm.content,
  title: authForm.title,
  subtitle: 'm-0 mb-4 text-sm font-normal leading-snug text-gray',
  form: authForm.form,
  inputContainer: authForm.inputContainer,
  submitBtn: authForm.submitBtn,
  errorMessage: authForm.errorBanner,
  loginVariant: authForm.footer,
  loginLink: `${authForm.footerLinkBtn} ml-1`,
  socialRow: authForm.socialRow,
  socialBtn: authForm.socialBtn,
  socialIcon: authForm.socialIcon,
  checkbox: authForm.checkbox,
  checkboxIcon: authForm.checkboxIcon,
} as const;
