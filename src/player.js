// Toca a sequência de notas usando Strudel (carregado via CDN como global).
// `note()`, `hush()`, `setcps()`, `initStrudel()` vêm do script @strudel/web.
//
// Converte cada nota para MIDI (abs + 12, pois nossa convenção tem C4 = 48 e
// o MIDI tem C4 = 60) e dispara um "stepper" que acende a nota atual no braço.

let inited = false
let timer = null

export function strudelDisponivel() {
  // note()/hush()/setcps() só viram globais DEPOIS de initStrudel(); aqui basta
  // o initStrudel estar carregado (via CDN).
  return typeof window.initStrudel === 'function'
}

// playSeq: itens com { abs }. msPorNota: duração de cada nota. instrumento: string.
// onStep(i): chamado com o índice da nota atual (ou -1 ao terminar).
export async function tocar(playSeq, msPorNota, instrumento, onStep) {
  if (!strudelDisponivel()) throw new Error('Strudel não carregou (precisa de internet).')
  if (!inited) {
    await window.initStrudel() // registra note()/hush()/setcps() e prepara o áudio
    inited = true
  }
  parar()
  const n = playSeq.length
  if (!n) return

  const midis = playSeq.map((p) => p.abs + 12).join(' ')
  const secPorNota = msPorNota / 1000
  // note(midis) coloca as n notas em 1 ciclo. Com .slow(fator) o ciclo passa a
  // durar fator/cps segundos, então cada nota dura (fator/cps)/n. Resolvendo
  // para que cada nota dure secPorNota:
  const cps = (typeof window.getCps === 'function' && window.getCps()) || 0.5
  const fator = secPorNota * n * cps

  // synth waveform (sine/sawtooth/triangle/square) + envelope suave e filtro
  // para soar menos "duro". Cai para o synth padrão se algum controle faltar.
  let pat = window.note(midis)
  try {
    pat = pat.sound(instrumento || 'sawtooth').attack(0.02).release(0.25).lpf(3000).gain(0.85)
  } catch {
    try {
      pat = window.note(midis).sound(instrumento || 'sawtooth')
    } catch {
      pat = window.note(midis)
    }
  }
  pat.slow(fator).play()

  let i = 0
  onStep && onStep(0)
  timer = setInterval(() => {
    i++
    if (i >= n) {
      clearInterval(timer)
      timer = null
      onStep && onStep(-1)
      // deixa a última nota soar um pouco antes de silenciar
      setTimeout(() => { try { window.hush() } catch {} }, msPorNota)
      return
    }
    onStep && onStep(i)
  }, msPorNota)
}

export function parar() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  try {
    window.hush && window.hush()
  } catch {}
}
