// Renderiza a pauta (clave de Sol) em SVG via VexFlow a partir da sequência
// de execução. Quando a tonalidade é informada, desenha a ARMADURA DE CLAVE e
// deixa o VexFlow gerenciar os acidentes (só mostra os de fora da armadura),
// para bater com a folha "escalas a praticar". Sem tonalidade, escreve os
// acidentes nota a nota, respeitando a grafia enarmônica.

import { Renderer, Stave, StaveNote, Accidental, Formatter, Voice } from 'vexflow'
import { vexKeyFromName } from './notes.js'

const NOTE_WIDTH = 42

export function renderStaff(container, playSeq, tonalidade = null) {
  container.innerHTML = ''
  const n = Math.max(playSeq.length, 1)
  const width = 110 + n * NOTE_WIDTH
  const height = 150

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(width, height)
  const context = renderer.getContext()

  const stave = new Stave(10, 24, width - 30)
  stave.addClef('treble')

  let usouArmadura = false
  if (tonalidade) {
    try {
      stave.addKeySignature(tonalidade)
      usouArmadura = true
    } catch {
      usouArmadura = false
    }
  }
  stave.setContext(context).draw()

  if (playSeq.length === 0) return container.querySelector('svg')

  const notes = playSeq.map((m) => {
    const { key, accidental } = vexKeyFromName(m.nota, m.abs)
    const sn = new StaveNote({ keys: [key], duration: 'q' })
    // sem armadura: escreve o acidente da própria nota
    if (!usouArmadura && accidental) sn.addModifier(new Accidental(accidental), 0)
    return sn
  })

  const voice = new Voice({ num_beats: notes.length, beat_value: 4 })
  voice.setStrict(false)
  voice.addTickables(notes)

  // com armadura: o VexFlow decide quais acidentes mostrar (fora da armadura)
  if (usouArmadura) {
    try {
      Accidental.applyAccidentals([voice], tonalidade)
    } catch {
      /* se falhar, segue sem acidentes automáticos */
    }
  }

  new Formatter().joinVoices([voice]).format([voice], width - 120)
  voice.draw(context, stave)

  return container.querySelector('svg')
}
