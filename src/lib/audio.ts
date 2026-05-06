import processorUrl from './worklets/wave-processor.ts?worker&url'
import { waveforms, type WaveParams } from './waveforms'

export class AudioPlayer {
  private audioCtx: AudioContext | null = null
  private node: AudioWorkletNode | null = null
  private waveformKey = 'sin'
  private params: WaveParams = { amplitude: 1, frequency: 1, phase: 0 }

  async start(): Promise<void> {
    if (this.audioCtx) return
    this.audioCtx = new AudioContext()
    await this.audioCtx.audioWorklet.addModule(processorUrl)
    this.node = new AudioWorkletNode(this.audioCtx, 'wave-processor')
    this.node.connect(this.audioCtx.destination)
  }

  stop(): void {
    this.node?.disconnect()
    this.audioCtx?.close()
    this.node = null
    this.audioCtx = null
  }

  setWaveform(key: string): void {
    this.waveformKey = key
    this.node?.port.postMessage({ fn: key })
  }

  tune(params: WaveParams): void {
    this.params = params
    if (!this.node) return
    const { amplitude, frequency, phase } = params
    for (const [key, value] of Object.entries({ amplitude, frequency, phase }) as [string, number][]) {
      const param = this.node.parameters.get(key)
      if (param) param.value = value
    }
  }

  exportWav(durationSec = 2): void {
    const samples = this.renderSamples(durationSec)
    const blob = this.encodePcmToWav(samples)
    const { amplitude, frequency, phase, options } = this.params
    const termsSuffix = options?.terms != null ? `_t${options.terms}` : ''
    const filename = `${this.waveformKey}_${durationSec}s_a${amplitude.toFixed(2)}_f${frequency.toFixed(2)}_p${phase.toFixed(1)}${termsSuffix}.wav`
    this.downloadBlob(blob, filename)
  }

  private renderSamples(durationSec: number): Float32Array {
    const sampleRate = 44100
    const sampleCount = sampleRate * durationSec
    const { amplitude, frequency, phase } = this.params
    const waveform = waveforms[this.waveformKey]
    const a4Hz = 440
    const increment = (2 * Math.PI * frequency * a4Hz) / sampleRate

    const samples = new Float32Array(sampleCount)
    let angle = 0
    for (let i = 0; i < sampleCount; i++) {
      samples[i] = amplitude * waveform.fn(angle + phase)
      angle += increment
    }
    return samples
  }

  private encodePcmToWav(samples: Float32Array): Blob {
    const sampleRate = 44100
    const wavHeaderSize = 44
    const buffer = new ArrayBuffer(wavHeaderSize + samples.length * 2)
    const view = new DataView(buffer)
    const encoder = new TextEncoder()
    const writeStr = (offset: number, str: string) => new Uint8Array(buffer).set(encoder.encode(str), offset)
    writeStr(0, 'RIFF')
    view.setUint32(4, 36 + samples.length * 2, true)
    writeStr(8, 'WAVE')
    writeStr(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeStr(36, 'data')
    view.setUint32(40, samples.length * 2, true)
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(wavHeaderSize + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true)
    }
    return new Blob([buffer], { type: 'audio/wav' })
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}
