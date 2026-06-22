// Catálogo das 24 escalas do PDF "Escalas para Violino"
// (2 oitavas | 4 cordas | posição fixa | 1ª posição).
//
// Cada escala tem `subida` (ida, ascendente) e `descidaAsc` (a VOLTA descrita
// em ordem física ascendente — para tocar descendo, inverte-se a sequência).
// Para as MAIORES a volta usa o mesmo dedilhado da ida, então `descidaAsc`
// é omitido e o app reaproveita `subida`.
// Para as MENORES (melódicas) a volta usa a menor natural (6ª/7ª abaixadas),
// então `descidaAsc` é fornecido explicitamente.
//
// Formato compacto de cada nota: "<dedo>:<nota>" (dedo 0 = corda solta).
// A corda e a posição (alta/baixa) são derivadas em fingerboard.js.

const S = (str) => str.trim().split(/\s+/).map((p) => {
  const [dedo, nota] = p.split(':')
  return { dedo: Number(dedo), nota }
})

// Armadura de clave (VexFlow) por escala — para a pauta bater com a folha
// "escalas a praticar". null = sem armadura (acidentes nota a nota): usado em
// Reb menor (Db menor, 8 bemóis, sem armadura padrão no VexFlow).
const TONALIDADE = {
  'sol-maior': 'G', 'lab-maior': 'Ab', 'la-maior': 'A', 'sib-maior': 'Bb',
  'si-maior': 'B', 'do-maior': 'C', 'reb-maior': 'Db', 're-maior': 'D',
  'mib-maior': 'Eb', 'mi-maior': 'E', 'fa-maior': 'F', 'fa#-maior': 'F#',
  'sol-menor': 'Gm', 'lab-menor': 'Abm', 'la-menor': 'Am', 'sib-menor': 'Bbm',
  'si-menor': 'Bm', 'do-menor': 'Cm', 'reb-menor': null, 're-menor': 'Dm',
  'mib-menor': 'Ebm', 'mi-menor': 'Em', 'fa-menor': 'Fm', 'fa#-menor': 'F#m',
}

