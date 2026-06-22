// Wiring da UI. Uma escala = ida (subindo) + volta (descendo) mostradas juntas:
// a pauta combina as duas numa linha (semicolcheias), e há dois diagramas de
// braço (subindo / descendo). Também dá para digitar notas livres.

import { SCALES, getScale } from './scales.js'
import { resolvePreset, buildPlaySequence, mapNotes } from './fingerboard.js'
import { OPEN_STRING_ABS } from './notes.js'
import { renderStaff } from './renderStaff.js'
import { renderNeck, buildNeckSvg } from './renderNeck.js'
import { exportPng } from './exportImage.js'
import { tocar, parar, strudelDisponivel } from './player.js'
import { saveScore, listScores, supabaseEnabled } from './supabase.js'

const $ = (id) => document.getElementById(id)
const elEscala = $('escala')
const elTitulo = $('titulo')
const elNotas = $('notas')
const elStaff = $('staff')
const elNeckIda = $('neckIda')
const elNeckVolta = $('neckVolta')
const elVoltaWrap = $('voltaWrap')
const elTituloNeckIda = $('tituloNeckIda')
const elStatus = $('status')
const elLista = $('lista')
const elBusca = $('busca')

let fingerboard = null
let staffSvgEl = null
let audioSeq = [] // sequência tocada (combinada ou única)
let exportNecks = [] // [{ label, seq }]
let highlightResolver = null
let currentResultado = null // o que será salvo (escala {ida,volta,key} ou array)

function setStatus(msg, kind = '') {
  elStatus.textContent = msg
  elStatus.className = 'status' + (kind ? ' ' + kind : '')
}

function colorType(dedo, offset) {
  if (dedo === 0) return 'solta'
  return offset % 2 === 0 ? 'alto' : 'baixo'
}

// ida completa + volta sem a 1ª nota (o topo já foi tocado no fim da ida)
function combinar(ida, volta) {
  return ida.concat(volta.slice(1))
}

// --- renderização ---
function renderEscala({ ida, volta, key, titulo }) {
  parar()
  const combinada = combinar(ida, volta)
  staffSvgEl = renderStaff(elStaff, combinada, key)
  renderNeck(elNeckIda, ida)
  renderNeck(elNeckVolta, volta)
  elVoltaWrap.style.display = ''
  elTituloNeckIda.textContent = 'Braço — subindo ↑'

  audioSeq = combinada
  exportNecks = [
    { label: 'Subindo ↑', seq: ida },
    { label: 'Descendo ↓', seq: volta },
  ]
  const L = ida.length
  highlightResolver = (i) =>
    i < L ? { box: elNeckIda, p: ida[i] } : { box: elNeckVolta, p: volta[i - L + 1] }
  currentResultado = { ida, volta, key }
  if (titulo != null) elTitulo.value = titulo
}

function renderUnico(seq, titulo) {
  parar()
  staffSvgEl = renderStaff(elStaff, seq, null)
  renderNeck(elNeckIda, seq)
  elNeckVolta.innerHTML = ''
  elVoltaWrap.style.display = 'none'
  elTituloNeckIda.textContent = 'Braço do violino'

  audioSeq = seq
  exportNecks = [{ label: '', seq }]
  highlightResolver = (i) => ({ box: elNeckIda, p: seq[i] })
  currentResultado = seq
  if (titulo != null) elTitulo.value = titulo
}

function escalaSeqs(sc) {
  const ida = buildPlaySequence(resolvePreset(sc.subida).positions, false)
  const volta = buildPlaySequence(resolvePreset(sc.descidaAsc).positions, true)
  return { ida, volta }
}

function gerarEscala() {
  const sc = getScale(elEscala.value)
  if (!sc) return
  const { ida, volta } = escalaSeqs(sc)
  renderEscala({ ida, volta, key: sc.tonalidade, titulo: sc.nome })
  setStatus(`${sc.nome}: ${ida.length} subindo + ${volta.length} descendo.`, 'ok')
}

function gerarNotas() {
  const notas = elNotas.value.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)
  if (!notas.length) {
    setStatus('Digite ao menos uma nota.', 'error')
    return
  }
  const { mapped, erros } = mapNotes(notas, fingerboard)
  const seq = mapped.map((m, i) => {
    const offset = m.abs - OPEN_STRING_ABS[m.corda]
    return { ...m, index: i, offset, nota: m.notaPt, tipo: colorType(m.dedo, offset) }
  })
  renderUnico(seq, elTitulo.value || 'Notas livres')
  if (erros.length) {
    setStatus(`Atenção: ${erros.length} nota(s) ignorada(s): ${erros.map((e) => e.raw).join(', ')}`, 'error')
  } else {
    setStatus(`${seq.length} notas mapeadas.`, 'ok')
  }
}

// --- áudio (Strudel) ---
function destacarNota(i) {
  ;[elNeckIda, elNeckVolta].forEach((box) =>
    box.querySelectorAll('circle.np-on').forEach((c) => c.classList.remove('np-on'))
  )
  if (i < 0 || !highlightResolver) return
  const r = highlightResolver(i)
  if (!r || !r.p) return
  const alvo = r.box.querySelector(`circle[data-pos="${r.p.corda}-${r.p.offset}"]`)
  if (alvo) alvo.classList.add('np-on')
}

