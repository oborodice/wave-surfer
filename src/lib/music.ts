export function hzToNoteName(hz: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const a4Midi = 69, a4Hz = 440, semitonesPerOctave = 12
  const midi = Math.round(a4Midi + semitonesPerOctave * Math.log2(hz / a4Hz))
  const octave = Math.floor(midi / semitonesPerOctave) - 1
  return noteNames[midi % semitonesPerOctave] + octave
}
