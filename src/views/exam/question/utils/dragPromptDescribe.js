/** 从题干 HTML/纯文本中解析「题号 + 描述」，用于配对题 describe 回显 */
export function parseDragDescribeFromTitle (titleHtml, prefix) {
  if (!titleHtml || prefix == null || prefix === '') return ''
  const prefixStr = String(prefix).trim()
  const text = String(titleHtml)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\r/g, '')
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  const escaped = prefixStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`^${escaped}\\s+(.+)$`),
    new RegExp(`^${escaped}[:.．]\\s*(.+)$`),
    new RegExp(`^Question\\s+${escaped}[:.．]?\\s*(.+)$`, 'i')
  ]
  for (const line of lines) {
    for (const re of patterns) {
      const match = line.match(re)
      if (match && match[1]) {
        return match[1].trim()
      }
    }
  }
  return ''
}

export function normalizeDragPromptItem (item, titleHtml) {
  let describe = (item.describe && String(item.describe).trim())
    || parseDragDescribeFromTitle(titleHtml, item.prefix)
    || ''
  return {
    prefix: item.prefix != null ? String(item.prefix) : '',
    describe,
    content: item.content || '',
    score: item.score != null ? Number(item.score) : 1,
    itemUuid: 'prompt'
  }
}
