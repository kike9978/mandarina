/** Browser TTS — no cloud. Best-effort; silent if unsupported. */
export function speakText(
  text: string,
  langHint?: string,
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    if (langHint) utter.lang = langHint
    utter.rate = 0.92
    window.speechSynthesis.speak(utter)
  } catch {
    /* ignore */
  }
}

export function ttsLangFor(languageId: string): string {
  switch (languageId) {
    case 'ja':
      return 'ja-JP'
    case 'zh':
      return 'zh-CN'
    case 'ko':
      return 'ko-KR'
    case 'ar':
      return 'ar-SA'
    case 'es':
      return 'es-ES'
    case 'id':
      return 'id-ID'
    default:
      return 'en-US'
  }
}
