// Compõe a pauta (SVG da VexFlow) + um ou mais diagramas de braço (SVG custom)
// num único SVG, rasteriza em <canvas> e dispara o download como PNG.

const PADDING = 24
const TITLE_H = 44
const LABEL_H = 26
const GAP = 20

function slugify(text) {
  return (
    (text || 'partitura')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'partitura'
  )
}

function svgDims(svgEl) {
  const w = parseFloat(svgEl.getAttribute('width')) || svgEl.viewBox?.baseVal?.width || 600
  const h = parseFloat(svgEl.getAttribute('height')) || svgEl.viewBox?.baseVal?.height || 200
  return { w, h }
}

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function stripOuterSvg(svg) {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
}

// necks: [{ label, svg, width, height }]
export function composeSvg(title, staffSvgEl, necks) {
  const staff = svgDims(staffSvgEl)
  const staffInner = staffSvgEl.innerHTML
  const contentW = Math.max(staff.w, ...necks.map((nk) => nk.width))
  const width = contentW + PADDING * 2
  let y = PADDING

  const parts = []
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="HEIGHT" viewBox="0 0 ${width} HEIGHT" font-family="Arial, sans-serif">`
  )
  parts.push(`<rect x="0" y="0" width="${width}" height="HEIGHT" fill="#ffffff"/>`)

  // título
  parts.push(
    `<text x="${width / 2}" y="${y + 22}" text-anchor="middle" font-size="20" font-weight="bold" fill="#111827">${escapeXml(title || 'Partitura')}</text>`
  )
  y += TITLE_H

  // pauta
  parts.push(
    `<svg x="${PADDING}" y="${y}" width="${staff.w}" height="${staff.h}" viewBox="0 0 ${staff.w} ${staff.h}">${staffInner}</svg>`
  )
  y += staff.h + GAP

  // braços com rótulo
  for (const nk of necks) {
    if (nk.label) {
      parts.push(
        `<text x="${PADDING}" y="${y + 18}" font-size="15" font-weight="bold" fill="#374151">${escapeXml(nk.label)}</text>`
      )
      y += LABEL_H
    }
    parts.push(
      `<svg x="${PADDING}" y="${y}" width="${nk.width}" height="${nk.height}" viewBox="0 0 ${nk.width} ${nk.height}">${stripOuterSvg(nk.svg)}</svg>`
    )
    y += nk.height + GAP
  }

  parts.push('</svg>')
  const height = y - GAP + PADDING
  const svg = parts.join('').replace(/HEIGHT/g, String(height))
  return { svg, width, height }
}

export async function exportPng(title, staffSvgEl, necks) {
  const { svg, width, height } = composeSvg(title, staffSvgEl, necks)
  const scale = 2
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

  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = `violino_${slugify(title)}_braco_intervalos.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
}
