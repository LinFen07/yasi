const EDGE = 6
const MIN_WIDTH = 48

function getLogicalColIndex (cell) {
  const row = cell.parentElement
  if (!row) return 0
  let colPos = 0
  for (let c = 0; c < row.cells.length; c++) {
    const rowCell = row.cells[c]
    if (rowCell === cell) return colPos
    colPos += rowCell.colSpan || 1
  }
  return 0
}

function getColCount (table) {
  let max = 0
  for (let r = 0; r < table.rows.length; r++) {
    const row = table.rows[r]
    let count = 0
    for (let c = 0; c < row.cells.length; c++) {
      count += row.cells[c].colSpan || 1
    }
    max = Math.max(max, count)
  }
  return max
}

export function ensureTableLayout (table) {
  if (!table.getAttribute('style')) {
    table.setAttribute('style', 'table-layout:fixed;width:100%;')
  } else {
    table.style.tableLayout = 'fixed'
    if (!table.style.width) table.style.width = '100%'
  }
  if (!table.classList.contains('gap-question-table')) {
    table.classList.add('gap-question-table')
  }
}

export function ensureColgroup (table, doc) {
  const colCount = getColCount(table)
  if (!colCount) return null

  let colgroup = table.querySelector('colgroup')
  if (!colgroup) {
    colgroup = doc.createElement('colgroup')
    table.insertBefore(colgroup, table.firstChild)
  }

  while (colgroup.children.length < colCount) {
    colgroup.appendChild(doc.createElement('col'))
  }
  while (colgroup.children.length > colCount) {
    colgroup.removeChild(colgroup.lastChild)
  }

  for (let i = 0; i < colCount; i++) {
    const col = colgroup.children[i]
    if (!col.style.width) {
      const sampleCell = findCellAtCol(table, i)
      if (sampleCell && sampleCell.offsetWidth) {
        col.style.width = sampleCell.offsetWidth + 'px'
      }
    }
  }
  return colgroup
}

function findCellAtCol (table, colIndex) {
  for (let r = 0; r < table.rows.length; r++) {
    const row = table.rows[r]
    let colPos = 0
    for (let c = 0; c < row.cells.length; c++) {
      const cell = row.cells[c]
      const span = cell.colSpan || 1
      if (colPos <= colIndex && colIndex < colPos + span) {
        if (span === 1) return cell
      }
      colPos += span
    }
  }
  return null
}

export function syncColumnWidth (table, colIndex, widthPx) {
  const widthStr = widthPx + 'px'
  const colgroup = table.querySelector('colgroup')
  if (colgroup && colgroup.children[colIndex]) {
    colgroup.children[colIndex].style.width = widthStr
  }
  for (let r = 0; r < table.rows.length; r++) {
    const row = table.rows[r]
    let colPos = 0
    for (let c = 0; c < row.cells.length; c++) {
      const cell = row.cells[c]
      const span = cell.colSpan || 1
      if (colPos <= colIndex && colIndex < colPos + span && span === 1) {
        cell.style.width = widthStr
      }
      colPos += span
    }
  }
}

export function normalizeGapTables (doc) {
  if (!doc) return
  doc.querySelectorAll('table').forEach(table => {
    ensureTableLayout(table)
    ensureColgroup(table, doc)
  })
}

export function setupGapTableColumnResize (editor) {
  const doc = editor.document
  const win = editor.window
  let dragging = null
  let hoverCell = null

  function isCell (el) {
    return el && el.tagName && /^(TD|TH)$/i.test(el.tagName)
  }

  function isNearRightEdge (cell, clientX) {
    const rect = cell.getBoundingClientRect()
    return rect.right - clientX <= EDGE
  }

  function clearHoverCursor () {
    if (hoverCell) {
      hoverCell.style.cursor = ''
      hoverCell = null
    }
  }

  function onMouseDown (e) {
    const target = e.target
    if (!isCell(target) || !isNearRightEdge(target, e.clientX)) return

    const table = target.closest('table')
    if (!table) return

    e.preventDefault()
    e.stopPropagation()

    ensureTableLayout(table)
    ensureColgroup(table, doc)

    const colIndex = getLogicalColIndex(target)
    const colgroup = table.querySelector('colgroup')
    const col = colgroup && colgroup.children[colIndex]
    const startX = e.clientX
    const startWidth = (col && col.offsetWidth) || target.offsetWidth || MIN_WIDTH

    dragging = { table, colIndex, startX, startWidth }
    doc.body.style.cursor = 'col-resize'
    doc.body.style.userSelect = 'none'
  }

  function onMouseMove (e) {
    if (dragging) {
      const delta = e.clientX - dragging.startX
      const newWidth = Math.max(MIN_WIDTH, dragging.startWidth + delta)
      syncColumnWidth(dragging.table, dragging.colIndex, newWidth)
      return
    }

    clearHoverCursor()
    const target = e.target
    if (isCell(target) && isNearRightEdge(target, e.clientX)) {
      target.style.cursor = 'col-resize'
      hoverCell = target
    }
  }

  function onMouseUp () {
    if (!dragging) return
    dragging = null
    doc.body.style.cursor = ''
    doc.body.style.userSelect = ''
  }

  doc.addEventListener('mousedown', onMouseDown, true)
  doc.addEventListener('mousemove', onMouseMove, true)
  win.addEventListener('mouseup', onMouseUp, true)

  return function destroy () {
    clearHoverCursor()
    doc.removeEventListener('mousedown', onMouseDown, true)
    doc.removeEventListener('mousemove', onMouseMove, true)
    win.removeEventListener('mouseup', onMouseUp, true)
    if (dragging) onMouseUp()
  }
}
