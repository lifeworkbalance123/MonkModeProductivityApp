/** Web Audio helpers for Deep Work (no external deps). */

export function playChime() {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.setValueAtTime(528, ctx.currentTime)
    oscillator.frequency.setValueAtTime(396, ctx.currentTime + 0.5)
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 2)
    void ctx.resume().catch(() => {})
    setTimeout(() => {
      void ctx.close().catch(() => {})
    }, 2500)
  } catch {
    /* ignore */
  }
}

export type AmbientNoiseHandle = {
  ctx: AudioContext
  node: ScriptProcessorNode
  gain?: GainNode
}

export function createRainSound(): AmbientNoiseHandle {
  const ctx = new AudioContext()
  const bufferSize = 4096
  const brownNoise = ctx.createScriptProcessor(bufferSize, 1, 1)
  let lastOut = 0.0
  brownNoise.onaudioprocess = (e) => {
    const output = e.outputBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      output[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = output[i]
      output[i] *= 3.5
    }
  }
  const gain = ctx.createGain()
  gain.gain.value = 0.12
  brownNoise.connect(gain)
  gain.connect(ctx.destination)
  void ctx.resume().catch(() => {})
  return { ctx, node: brownNoise, gain }
}

export function createWhiteNoise(): AmbientNoiseHandle {
  const ctx = new AudioContext()
  const bufferSize = 4096
  const whiteNoise = ctx.createScriptProcessor(bufferSize, 1, 1)
  whiteNoise.onaudioprocess = (e) => {
    const output = e.outputBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
  }
  const gainNode = ctx.createGain()
  gainNode.gain.value = 0.05
  whiteNoise.connect(gainNode)
  gainNode.connect(ctx.destination)
  void ctx.resume().catch(() => {})
  return { ctx, node: whiteNoise, gain: gainNode }
}

/** Low-passed brown noise + slow surf swell (ocean-ish). */
export function createOceanSound(): AmbientNoiseHandle {
  const ctx = new AudioContext()
  const bufferSize = 4096
  const node = ctx.createScriptProcessor(bufferSize, 1, 1)
  let lastOut = 0.0
  let t = 0
  node.onaudioprocess = (e) => {
    const output = e.outputBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      t += 1
      const white = Math.random() * 2 - 1
      lastOut = (lastOut + 0.04 * white) / 1.04
      const swell = Math.sin(t * 0.00015) * 0.25
      output[i] = lastOut * 2.2 + swell * 0.15
    }
  }
  const gain = ctx.createGain()
  gain.gain.value = 0.1
  node.connect(gain)
  gain.connect(ctx.destination)
  void ctx.resume().catch(() => {})
  return { ctx, node, gain }
}

export function stopAmbient(h: AmbientNoiseHandle | null) {
  if (!h) return
  try {
    h.node.disconnect()
    h.gain?.disconnect()
    void h.ctx.close().catch(() => {})
  } catch {
    /* ignore */
  }
}

/** Admin-uploaded MP3 loop (Deep Work). */
export function stopMp3Loop(audio: HTMLAudioElement | null) {
  if (!audio) return
  try {
    audio.pause()
    audio.src = ''
    audio.load()
  } catch {
    /* ignore */
  }
}

export function startMp3Loop(url: string, volume = 0.45): HTMLAudioElement {
  const el = new Audio(url)
  el.loop = true
  el.volume = volume
  void el.play().catch(() => {
    /* autoplay blocked until user gesture — Deep Work starts after tap */
  })
  return el
}
