function buildColgroup (cols, widths) {
  if (!widths || !widths.length) return ''
  let html = '<colgroup>'
  for (let i = 0; i < cols; i++) {
    const w = widths[i]
    html += w ? `<col style="width:${w};">` : '<col>'
  }
  html += '</colgroup>'
  return html
}

export function buildGapTableHtml (cols, rows, options = {}) {
  const { withHeader = true, headers = null, columnWidths = null } = options
  const safeCols = Math.max(1, Math.min(cols, 8))
  const safeRows = Math.max(withHeader ? 2 : 1, Math.min(rows, 20))
  const headerLabels = headers || Array.from({ length: safeCols }, (_, i) => `列${i + 1}`)

  let html = '<table class="gap-question-table" style="table-layout:fixed;width:100%;" border="1" cellpadding="0" cellspacing="0">'
  html += buildColgroup(safeCols, columnWidths)
  for (let r = 0; r < safeRows; r++) {
    html += '<tr>'
    for (let c = 0; c < safeCols; c++) {
      const widthAttr = columnWidths && columnWidths[c] ? ` style="width:${columnWidths[c]};"` : ''
      if (withHeader && r === 0) {
        html += `<th${widthAttr}>${headerLabels[c] || `列${c + 1}`}</th>`
      } else {
        html += `<td${widthAttr}>&nbsp;</td>`
      }
    }
    html += '</tr>'
  }
  html += '</table>'
  return html
}
