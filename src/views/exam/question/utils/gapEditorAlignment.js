const BLOCK_TAGS = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV']

function findBlock (node, body) {
  while (node && node !== body) {
    if (node.nodeType === 1 && BLOCK_TAGS.includes(node.tagName)) {
      if (node.tagName === 'DIV' && node === body) break
      return node
    }
    node = node.parentNode
  }
  return null
}

function getInheritableAlign (editor) {
  const range = editor.selection.getRange()
  const block = findBlock(range.startContainer, editor.body)
  if (!block) return null

  const inlineAlign = block.style.textAlign
  if (inlineAlign) return inlineAlign

  const computed = editor.window.getComputedStyle(block).textAlign
  if (computed && computed !== 'left' && computed !== 'start') {
    return computed
  }
  return null
}

function applyAlignToCurrentBlock (editor, align) {
  if (!align) return
  const range = editor.selection.getRange()
  const block = findBlock(range.startContainer, editor.body)
  if (!block || block.style.textAlign === align) return
  block.style.textAlign = align
  editor.fireEvent('contentChange')
}

/** 回车换行时继承上一段的对齐方式（居中/右对齐等） */
export function setupGapEditorAlignmentInherit (editor) {
  let pendingAlign = null

  const onKeyDown = function (name, evt) {
    const key = evt.keyCode || evt.which
    if (key !== 13 || evt.shiftKey) return
    pendingAlign = getInheritableAlign(editor)
  }

  const onKeyUp = function (name, evt) {
    const key = evt.keyCode || evt.which
    if (key !== 13 || evt.shiftKey || !pendingAlign) return
    const align = pendingAlign
    pendingAlign = null
    setTimeout(() => applyAlignToCurrentBlock(editor, align), 0)
  }

  editor.addListener('keydown', onKeyDown)
  editor.addListener('keyup', onKeyUp)

  return function destroy () {
    pendingAlign = null
  }
}
