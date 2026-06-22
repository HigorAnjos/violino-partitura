// Compõe a pauta (SVG da VexFlow) + o braço (SVG custom) num único SVG,
// rasteriza em <canvas> e dispara o download como PNG.

const PADDING = 24
const TITLE_H = 44
const GAP = 24

function slugify(text) {
  return (text || 'partitura')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'partitura'
}

function svgDims(svgEl) {
  const w = parseFloat(svgEl.getAttribute('width')) || svgEl.viewBox?.baseVal?.width || 600
  const h = parseFloat(svgEl.getAttribute('height')) || svgEl.viewBox?.baseVal?.height || 200
  return { w, h }
}

// Monta o SVG composto (string) com a pauta em cima e o braço embaixo.
export function composeSvg(title, staffSvgEl, neck) {
  const staff = svgDims(staffSvgEl)
  const staffInner = staffSvgEl.innerHTML
  const contentW = Math.max(staff.w, neck.width)
  const width = contentW + PADDING * 2
  const height = TITLE_H + staff.h + GAP + neck.height + PADDING * 2

  const parts = []
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Arial, sans-serif">`
  )
  parts.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>`)
  // título
  parts.push(
    `<text x="${width / 2}" y="${PADDING + 22}" text-anchor="middle" font-size="20" font-weight="bold" fill="#111827">${escapeXml(title || 'Partitura')}</text>`
  )
  // pauta (re-embrulha o conteúdo interno da VexFlow num svg posicionado)
  const staffY = PADDING + TITLE_H
  parts.push(
    `<svg x="${PADDING}" y="${staffY}" width="${staff.w}" height="${staff.h}" viewBox="0 0 ${staff.w} ${staff.h}">${staffInner}</svg>`
  )
  // braço
  const neckY = staffY + staff.h + GAP
  // remove a tag <svg ...> externa do braço e reembrulha posicionada
  const neckInner = neck.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  parts.push(
    `<svg x="${PADDING}" y="${neckY}" width="${neck.width}" height="${neck.height}" viewBox="0 0 ${neck.width} ${neck.height}">${neckInner}</svg>`
  )
  parts.push('</svg>')
  return { svg: parts.join(''), width, height }
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Rasteriza o SVG composto e baixa como PNG (cai na pasta de Downloads padrão).
export async function exportPng(title, staffSvgEl, neck) {
  const { svg, width, height } = composeSvg(title, staffSvgEl, neck)
  const scale = 2 // nitidez
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(width * scale)
  canvas.height = Math.ceil(height * scale)
  const ctx = canvas.getContext('2d')

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0)
      resolve()
    }
    img.onerror = reject
    img.src = url
  })
  URL.revokeObjectURL(url)

  const pngUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = pngUrl
  a.download = `violino_${slugify(title)}_braco_intervalos.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
}
