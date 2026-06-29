const ALIGN_CMD_MAP = {
  justifyleft: 'left',
  justifycenter: 'center',
  justifyright: 'right',
  justifyjustify: 'justify'
}

const JUSTIFY_UI_CMDS = Object.keys(ALIGN_CMD_MAP)
const JUSTIFY_CMD = 'justify'

function findParentCell (node, body) {
  while (node && node !== body) {
    if (node.nodeType === 1) {
      const tag = node.tagName
      if (tag === 'TD' || tag === 'TH' || tag === 'CAPTION') return node
    }
    node = node.parentNode
  }
  return null
}

function getCellAlign (cell, win) {
  if (!cell) return 'left'
  if (cell.style.textAlign) return cell.style.textAlign
  const computed = win.getComputedStyle(cell).textAlign
  return computed || 'left'
}

function isJustifyCommand (cmd) {
  return cmd === JUSTIFY_CMD || JUSTIFY_UI_CMDS.includes(cmd)
}

/** 允许在表格单元格内使用居左/居中/居右/两端对齐 */
export function setupGapEditorTableAlign (editor) {
  const body = editor.body
  const win = editor.window
  const originQueryState = editor.queryCommandState.bind(editor)
  const originQueryValue = editor.queryCommandValue.bind(editor)
  const originExec = editor.execCommand.bind(editor)

  editor.queryCommandState = function (cmd) {
    if (isJustifyCommand(cmd) && findParentCell(editor.selection.getStart(), body)) {
      return 0
    }
    return originQueryState(cmd)
  }

  editor.queryCommandValue = function (cmd) {
    if (isJustifyCommand(cmd)) {
      const cell = findParentCell(editor.selection.getStart(), body)
      if (cell) return getCellAlign(cell, win)
    }
    return originQueryValue(cmd)
  }

  editor.execCommand = function (cmd, ...args) {
    const cell = findParentCell(editor.selection.getStart(), body)
    if (cell) {
      if (cmd === JUSTIFY_CMD && args[0]) {
        cell.style.textAlign = args[0]
        editor.fireEvent('contentChange')
        editor.fireEvent('selectionchange')
        return true
      }
      const align = ALIGN_CMD_MAP[cmd]
      if (align) {
        cell.style.textAlign = align
        editor.fireEvent('contentChange')
        editor.fireEvent('selectionchange')
        return true
      }
    }
    return originExec(cmd, ...args)
  }

  return function destroy () {
    editor.queryCommandState = originQueryState
    editor.queryCommandValue = originQueryValue
    editor.execCommand = originExec
  }
}
