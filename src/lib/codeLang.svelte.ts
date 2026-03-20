let activeLang = $state('')

export function getSharedLang(): string {
  return activeLang
}

export function setSharedLang(lang: string): void {
  activeLang = lang
}
