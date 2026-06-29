export const DRAG_SLOT_HTML = '<span class="drag-slot" contenteditable="false">&nbsp;</span>'

export function hasDragSlot (html) {
  if (!html || !String(html).trim()) return false
  return /drag-slot/.test(String(html))
}

export function stripHtml (html) {
  if (!html) return ''
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/** 描述里除空位外是否还有文字 */
export function hasDescribeText (html) {
  const plain = stripHtml(
    String(html || '').replace(/<span[^>]*class=["'][^"']*drag-slot[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, '')
  )
  return plain.length > 0
}
