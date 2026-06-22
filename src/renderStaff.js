// Renderiza a pauta (clave de Sol) em SVG via VexFlow no formato da folha
// "escalas a praticar": semicolcheias com barras de ligação (beaming) em grupos
// de 4, ida + volta numa linha só, armadura de clave por tonalidade e grafia
// enarmônica. Sem tonalidade, escreve os acidentes nota a nota.

import { Renderer, Stave, StaveNote, Accidental, Beam, Formatter, Voice } from 'vexflow'
import { vexKeyFromName } from './notes.js'

const NOTE_WIDTH = 27

export function renderStaff(container, seq, tonalidade = null) {
  container.innerHTML = ''
  const n = Math.max(seq.length, 1)
  const width = 120 + n * NOTE_WIDTH
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

  if (seq.length === 0) return container.querySelector('svg')

  const notes = seq.map((m) => {
    const { key, accidental } = vexKeyFromName(m.nota, m.abs)
    const sn = new StaveNote({ keys: [key], duration: '16' })
    if (!usouArmadura && accidental) sn.addModifier(new Accidental(accidental), 0)
    return sn
  })

  const voice = new Voice({ num_beats: notes.length, beat_value: 16 })
  voice.setStrict(false)
  voice.addTickables(notes)

  if (usouArmadura) {
    try {
      Accidental.applyAccidentals([voice], tonalidade)
    } catch {
      /* segue sem acidentes automáticos */
    }
  }

  // barras de ligação (beaming) em grupos de 4 semicolcheias (= 1 tempo)
  const beams = []
  for (let i = 0; i < notes.length; i += 4) {
    const grupo = notes.slice(i, i + 4)
    if (grupo.length >= 2) beams.push(new Beam(grupo))
  }

  new Formatter().joinVoices([voice]).format([voice], width - 130)
  voice.draw(context, stave)
  beams.forEach((b) => b.setContext(context).draw())

  return container.querySelector('svg')
}
