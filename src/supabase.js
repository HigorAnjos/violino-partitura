// Cliente Supabase (roda 100% no browser). A anon key é pública por design;
// a segurança vem das policies de RLS no banco. Tabela aberta = uso pessoal.
//
// Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY num arquivo .env.local
// (ver .env.example). Se não estiverem definidas, o app cai para localStorage.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseEnabled = Boolean(url && anonKey)

const supabase = supabaseEnabled ? createClient(url, anonKey) : null

const LS_KEY = 'violino_partituras'

// --- Fallback localStorage ----------------------------------------------
function lsList() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}
function lsSave(rows) {
  localStorage.setItem(LS_KEY, JSON.stringify(rows))
}

// --- API pública ---------------------------------------------------------

// Salva uma partitura. payload: { titulo, notas:[...], resultado:[...] }
export async function saveScore({ titulo, notas, resultado }) {
  if (supabaseEnabled) {
    const { data, error } = await supabase
      .from('scores')
      .insert({ titulo, notas, resultado })
      .select()
      .single()
    if (error) throw error
    return data
  }
  // localStorage
  const rows = lsList()
  const row = {
    id: `local-${rows.length + 1}-${notas.length}`,
    titulo,
    notas,
    resultado,
    criado_em: new Date().toISOString(),
  }
  rows.unshift(row)
  lsSave(rows)
  return row
}

// Lista as partituras salvas (mais recentes primeiro).
export async function listScores() {
  if (supabaseEnabled) {
    const { data, error } = await supabase
      .from('scores')
      .select('id, titulo, notas, resultado, criado_em')
      .order('criado_em', { ascending: false })
      .limit(100)
    if (error) throw error
    return data
  }
  return lsList()
}
