/** Short, quiet confirmation chime for task completion. */
export function playCompleteSound(): void {
  const AudioCtor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) return

  try {
    const context = new AudioCtor()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.value = 660
    gain.gain.value = 0.035
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18)
    oscillator.stop(context.currentTime + 0.2)
    oscillator.onended = () => void context.close()
  } catch {
    // Autoplay policies can reject audio before a gesture; silence is fine.
  }
}