function tocarAtual() {
  if (audioSeq.length === 0) {
    setStatus('Gere uma escala antes de tocar.', 'error')
    return
  }
  if (!strudelDisponivel()) {
    setStatus('Áudio (Strudel) não carregou — precisa de internet.', 'error')
    return
  }
  const ms = Number($('velocidade').value) || 380
  const instrumento = $('instrumento').value
  setStatus('▶ Tocando (sobe e desce)…', 'ok')
  tocar(audioSeq, ms, instrumento, destacarNota).catch((e) =>
    setStatus('Erro ao tocar: ' + e.message, 'error')
  )
}

function pararAtual() {
  parar()
  destacarNota(-1)
}

// --- export / persistência ---
async function exportar() {
  if (!staffSvgEl || audioSeq.length === 0) {
    setStatus('Gere uma escala antes de exportar.', 'error')
    return
  }
  const necks = exportNecks.map((nk) => ({ label: nk.label, ...buildNeckSvg(nk.seq) }))
  await exportPng(elTitulo.value, staffSvgEl, necks)
  setStatus('PNG exportado para a pasta de Downloads.', 'ok')
}

async function salvarAtual() {
  if (audioSeq.length === 0) {
    setStatus('Gere algo antes de salvar.', 'error')
    return
  }
  try {
    const { storage } = await saveScore({
      titulo: elTitulo.value || 'Sem título',
      notas: audioSeq.map((p) => p.nota),
      resultado: currentResultado,
    })
    setStatus(storage === 'supabase' ? 'Salvo no Supabase.' : 'Salvo localmente.', 'ok')
    await atualizarLista()
  } catch (e) {
    setStatus('Erro ao salvar: ' + e.message, 'error')
  }
}

async function cadastrarTodas() {
  setStatus('Cadastrando as 24 escalas (ida + volta)...', '')
  let n = 0
  try {
    for (const sc of SCALES) {
      const { ida, volta } = escalaSeqs(sc)
      await saveScore({
        titulo: sc.nome,
        notas: combinar(ida, volta).map((p) => p.nota),
        resultado: { ida, volta, key: sc.tonalidade },
      })
      n++
    }
    setStatus(`✅ ${n} escalas cadastradas.`, 'ok')
    await atualizarLista()
  } catch (e) {
    setStatus(`Cadastrei ${n} antes de falhar: ${e.message}`, 'error')
  }
}

let savedRows = []
async function atualizarLista() {
  try {
    const { rows } = await listScores()
    savedRows = rows
  } catch (e) {
    savedRows = []
    setStatus('Erro ao listar: ' + e.message, 'error')
  }
  renderLista()
}

function abrirRow(row) {
  const r = row.resultado
  if (r && r.ida && r.volta) {
    renderEscala({ ida: r.ida, volta: r.volta, key: r.key, titulo: row.titulo })
  } else if (Array.isArray(r) && r.length) {
    renderUnico(r, row.titulo)
  } else {
    elNotas.value = (row.notas || []).join(' ')
    gerarNotas()
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function renderLista() {
  const termo = (elBusca?.value || '').trim().toLowerCase()
  const rows = termo
    ? savedRows.filter((r) => `${r.titulo} ${(r.notas || []).join(' ')}`.toLowerCase().includes(termo))
    : savedRows

  elLista.innerHTML = ''
  if (!savedRows.length) {
    elLista.innerHTML = '<li class="meta">Nenhuma partitura salva ainda.</li>'
    return
  }
  if (!rows.length) {
    elLista.innerHTML = '<li class="meta">Nada encontrado para a busca.</li>'
    return
  }
  for (const row of rows) {
    const li = document.createElement('li')
    const data = row.criado_em ? new Date(row.criado_em).toLocaleString('pt-BR') : ''
    const left = document.createElement('span')
    left.innerHTML = `<strong>${row.titulo}</strong> <span class="meta">${(row.notas || []).slice(0, 8).join(' ')}… · ${data}</span>`
    const btn = document.createElement('button')
    btn.textContent = 'Abrir'
    btn.onclick = () => abrirRow(row)
    li.append(left, btn)
    elLista.append(li)
  }
}

// popular o seletor de escalas
for (const sc of SCALES) {
  const opt = document.createElement('option')
  opt.value = sc.id
  opt.textContent = sc.nome
  elEscala.append(opt)
}

$('gerarEscala').addEventListener('click', gerarEscala)
$('gerarNotas').addEventListener('click', gerarNotas)
$('tocar').addEventListener('click', tocarAtual)
$('parar').addEventListener('click', pararAtual)
$('exportar').addEventListener('click', exportar)
$('salvar').addEventListener('click', salvarAtual)
$('cadastrarTodas').addEventListener('click', cadastrarTodas)
elBusca.addEventListener('input', renderLista)
elEscala.addEventListener('change', gerarEscala)

// init
;(async () => {
  const resp = await fetch(`${import.meta.env.BASE_URL}fingerboard.json`)
  fingerboard = await resp.json()
  if (!supabaseEnabled) setStatus('Supabase não configurado — salvando localmente.', '')
  gerarEscala()
  await atualizarLista()
})()
