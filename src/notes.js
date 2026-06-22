// Utilidades de notas musicais: conversão PT (latino) -> pitch class / grafia
// para a pauta (VexFlow), incluindo enarmônicos e dobrados (Dob, Fab, Sibb, Mi#).

// Letra latina -> { letra EN, pitch class natural }
const BASE = {
  Do: { en: 'C', pc: 0 },
  Re: { en: 'D', pc: 2 },
  Mi: { en: 'E', pc: 4 },
  Fa: { en: 'F', pc: 5 },
  Sol: { en: 'G', pc: 7 },
  La: { en: 'A', pc: 9 },
  Si: { en: 'B', pc: 11 },
}

const PC_TO_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Faz o parse de um nome PT em { letraPt, en, acc, accOffset, pc }.
// Aceita acidentes encadeados: #, ##, b, bb (ex: "Sibb", "Fa#", "Dob").
export function parsePt(raw) {
  if (!raw) return null
  let s = String(raw).trim()
  if (!s) return null
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
  const m = s.match(/^([A-Za-z]+?)(#+|b+|)$/)
  if (!m) return null
  let letra = m[1].toLowerCase()
  letra = letra.charAt(0).toUpperCase() + letra.slice(1)
  if (!(letra in BASE)) return null
  const accStr = m[2] || ''
  const accOffset = accStr.startsWith('#') ? accStr.length : accStr.startsWith('b') ? -accStr.length : 0
  const base = BASE[letra]
  const pc = (((base.pc + accOffset) % 12) + 12) % 12
  return { letraPt: letra, en: base.en, acc: accStr, accOffset, pc }
}

export function ptToPitchClass(name) {
  const p = parsePt(name)
  return p ? p.pc : null
}

export function pitchClassToEn(pc) {
  return PC_TO_EN[((pc % 12) + 12) % 12]
}

// Constrói a chave VexFlow ("db/4") respeitando a GRAFIA enarmônica do nome PT,
// usando o semitom absoluto `abs` (pitch real) para achar a oitava da LETRA.
// Retorna { key, accidental } — accidental ∈ '', '#','##','b','bb'.
export function vexKeyFromName(name, abs) {
  const p = parsePt(name)
  if (!p) return { key: `${pitchClassToEn(((abs % 12) + 12) % 12).toLowerCase()}/${Math.floor(abs / 12)}`, accidental: '' }
  // pitch natural da letra = abs - accOffset; a oitava é a dessa nota natural
  const naturalAbs = abs - p.accOffset
  const octave = Math.floor(naturalAbs / 12)
  return { key: `${p.en.toLowerCase()}${p.acc}/${octave}`, accidental: p.acc }
}

// Rótulo de intervalo a partir da distância em semitons.
export function intervalLabel(semitones) {
  const s = Math.abs(semitones)
  if (s === 0) return 'uníssono'
  if (s === 1) return '½ tom'
  if (s === 2) return '1 tom'
  const tones = Math.floor(s / 2)
  const half = s % 2
  let label = `${tones} tom${tones > 1 ? 's' : ''}`
  if (half) label += ' ½'
  return label
}

// Marcador T (tom) / S (semitom) como no PDF; null para outros saltos.
export function tsMarker(semitones) {
  const s = Math.abs(semitones)
  if (s === 1) return 'S'
  if (s === 2) return 'T'
  return null
}

// Pitches base das cordas soltas (semitom absoluto, convenção científica): G3 D4 A4 E5
export const OPEN_STRING_ABS = {
  SOL: 3 * 12 + 7, // 43
  RE: 4 * 12 + 2, // 50
  LA: 4 * 12 + 9, // 57
  MI: 5 * 12 + 4, // 64
}

export const STRING_ORDER = ['SOL', 'RE', 'LA', 'MI']
