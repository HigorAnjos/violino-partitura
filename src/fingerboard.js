// Carrega o mapa do braço, deriva offsets em semitons e mapeia uma sequência
// de notas (pitch class) para posições físicas (corda + dedo + alta/baixa).

import {
  ptToPitchClass,
  OPEN_STRING_ABS,
  STRING_ORDER,
} from './notes.js'

// Offsets em semitons válidos para um dedo (a partir da corda solta).
// dedo 0 = corda solta (offset 0). dedos 1..4: baixo = 2d-1, alto = 2d.
function validOffsets(dedo) {
  if (dedo === 0) return [0]
  return [2 * dedo - 1, 2 * dedo]
}

// Tipo visual da posição (igual ao PDF): solta / baixo / alto.
function colorType(dedo, offset) {
  if (dedo === 0) return 'solta'
  return offset % 2 === 0 ? 'alto' : 'baixo'
}

// Resolve uma sequência EXPLÍCITA de {dedo, nota} (do PDF) para posições físicas,
// derivando corda, semitom absoluto e tipo (alto/baixo/solta).
// Assume sequência fisicamente ASCENDENTE (como os blocos do PDF).
// Retorna { positions, erros }.
export function resolvePreset(seq) {
  const positions = []
  const erros = []
  let prev = -Infinity

  seq.forEach((item, i) => {
    const pc = ptToPitchClass(item.nota)
    if (pc == null) {
      erros.push({ index: i, item, motivo: 'nota inválida' })
      return
    }
    // procura o menor abs > prev com esse pitch class e uma corda válida p/ o dedo
    let achou = null
    for (let abs = Math.max(prev + 1, 24); abs <= 96; abs++) {
      if (((abs % 12) + 12) % 12 !== pc) continue
      // testa as cordas (da mais grave p/ aguda) procurando offset válido
      for (const corda of STRING_ORDER) {
        const offset = abs - OPEN_STRING_ABS[corda]
        if (offset < 0) continue
        if (validOffsets(item.dedo).includes(offset)) {
          achou = { abs, corda, offset }
          break
        }
      }
      if (achou) break
    }
    if (!achou) {
      erros.push({ index: i, item, motivo: `sem corda válida p/ dedo ${item.dedo} em ${item.nota}` })
      return
    }
    positions.push({
      index: i,
      nota: item.nota,
      dedo: item.dedo,
      corda: achou.corda,
      offset: achou.offset,
      abs: achou.abs,
      pc,
      tipo: colorType(item.dedo, achou.offset),
    })
    prev = achou.abs
  })

  return { positions, erros }
}

// Monta a sequência de execução (play order) com índice e intervalo p/ a anterior.
// `ascendingPositions` vem de resolvePreset; se `reverse` (volta), inverte a ordem.
export function buildPlaySequence(ascendingPositions, reverse = false) {
  const ordered = reverse ? [...ascendingPositions].reverse() : ascendingPositions
  return ordered.map((p, i) => ({
    ...p,
    index: i,
    intervaloSemitons: i === 0 ? null : p.abs - ordered[i - 1].abs,
  }))
}

// Offset em semitons por (dedo, índice da posição no array do JSON).
// dedo 0 = corda solta (offset 0).
// dedos 1..4: índice 0 = posição baixa, índice 1 = posição alta.
function offsetFor(finger, posIdx) {
  if (finger === 0) return 0
  return 2 * finger - 1 + posIdx // posIdx 0 -> 2f-1, posIdx 1 -> 2f
}

// A partir do JSON do braço, gera a lista plana de todas as posições tocáveis.
// Cada posição: { corda, dedo, posIdx, posLabel, notaPt, abs, pc }
export function buildPositions(fingerboardJson) {
  const positions = []
  for (const corda of STRING_ORDER) {
    const fingers = fingerboardJson[corda]
    if (!fingers) continue
    for (const fingerStr of Object.keys(fingers)) {
      const finger = Number(fingerStr)
      const notes = fingers[fingerStr]
      notes.forEach((notaPt, posIdx) => {
        const offset = offsetFor(finger, posIdx)
        const abs = OPEN_STRING_ABS[corda] + offset
        const pc = ((abs % 12) + 12) % 12
        const posLabel =
          finger === 0 ? 'solta' : posIdx === 0 ? 'baixa' : 'alta'
        positions.push({ corda, dedo: finger, posIdx, posLabel, notaPt, abs, pc })
      })
    }
  }
  return positions
}

// Mapeia uma lista de notas digitadas (strings PT) para uma sequência de posições.
// Heurística gulosa: para cada nota, entre as posições possíveis (mesmo pitch class)
// escolhe a que minimiza o "custo" em relação à posição anterior, preferindo:
//   - continuar na mesma corda
//   - dedo ascendente / próximo do anterior
//   - posição (semitom absoluto) mais próxima da anterior, para subir a escala
//
// Retorna { ok, mapped: [...], erros: [...] }
export function mapNotes(rawNotes, fingerboardJson) {
  const positions = buildPositions(fingerboardJson)
  const mapped = []
  const erros = []
  let prev = null

  rawNotes.forEach((raw, i) => {
    const pc = ptToPitchClass(raw)
    if (pc == null) {
      erros.push({ index: i, raw, motivo: 'nota não reconhecida' })
      return
    }

    const candidatos = positions.filter((p) => p.pc === pc)
    if (candidatos.length === 0) {
      erros.push({ index: i, raw, motivo: 'nota fora do alcance do braço mapeado' })
      return
    }

    let escolhido
    if (!prev) {
      // primeira nota: pega a posição mais grave (menor abs) -> começa embaixo
      escolhido = candidatos.reduce((a, b) => (a.abs <= b.abs ? a : b))
    } else {
      escolhido = candidatos
        .map((p) => ({ p, custo: custoTransicao(prev, p) }))
        .reduce((a, b) => (a.custo <= b.custo ? a : b)).p
    }

    const intervaloSemitons = prev ? escolhido.abs - prev.abs : null
    mapped.push({
      index: i,
      raw,
      notaPt: escolhido.notaPt,
      corda: escolhido.corda,
      dedo: escolhido.dedo,
      posLabel: escolhido.posLabel,
      abs: escolhido.abs,
      pc: escolhido.pc,
      intervaloSemitons,
    })
    prev = escolhido
  })

  return { ok: erros.length === 0, mapped, erros }
}

// Custo de ir da posição prev para a posição cand. Menor = melhor.
function custoTransicao(prev, cand) {
  const stringIdx = (corda) => STRING_ORDER.indexOf(corda)
  let custo = 0
  // distância de pitch (queremos a próxima nota mais próxima possível)
  custo += Math.abs(cand.abs - prev.abs)
  // pequena penalidade por trocar de corda (favorece continuar na mesma)
  custo += Math.abs(stringIdx(cand.corda) - stringIdx(prev.corda)) * 0.5
  // leve preferência por não "voltar" o dedo numa subida
  return custo
}
