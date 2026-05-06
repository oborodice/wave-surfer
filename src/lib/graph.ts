import { type Waveform, type WaveParams } from './waveforms'

export function sampleSegments(
  waveform: Waveform,
  params: WaveParams,
  xMin = -10,
  xMax = 10,
  steps = 2000,
): [number, number][][] {
  const { amplitude, frequency, phase, options } = params
  const step = (xMax - xMin) / steps
  const discontinuityThreshold = 5
  const segments: [number, number][][] = [[]]
  let prevY = NaN
  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * step
    const y = amplitude * waveform.fn(frequency * x + phase, options)
    if (!isFinite(y)) {
      segments.push([])
      prevY = NaN
      continue
    }
    if ((prevY > discontinuityThreshold && y < -discontinuityThreshold) || (prevY < -discontinuityThreshold && y > discontinuityThreshold)) {
      segments.push([])
    }
    segments[segments.length - 1].push([x, y])
    prevY = y
  }
  return segments.filter(s => s.length > 0)
}
