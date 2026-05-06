const frac = (x: number) => x - Math.floor(x)

const factorial = (n: number) => {
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

export type WaveParams = {
  amplitude: number
  frequency: number
  phase: number
  options?: Record<string, number>
}

type Waveform = {
  name: string
  fn: (x: number, options?: Record<string, number>) => number
  expr: string
  concreteExpr: (params: WaveParams) => string
  tonal: boolean
  defaultOptions?: Record<string, number>
}

const buildExpr = ({ amplitude, frequency, phase }: WaveParams, template: (x: string) => string) => {
  const x = `${frequency.toFixed(2)} * x + ${phase.toFixed(1)}`
  return `${amplitude.toFixed(2)} * (${template(x)})`
}

export const waveforms: Record<string, Waveform> = {
  sin: {
    name: 'sin',
    fn: Math.sin,
    expr: 'sin(x)',
    concreteExpr: (params) => buildExpr(params, x => `sin(${x})`),
    tonal: true,
  },
  cos: {
    name: 'cos',
    fn: Math.cos,
    expr: 'cos(x)',
    concreteExpr: (params) => buildExpr(params, x => `cos(${x})`),
    tonal: true,
  },
  tan: {
    name: 'tan',
    fn: Math.tan,
    expr: 'tan(x)',
    concreteExpr: (params) => buildExpr(params, x => `tan(${x})`),
    tonal: false,
  },
  sec: {
    name: 'sec',
    fn: (x) => 1 / Math.cos(x),
    expr: '1/cos(x)',
    concreteExpr: (params) => buildExpr(params, x => `1/cos(${x})`),
    tonal: false,
  },
  csc: {
    name: 'csc',
    fn: (x) => 1 / Math.sin(x),
    expr: '1/sin(x)',
    concreteExpr: (params) => buildExpr(params, x => `1/sin(${x})`),
    tonal: false,
  },
  cot: {
    name: 'cot',
    fn: (x) => 1 / Math.tan(x),
    expr: '1/tan(x)',
    concreteExpr: (params) => buildExpr(params, x => `1/tan(${x})`),
    tonal: false,
  },
  square: {
    name: 'square',
    fn: (x) => Math.sign(Math.sin(x)),
    expr: 'sgn(sin(x))',
    concreteExpr: (params) => buildExpr(params, x => `sgn(sin(${x}))`),
    tonal: true,
  },
  sawtooth: {
    name: 'sawtooth',
    fn: (x) => 2 * frac(x / (2 * Math.PI)) - 1,
    expr: '2 * frac(x / 2π) - 1',
    concreteExpr: (params) => buildExpr(params, x => `2 * frac(${x} / 2π) - 1`),
    tonal: true,
  },
  triangle: {
    name: 'triangle',
    fn: (x) => 2 * Math.abs(2 * frac(x / (2 * Math.PI)) - 1) - 1,
    expr: '2 * |2 * frac(x / 2π) - 1| - 1',
    concreteExpr: (params) => buildExpr(params, x => `2 * |2 * frac(${x} / 2π) - 1| - 1`),
    tonal: true,
  },
  absSin: {
    name: 'rectified sin',
    fn: (x) => Math.abs(Math.sin(x)),
    expr: '|sin(x)|',
    concreteExpr: (params) => buildExpr(params, x => `|sin(${x})|`),
    tonal: true,
  },
  sinc: {
    name: 'sinc',
    fn: (x) => x === 0 ? 1 : Math.sin(x) / x,
    expr: 'sin(x) / x',
    concreteExpr: (params) => buildExpr(params, x => `sin(${x}) / (${x})`),
    tonal: false,
  },
  sinc2: {
    name: 'sinc²',
    fn: (x) => (x === 0 ? 1 : Math.sin(x) / x) ** 2,
    expr: '(sin(x) / x)²',
    concreteExpr: (params) => buildExpr(params, x => `(sin(${x}) / (${x}))²`),
    tonal: false,
  },
  octave: {
    name: 'octave',
    fn: (x) => Math.sin(x) + Math.sin(2 * x),
    expr: 'sin(x) + sin(2x)',
    concreteExpr: (params) => buildExpr(params, x => `sin(${x}) + sin(2(${x}))`),
    tonal: false,
  },
  majorChord: {
    name: 'major chord',
    fn: (x) => Math.sin(4 * x) + Math.sin(5 * x) + Math.sin(6 * x),
    expr: 'sin(4x) + sin(5x) + sin(6x)',
    concreteExpr: (params) => buildExpr(params, x => `sin(4(${x})) + sin(5(${x})) + sin(6(${x}))`),
    tonal: false,
  },
  chirp: {
    name: 'chirp',
    fn: (x) => Math.sin(x * x),
    expr: 'sin(x²)',
    concreteExpr: (params) => buildExpr(params, x => `sin((${x})²)`),
    tonal: false,
  },
  topologistsSin: {
    name: "topologist's sin",
    fn: (x) => x === 0 ? 0 : Math.sin(1 / x),
    expr: 'sin(1/x)',
    concreteExpr: (params) => buildExpr(params, x => `sin(1/(${x}))`),
    tonal: false,
  },
  morletWavelet: {
    name: 'morlet wavelet',
    fn: (x) => Math.exp(-x * x / 2) * Math.sin(x),
    expr: 'e^(-x²/2) * sin(x)',
    concreteExpr: (params) => buildExpr(params, x => `e^(-(${x})²/2) * sin(${x})`),
    tonal: false,
  },
  maclaurinSin: {
    name: 'maclaurin sin',
    fn: (x, options) => {
      let sum = 0
      for (let n = 0; n < options!.terms; n++) {
        sum += ((-1) ** n * x ** (2 * n + 1)) / factorial(2 * n + 1)
      }
      return sum
    },
    expr: 'Σ(n=0 to ∞) (-1)ⁿ x²ⁿ⁺¹/(2n+1)!',
    concreteExpr: (params) => buildExpr(params, x => `Σ [n=0..${params.options!.terms - 1}] (-1)ⁿ (${x})²ⁿ⁺¹/(2n+1)!`),
    tonal: false,
    defaultOptions: { terms: 1 },
  },
}

export function sampleSegments(
  waveform: Waveform,
  params: WaveParams,
  xMin = -10,
  xMax = 10,
  steps = 2000, // 一般的なディスプレイ幅は1920px程度。グラフ描画領域を800px想定すると1px1点以上になり十分滑らか
): [number, number][][] {
  const { amplitude, frequency, phase, options } = params
  const step = (xMax - xMin) / steps
  const discontinuityThreshold = 5 // yAxisの描画範囲[-2,2]を大きく超えた符号反転を漸近線とみなす
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