const raw = [
  // ---- MAIORES (descidaAsc = subida) ----
  { id: 'sol-maior', nome: 'Sol maior', modo: 'maior',
    subida: '0:Sol 1:La 2:Si 3:Do 0:Re 1:Mi 2:Fa# 3:Sol 0:La 1:Si 2:Do 3:Re 0:Mi 1:Fa# 2:Sol' },
  { id: 'lab-maior', nome: 'Lab maior', modo: 'maior',
    subida: '1:Lab 2:Sib 3:Do 3:Reb 4:Mib 2:Fa 3:Sol 3:Lab 4:Sib 2:Do 2:Reb 3:Mib 4:Fa 2:Sol 2:Lab' },
  { id: 'la-maior', nome: 'La maior', modo: 'maior',
    subida: '1:La 2:Si 3:Do# 0:Re 1:Mi 2:Fa# 3:Sol# 0:La 1:Si 2:Do# 3:Re 0:Mi 1:Fa# 2:Sol# 3:La' },
  { id: 'sib-maior', nome: 'Sib maior', modo: 'maior',
    subida: '2:Sib 3:Do 0:Re 1:Mib 2:Fa 3:Sol 0:La 1:Sib 2:Do 3:Re 3:Mib 4:Fa 2:Sol 3:La 3:Sib' },
  { id: 'si-maior', nome: 'Si maior', modo: 'maior',
    subida: '2:Si 3:Do# 4:Re# 1:Mi 2:Fa# 3:Sol# 4:La# 1:Si 2:Do# 3:Re# 0:Mi 1:Fa# 2:Sol# 3:La# 4:Si' },
  { id: 'do-maior', nome: 'Do maior', modo: 'maior',
    subida: '3:Do 0:Re 1:Mi 2:Fa 3:Sol 0:La 1:Si 2:Do 3:Re 0:Mi 1:Fa 2:Sol 3:La 4:Si 4:Do' },
  { id: 'reb-maior', nome: 'Reb maior', modo: 'maior',
    subida: '2:Sib 3:Do 3:Reb 4:Mib 2:Fa 2:Solb 3:Lab 4:Sib 2:Do 2:Reb 3:Mib 4:Fa 1:Solb 2:Lab 3:Sib' },
  { id: 're-maior', nome: 'Re maior', modo: 'maior',
    subida: '2:Si 3:Do# 0:Re 1:Mi 2:Fa# 3:Sol 0:La 1:Si 2:Do# 3:Re 0:Mi 1:Fa# 2:Sol 3:La 4:Si' },
  { id: 'mib-maior', nome: 'Mib maior', modo: 'maior',
    subida: '2:Sib 3:Do 0:Re 1:Mib 2:Fa 3:Sol 3:Lab 4:Sib 2:Do 3:Re 3:Mib 4:Fa 2:Sol 2:Lab 3:Sib' },
  { id: 'mi-maior', nome: 'Mi maior', modo: 'maior',
    subida: '2:Si 3:Do# 4:Re# 1:Mi 2:Fa# 3:Sol# 0:La 1:Si 2:Do# 3:Re# 0:Mi 1:Fa# 2:Sol# 3:La 4:Si' },
  { id: 'fa-maior', nome: 'Fa maior', modo: 'maior',
    subida: '2:Sib 3:Do 0:Re 1:Mi 2:Fa 3:Sol 0:La 1:Sib 2:Do 3:Re 0:Mi 1:Fa 2:Sol 3:La 3:Sib' },
  { id: 'fa#-maior', nome: 'Fa# maior', modo: 'maior',
    subida: '2:Si 3:Do# 4:Re# 2:Mi# 2:Fa# 3:Sol# 4:La# 1:Si 2:Do# 3:Re# 4:Mi# 1:Fa# 2:Sol# 3:La# 4:Si' },

  // ---- MENORES (melódicas: subida ≠ descidaAsc) ----
  { id: 'sol-menor', nome: 'Sol menor', modo: 'menor',
    subida: '0:Sol 1:La 2:Sib 3:Do 0:Re 1:Mi 2:Fa# 3:Sol 0:La 1:Sib 2:Do 3:Re 0:Mi 1:Fa# 2:Sol',
    descidaAsc: '0:Sol 1:La 2:Sib 3:Do 0:Re 1:Mib 2:Fa 3:Sol 0:La 1:Sib 2:Do 3:Re 3:Mib 4:Fa 2:Sol' },
  { id: 'lab-menor', nome: 'Lab menor', modo: 'menor',
    subida: '1:Lab 2:Sib 2:Dob 3:Reb 4:Mib 2:Fa 3:Sol 3:Lab 4:Sib 1:Dob 2:Reb 3:Mib 4:Fa 2:Sol 2:Lab',
    descidaAsc: '1:Lab 2:Sib 2:Dob 3:Reb 4:Mib 1:Fab 2:Solb 3:Lab 4:Sib 1:Dob 2:Reb 3:Mib 0:Fab 1:Solb 2:Lab' },
  { id: 'la-menor', nome: 'La menor', modo: 'menor',
    subida: '1:La 2:Si 3:Do 0:Re 1:Mi 2:Fa# 3:Sol# 0:La 1:Si 2:Do 3:Re 0:Mi 1:Fa# 2:Sol# 3:La',
    descidaAsc: '1:La 2:Si 3:Do 0:Re 1:Mi 2:Fa 3:Sol 0:La 1:Si 2:Do 3:Re 0:Mi 1:Fa 2:Sol 3:La' },
  { id: 'sib-menor', nome: 'Sib menor', modo: 'menor',
    subida: '2:Sib 3:Do 3:Reb 4:Mib 2:Fa 3:Sol 0:La 1:Sib 2:Do 2:Reb 3:Mib 4:Fa 2:Sol 3:La 3:Sib',
    descidaAsc: '2:Sib 3:Do 3:Reb 4:Mib 2:Fa 2:Solb 3:Lab 4:Sib 2:Do 2:Reb 3:Mib 4:Fa 1:Solb 2:Lab 3:Sib' },
  { id: 'si-menor', nome: 'Si menor', modo: 'menor',
    subida: '2:Si 3:Do# 0:Re 1:Mi 2:Fa# 3:Sol# 4:La# 1:Si 2:Do# 3:Re 0:Mi 1:Fa# 2:Sol# 3:La# 4:Si',
    descidaAsc: '2:Si 3:Do# 0:Re 1:Mi 2:Fa# 3:Sol 0:La 1:Si 2:Do# 3:Re 0:Mi 1:Fa# 2:Sol 3:La 4:Si' },
  { id: 'do-menor', nome: 'Do menor', modo: 'menor',
    subida: '3:Do 0:Re 1:Mib 2:Fa 3:Sol 0:La 1:Si 2:Do 3:Re 3:Mib 4:Fa 2:Sol 3:La 4:Si 4:Do',
    descidaAsc: '3:Do 0:Re 1:Mib 2:Fa 3:Sol 3:Lab 4:Sib 2:Do 3:Re 3:Mib 4:Fa 2:Sol 2:Lab 3:Sib 4:Do' },
  { id: 'reb-menor', nome: 'Reb menor', modo: 'menor',
    subida: '2:Sib 3:Do 3:Reb 4:Mib 1:Fab 2:Solb 3:Lab 4:Sib 2:Do 2:Reb 3:Mib 0:Fab 1:Solb 2:Lab 3:Sib',
    descidaAsc: '2:Dob 3:Reb 4:Mib 1:Fab 2:Solb 3:Lab 0:Sibb 1:Dob 2:Reb 3:Mib 0:Fab 1:Solb 2:Lab 3:Sibb 4:Dob' },
  { id: 're-menor', nome: 'Re menor', modo: 'menor',
    subida: '2:Si 3:Do# 0:Re 1:Mi 2:Fa 3:Sol 0:La 1:Si 2:Do# 3:Re 0:Mi 1:Fa 2:Sol 3:La 4:Si',
    descidaAsc: '2:Sib 3:Do 0:Re 1:Mi 2:Fa 3:Sol 0:La 1:Sib 2:Do 3:Re 0:Mi 1:Fa 2:Sol 3:La 3:Sib' },
  { id: 'mib-menor', nome: 'Mib menor', modo: 'menor',
    subida: '2:Sib 3:Do 0:Re 1:Mib 2:Fa 2:Solb 3:Lab 4:Sib 2:Do 3:Re 3:Mib 4:Fa 1:Solb 2:Lab 3:Sib',
    descidaAsc: '2:Dob 3:Reb 4:Mib 2:Fa 2:Solb 3:Lab 4:Sib 1:Dob 2:Reb 3:Mib 4:Fa 1:Solb 2:Lab 3:Sib 4:Dob' },
  { id: 'mi-menor', nome: 'Mi menor', modo: 'menor',
    subida: '2:Si 3:Do# 4:Re# 1:Mi 2:Fa# 3:Sol 0:La 1:Si 2:Do# 3:Re# 0:Mi 1:Fa# 2:Sol 3:La 4:Si',
    descidaAsc: '2:Si 3:Do 0:Re 1:Mi 2:Fa# 3:Sol 0:La 1:Si 2:Do 3:Re 0:Mi 1:Fa# 2:Sol 3:La 4:Si' },
  { id: 'fa-menor', nome: 'Fa menor', modo: 'menor',
    subida: '2:Sib 3:Do 0:Re 1:Mi 2:Fa 3:Sol 3:Lab 4:Sib 2:Do 3:Re 0:Mi 1:Fa 2:Sol 2:Lab 3:Sib',
    descidaAsc: '2:Sib 3:Do 3:Reb 4:Mib 2:Fa 3:Sol 3:Lab 4:Sib 2:Do 2:Reb 3:Mib 4:Fa 2:Sol 2:Lab 3:Sib' },
  { id: 'fa#-menor', nome: 'Fa# menor', modo: 'menor',
    subida: '2:Si 3:Do# 4:Re# 2:Mi# 2:Fa# 3:Sol# 0:La 1:Si 2:Do# 3:Re# 4:Mi# 1:Fa# 2:Sol# 3:La 4:Si',
    descidaAsc: '2:Si 3:Do# 0:Re 1:Mi 2:Fa# 3:Sol# 0:La 1:Si 2:Do# 3:Re 0:Mi 1:Fa# 2:Sol# 3:La 4:Si' },
]

export const SCALES = raw.map((s) => ({
  id: s.id,
  nome: s.nome,
  modo: s.modo,
  tonalidade: TONALIDADE[s.id] ?? null,
  subida: S(s.subida),
  descidaAsc: S(s.descidaAsc || s.subida),
}))

export function getScale(id) {
  return SCALES.find((s) => s.id === id) || null
}

// Acha a tonalidade a partir de um título "Sol maior — ida (subindo)".
export function tonalidadePorTitulo(titulo) {
  if (!titulo) return null
  const sc = SCALES.find((s) => titulo.startsWith(s.nome))
  return sc ? sc.tonalidade : null
}
