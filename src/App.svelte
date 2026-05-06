<script lang="ts">
  import * as fp from 'function-plot'
  import { AudioPlayer } from './lib/audio'
  import { hzToNoteName } from './lib/music'
  import { waveforms, sampleSegments, type WaveParams } from './lib/waveforms'
  const functionPlot = (fp as any).default?.default ?? (fp as any).default ?? fp

  const player = new AudioPlayer()
  const defaultParams = { amplitude: 1, freqSlider: 50, phase: 0, terms: 1 }

  let selectedWaveform = $state('sin')
  let playing = $state(false)
  let amplitude = $state(defaultParams.amplitude)
  let freqSlider = $state(defaultParams.freqSlider)
  let frequency = $derived(0.25 * Math.pow(16, freqSlider / 100))
  let phase = $state(defaultParams.phase)
  let terms = $state(defaultParams.terms)
  let container: HTMLDivElement

  let waveParams = $derived<WaveParams>({ amplitude, frequency, phase, options: { terms } })
  let displayExpr = $derived(waveforms[selectedWaveform].concreteExpr(waveParams))
  let noteLabel = $derived(waveforms[selectedWaveform].tonal ? `${Math.round(frequency * 440)}Hz / ${hzToNoteName(frequency * 440)}` : '')

  function resetParams() {
    amplitude = defaultParams.amplitude
    freqSlider = defaultParams.freqSlider
    phase = defaultParams.phase
    terms = defaultParams.terms
  }

  async function togglePlay() {
    if (playing) {
      player.stop()
      playing = false
      return
    }
    await player.start()
    player.setWaveform(selectedWaveform)
    player.tune(waveParams)
    playing = true
  }

  $effect(() => {
    const segments = sampleSegments(waveforms[selectedWaveform], waveParams)
    functionPlot({
      target: container,
      xAxis: { domain: [-10, 10] },
      yAxis: { domain: [-2, 2] },
      disableZoom: true,
      data: segments.map(points => ({ points, fnType: 'points', graphType: 'polyline', color: '#1f77b4' })),
    })
  })

  $effect(() => {
    player.tune(waveParams)
  })

  $effect(() => {
    player.setWaveform(selectedWaveform)
  })
</script>

<main>
  <h1>Wave Surfer</h1>
  <select bind:value={selectedWaveform}>
    {#each Object.keys(waveforms) as key}
      <option value={key}>{waveforms[key].name}: {waveforms[key].expr}</option>
    {/each}
  </select>
  <p>f(x) = {displayExpr}</p>
  <label>
    Amplitude: {(amplitude >= 0 ? '+' : '') + amplitude.toFixed(1)}
    <input type="range" min="-1" max="1" step="0.01" bind:value={amplitude} />
  </label>
  <label>
    Frequency: {frequency.toFixed(2)}{#if noteLabel}<span class="note-label"> ({noteLabel})</span>{/if}
    <input type="range" min="0" max="100" step="1" bind:value={freqSlider} />
  </label>
  <label>
    Phase: {(phase >= 0 ? '+' : '') + phase.toFixed(1)}
    <input type="range" min="-6.3" max="6.3" step="0.1" bind:value={phase} />
  </label>
  {#if selectedWaveform === 'maclaurinSin'}
  <label>
    Terms: {terms}
    <input type="range" min="1" max="10" step="1" bind:value={terms} />
  </label>
  {/if}
  <button onclick={resetParams}>Reset Params</button>
  <button onclick={togglePlay}>{playing ? 'Stop Sound' : 'Play Sound'}</button>
  <button onclick={() => player.exportWav()}>Download WAV</button>
  <div bind:this={container}></div>
</main>

<style>
  label {
    display: block;
    font-variant-numeric: tabular-nums;
  }

  .note-label {
    display: inline-block;
    width: 12ch;
  }
</style>
