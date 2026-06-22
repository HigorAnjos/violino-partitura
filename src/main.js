// Wiring da UI: escolhe uma das 24 escalas (ida/volta) OU digita notas livres,
// renderiza pauta + braço, exporta PNG e salva/lista/cadastra no Supabase
// (ou localStorage como fallback).

import { SCALES, getScale, tonalidadePorTitulo } from './scales.js'
import { resolvePreset, buildPlaySequence, mapNotes } from './fingerboard.js'
import { OPEN_STRING_ABS } from './notes.js'
import { renderStaff } from './renderStaff.js'
import { renderNeck, buildNeckSvg } from './renderNeck.js'
import { exportPng } from './exportImage.js'
import { saveScore, listScores, supabaseEnabled } from './supabase.js'

const $ = (id) => document.getElementById(id)
const elEscala = $('escala')
const elTitulo = $('titulo')
const elNotas = $('notas')
const elStaff = $('staff')
const elNeck = $('neck')
const elStatus = $('status')
const elLista = $('lista')
const elBusca = $('busca')

let fingerboard = null
let playSeq = []
let staffSvgEl = null
let savedRows = []

function setStatus(msg, kind = '') {
  elStatus.textContent = msg
  elStatus.className = 'status' + (kind ? ' ' + kind : '')
}

function getDir() {
  return document.querySelector('input[name="dir"]:checked').value
}

// tipo (alto/baixo/solta) e offset para itens vindos do mapeamento livre
function colorType(dedo, offset) {
  if (dedo === 0) return 'solta'
  return offset % 2 === 0 ? 'alto' : 'baixo'
}

function render(seq, titulo, tonalidade = null) {
  playSeq = seq
  staffSvgEl = renderStaff(elStaff, seq, tonalidade)
  renderNeck(elNeck, seq)
  if (titulo != null) elTitulo.value = titulo
}

// Gera a partir de uma das 24 escalas cadastradas.
function gerarEscala() {
  const sc = getScale(elEscala.value)
  if (!sc) return
  const dir = getDir()
  const asc = resolvePreset(dir === 'ida' ? sc.subida : sc.descidaAsc)
  if (asc.erros.length) {
    setStatus('Erro ao resolver escala: ' + JSON.stringify(asc.erros), 'error')
    return
  }
  const seq = buildPlaySequence(asc.positions, dir === 'volta')
  const titulo = `${sc.nome} — ${dir === 'ida' ? 'ida (subindo)' : 'volta (descendo)'}`
  render(seq, titulo, sc.tonalidade)
  setStatus(`${seq.length} notas — ${sc.nome} (${dir}).`, 'ok')
}

// Gera a partir de notas digitadas livremente (heurística de dedilhado).
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
  render(seq, elTitulo.value || 'Notas livres')
  if (erros.length) {
    setStatus(`Atenção: ${erros.length} nota(s) ignorada(s): ${erros.map((e) => e.raw).join(', ')}`, 'error')
  } else {
    setStatus(`${seq.length} notas mapeadas.`, 'ok')
  }
}

async function exportar() {
  if (!staffSvgEl || playSeq.length === 0) {
    setStatus('Gere uma escala antes de exportar.', 'error')
    return
  }
  const neck = buildNeckSvg(playSeq)
  await exportPng(elTitulo.value, staffSvgEl, neck)
  setStatus('PNG exportado para a pasta de Downloads.', 'ok')
}

async function salvarAtual() {
  if (playSeq.length === 0) {
    setStatus('Gere algo antes de salvar.', 'error')
    return
  }
  try {
    await saveScore({
      titulo: elTitulo.value || 'Sem título',
      notas: playSeq.map((p) => p.nota),
      resultado: playSeq,
    })
    setStatus(supabaseEnabled ? 'Salvo no Supabase.' : 'Salvo localmente.', 'ok')
    await atualizarLista()
  } catch (e) {
    setStatus('Erro ao salvar: ' + e.message, 'error')
  }
}

// Cadastra todas as 24 escalas (ida + volta = 48 entradas).
async function cadastrarTodas() {
  setStatus('Cadastrando as 24 escalas (ida + volta)...', '')
  let n = 0
  try {
    for (const sc of SCALES) {
      for (const dir of ['ida', 'volta']) {
        const asc = resolvePreset(dir === 'ida' ? sc.subida : sc.descidaAsc)
        const seq = buildPlaySequence(asc.positions, dir === 'volta')
        await saveScore({
          titulo: `${sc.nome} — ${dir === 'ida' ? 'ida (subindo)' : 'volta (descendo)'}`,
          notas: seq.map((p) => p.nota),
          resultado: seq,
        })
        n++
      }
    }
    setStatus(`✅ ${n} entradas cadastradas (${supabaseEnabled ? 'Supabase' : 'local'}).`, 'ok')
    await atualizarLista()
  } catch (e) {
    setStatus(`Cadastrei ${n} antes de falhar: ${e.message}`, 'error')
  }
}

async function atualizarLista() {
  try {
    savedRows = await listScores()
  } catch (e) {
    setStatus('Erro ao listar: ' + e.message, 'error')
    return
  }
  renderLista()
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
    left.innerHTML = `<strong>${row.titulo}</strong> <span class="meta">${(row.notas || []).join(' ')} · ${data}</span>`
    const btn = document.createElement('button')
    btn.textContent = 'Abrir'
    btn.onclick = () => {
      if (Array.isArray(row.resultado) && row.resultado.length) {
        render(row.resultado, row.titulo, tonalidadePorTitulo(row.titulo))
      } else {
        elNotas.value = (row.notas || []).join(' ')
        gerarNotas()
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    li.append(left, btn)
    elLista.append(li)
  }
}

// popular o select de escalas
for (const sc of SCALES) {
  const opt = document.createElement('option')
  opt.value = sc.id
  opt.textContent = sc.nome
  elEscala.append(opt)
}

$('gerarEscala').addEventListener('click', gerarEscala)
$('gerarNotas').addEventListener('click', gerarNotas)
$('exportar').addEventListener('click', exportar)
$('salvar').addEventListener('click', salvarAtual)
$('cadastrarTodas').addEventListener('click', cadastrarTodas)
elBusca.addEventListener('input', renderLista)
elEscala.addEventListener('change', gerarEscala)
document.querySelectorAll('input[name="dir"]').forEach((r) => r.addEventListener('change', gerarEscala))

// init
;(async () => {
  const resp = await fetch(`${import.meta.env.BASE_URL}fingerboard.json`)
  fingerboard = await resp.json()
  if (!supabaseEnabled) setStatus('Supabase não configurado — salvando localmente.', '')
  gerarEscala()
  await atualizarLista()
})()
