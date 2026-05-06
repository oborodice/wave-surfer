import { waveforms } from '../waveforms'

declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean
}
declare function registerProcessor(name: string, ctor: new () => AudioWorkletProcessor): void

class WaveProcessor extends AudioWorkletProcessor {
  private phase = 0
  private waveformFn: (x: number, options?: Record<string, number>) => number = Math.sin
  private options: Record<string, number> | undefined = undefined

  constructor() {
    super()
    this.port.onmessage = (e) => {
      const waveform = waveforms[e.data.fn]
      if (waveform) this.waveformFn = waveform.fn
      if ('options' in e.data) this.options = e.data.options
    }
  }

  static get parameterDescriptors() {
    return [
      { name: 'amplitude', defaultValue: 1, minValue: -1, maxValue: 1, automationRate: 'k-rate' },
      { name: 'frequency', defaultValue: 1, minValue: 0.25, maxValue: 4, automationRate: 'k-rate' },
      { name: 'phase', defaultValue: 0, minValue: -6.3, maxValue: 6.3, automationRate: 'k-rate' },
    ]
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const output = outputs[0][0]
    const amplitude = parameters.amplitude[0]
    const frequency = parameters.frequency[0]
    const phaseOffset = parameters.phase[0]
    const a4Hz = 440
    const increment = (2 * Math.PI * frequency * a4Hz) / 44100

    for (let i = 0; i < output.length; i++) {
      output[i] = amplitude * this.waveformFn(this.phase + phaseOffset, this.options)
      this.phase += increment
    }

    return true
  }
}

registerProcessor('wave-processor', WaveProcessor)
