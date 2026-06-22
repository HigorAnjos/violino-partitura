// Cliente Supabase (roda 100% no browser). A anon/publishable key é pública por
// design; a segurança vem das policies de RLS no banco. Tabela aberta = uso pessoal.
//
// Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY num arquivo .env (ver
// .env.example). Se não estiverem definidas — OU se a chamada ao Supabase falhar
// (ex.: tabela ainda não criada, sem internet) — o app cai para localStorage.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseEnabled = Boolean(url && anonKey)

const supabase = supabaseEnabled ? createClient(url, anonKey) : null

// Após a 1ª falha (ex.: tabela ainda não criada), passa a usar localStorage
// direto nesta sessão para não martelar a rede. Reseta ao recarregar a página.
let degraded = false

const LS_KEY = 'violino_partituras'

// --- Fallback localStorage ----------------------------------------------
function lsList() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}
function lsSaveOne({ titulo, notas, resultado }) {
  const rows = lsList()
  const row = {
    id: `local-${Date.now()}`,
    titulo,
    notas,
    resultado,
    criado_em: new Date().toISOString(),
  }
  rows.unshift(row)
  localStorage.setItem(LS_KEY, JSON.stringify(rows))
  return row
}

// --- API pública ---------------------------------------------------------
// Retornam { row|rows, storage: 'supabase' | 'local' }.

export async function saveScore({ titulo, notas, resultado }) {
  if (supabaseEnabled && !degraded) {
    try {
      const { data, error } = await supabase
        .from('scores')
        .insert({ titulo, notas, resultado })
        .select()
        .single()
      if (error) throw error
      return { row: data, storage: 'supabase' }
    } catch (e) {
      degraded = true
      console.warn('Supabase indisponível ao salvar — usando localStorage:', e.message)
    }
  }
  return { row: lsSaveOne({ titulo, notas, resultado }), storage: 'local' }
}

export async function listScores() {
  if (supabaseEnabled && !degraded) {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('id, titulo, notas, resultado, criado_em')
        .order('criado_em', { ascending: false })
        .limit(200)
      if (error) throw error
      return { rows: data, storage: 'supabase' }
    } catch (e) {
      degraded = true
      console.warn('Supabase indisponível ao listar — usando localStorage:', e.message)
    }
  }
  return { rows: lsList(), storage: 'local' }
}
