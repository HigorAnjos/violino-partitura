// Desenha o braço do violino no estilo do PDF "Escalas para Violino":
// 4 cordas verticais (SOL RE LA MI), pestana no topo, bolinhas por nota com
// número do dedo + nome da nota, marcadores T/S entre posições da MESMA corda
// e setas tracejadas nas trocas de corda (ordem de execução).
//
// Cores (como o PDF): corda solta = branco; dedo alto = azul; dedo baixo = laranja.

import { STRING_ORDER, OPEN_STRING_ABS, tsMarker } from './notes.js'

const STRING_LABELS = { SOL: 'SOL', RE: 'RE', LA: 'LA', MI: 'MI' }

const MARGIN_X = 92
const STRING_GAP = 150
const HEADER_Y = 64
const ROW_H = 46 // altura por semitom (offset)
const MAX_OFFSET = 8
const RADIUS = 15

const CORES = {
  solta: { fill: '#ffffff', stroke: '#1f2937', text: '#1f2937' },
  alto: { fill: '#e8f0fe', stroke: '#2563eb', text: '#1e3a8a' },
  baixo: { fill: '#fdecd8', stroke: '#d97706', text: '#92400e' },
}

const stringX = (corda) => MARGIN_X + STRING_ORDER.indexOf(corda) * STRING_GAP
const offsetY = (offset) => HEADER_Y + offset * ROW_H

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// playSeq: saída de buildPlaySequence (corda, dedo, nota, abs, offset, tipo, index).
export function buildNeckSvg(playSeq) {
  const width = MARGIN_X * 2 + (STRING_ORDER.length - 1) * STRING_GAP
  const height = HEADER_Y + MAX_OFFSET * ROW_H + 40
  const nutY = offsetY(0)
  const bottomY = offsetY(MAX_OFFSET)
  const leftX = MARGIN_X - 28
  const rightX = MARGIN_X + (STRING_ORDER.length - 1) * STRING_GAP + 28

  const P = []
  P.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Arial, sans-serif">`
  )
  P.push(
    `<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#9ca3af"/></marker></defs>`
  )
  P.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="#fbfaf7"/>`)

  // linhas-guia de offset
  for (let off = 0; off <= MAX_OFFSET; off++) {
    const y = offsetY(off)
    P.push(`<line x1="${leftX}" y1="${y}" x2="${rightX}" y2="${y}" stroke="#ececec" stroke-width="1" stroke-dasharray="3 4"/>`)
  }
  // pestana (nut)
  P.push(`<rect x="${leftX}" y="${nutY - 7}" width="${rightX - leftX}" height="7" fill="#3f3f46" rx="2"/>`)
  P.push(`<text x="${leftX - 4}" y="${nutY - 1}" text-anchor="end" font-size="10" fill="#9ca3af">pestana</text>`)

  // cordas + rótulos
  for (const corda of STRING_ORDER) {
    const x = stringX(corda)
    P.push(`<line x1="${x}" y1="${nutY}" x2="${x}" y2="${bottomY}" stroke="#9ca3af" stroke-width="2"/>`)
    P.push(`<text x="${x}" y="${nutY - 16}" text-anchor="middle" font-size="14" font-weight="bold" fill="#374151">${STRING_LABELS[corda]}</text>`)
  }

  // marcadores T/S entre posições verticalmente adjacentes na MESMA corda
  for (const corda of STRING_ORDER) {
    const naCorda = playSeq
      .filter((p) => p.corda === corda)
      .sort((a, b) => a.offset - b.offset)
    // remove duplicatas de offset (mesma posição tocada na ida e volta)
    const uniq = []
    for (const p of naCorda) if (!uniq.some((u) => u.offset === p.offset)) uniq.push(p)
    for (let i = 1; i < uniq.length; i++) {
      const semis = uniq[i].offset - uniq[i - 1].offset
      const mark = tsMarker(semis)
      if (!mark) continue
      const x = stringX(corda)
      const my = (offsetY(uniq[i].offset) + offsetY(uniq[i - 1].offset)) / 2
      const isS = mark === 'S'
      const bx = x - 12
      P.push(`<rect x="${bx - 9}" y="${my - 9}" width="18" height="18" rx="4" fill="#fff" stroke="${isS ? '#dc2626' : '#9ca3af'}"/>`)
      P.push(`<text x="${bx}" y="${my + 4}" text-anchor="middle" font-size="11" fill="${isS ? '#dc2626' : '#6b7280'}">${mark}</text>`)
    }
  }

  // setas de troca de corda (entre notas consecutivas na execução)
  for (let i = 1; i < playSeq.length; i++) {
    const a = playSeq[i - 1]
    const b = playSeq[i]
    if (a.corda === b.corda) continue
    const ax = stringX(a.corda)
    const ay = offsetY(a.offset)
    const bx = stringX(b.corda)
    const by = offsetY(b.offset)
    P.push(`<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="#bdbdbd" stroke-width="1.3" stroke-dasharray="4 3" marker-end="url(#arrow)"/>`)
  }

  // bolinhas (uma por posição única; ida e volta podem compartilhar a posição)
  const desenhadas = new Set()
  for (const p of playSeq) {
    const chave = `${p.corda}:${p.offset}`
    if (desenhadas.has(chave)) continue
    desenhadas.add(chave)
    const x = stringX(p.corda)
    const y = offsetY(p.offset)
    const c = CORES[p.tipo] || CORES.solta
    P.push(`<circle data-pos="${p.corda}-${p.offset}" cx="${x}" cy="${y}" r="${RADIUS}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>`)
    P.push(`<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="13" font-weight="bold" fill="${c.text}">${p.dedo}</text>`)
    P.push(`<text x="${x + RADIUS + 5}" y="${y + 4}" font-size="12" fill="#111827">${esc(p.nota)}</text>`)
  }

  P.push('</svg>')
  return { svg: P.join(''), width, height }
}

export function renderNeck(container, playSeq) {
  const { svg } = buildNeckSvg(playSeq)
  container.innerHTML = svg
  return container.querySelector('svg')
}
