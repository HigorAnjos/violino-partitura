// Valida a CONSISTÊNCIA FÍSICA das 24 escalas transcritas do PDF.
// Confia na partitura transcrita (não impõe padrão T/S teórico): verifica que
// cada nota resolve para corda/dedo válidos, que o `abs` é estritamente
// crescente e que há 15 notas por direção.
//
// Uso: node scripts/validate-scales.mjs
import { SCALES } from '../src/scales.js'
import { resolvePreset, buildPlaySequence } from '../src/fingerboard.js'
import { tsMarker, STRING_ORDER } from '../src/notes.js'

let problemas = 0
const tsDeriv = (positions) =>
  positions.slice(1).map((p, i) => tsMarker(p.abs - positions[i].abs) || '·').join('')

for (const sc of SCALES) {
  const linhas = []
  let ok = true
  for (const dir of ['subida', 'descidaAsc']) {
    const { positions, erros } = resolvePreset(sc[dir])
    if (erros.length) { problemas++; ok = false; linhas.push(`  [${dir}] ERROS: ${JSON.stringify(erros)}`); continue }
    if (positions.length !== sc[dir].length) { problemas++; ok = false; linhas.push(`  [${dir}] contagem ${positions.length} != ${sc[dir].length}`) }
    for (let i = 1; i < positions.length; i++) {
      if (positions[i].abs <= positions[i - 1].abs) {
        problemas++; ok = false
        linhas.push(`  [${dir}] não monotônico em ${i}: ${positions[i - 1].nota} -> ${positions[i].nota}`)
      }
    }
    const porCorda = STRING_ORDER.map((c) => `${c}:${positions.filter((p) => p.corda === c).length}`).join(' ')
    linhas.push(`  [${dir}] ${positions.length} notas | ${porCorda} | T/S=${tsDeriv(positions)}`)
  }
  // garante que a sequência de execução (volta invertida) também é coerente
  buildPlaySequence(resolvePreset(sc.subida).positions, false)
  buildPlaySequence(resolvePreset(sc.descidaAsc).positions, true)
  console.log(`${ok ? 'OK ' : 'XX '}${sc.nome}`)
  linhas.forEach((l) => console.log(l))
}

console.log(`\n${problemas === 0 ? '✅ TUDO CONSISTENTE' : '❌ ' + problemas + ' problema(s)'} (${SCALES.length} escalas)`)
process.exit(problemas === 0 ? 0 : 1)
