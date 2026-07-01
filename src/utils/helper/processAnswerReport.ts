/**
 * 成绩报告：答题记录展开、正确性判断、模块统计（与前端 report 逻辑对齐，供测试与页面共用）
 */

export type ReportRow = {
  key: string;
  module: string;
  moduleNumber: number;
  questionType: number | null;
  prefix: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  apiScore: number;
};

const LISTENING_TYPES = new Set([1, 2, 4, 6])
const READING_TYPES = new Set([1, 2, 4, 6])

export const DRAG_OPTIONS: Array<[string, string]> = [
  ['A', 'A'],
  ['B', 'B'],
  ['C', 'C'],
  ['D', 'D'],
  ['E', 'E'],
  ['F', 'F'],
  ['G', 'G'],
  ['H', 'H'],
  ['I', 'I'],
  ['J', 'J'],
  ['K', 'K'],
  ['L', 'L'],
  ['M', 'M'],
  ['N', 'N'],
  ['O', 'O'],
  ['P', 'P'],
  ['Q', 'Q'],
  ['R', 'R'],
  ['S', 'S'],
  ['T', 'T'],
  ['U', 'U'],
  ['V', 'V'],
  ['W', 'W'],
  ['X', 'X'],
  ['Y', 'Y'],
  ['Z', 'Z'],
]

export const LISTENING_DRAG_OPTIONS = DRAG_OPTIONS.slice(0, 7)
export const READING_DRAG_OPTIONS = DRAG_OPTIONS

export const TABLE_ROW_PREFIX_COUNTS: Record<number, number> = {
  1: 6,
  2: 7,
  3: 7,
  4: 6,
  5: 6,
  6: 7,
  7: 7,
  8: 6,
  9: 7,
  10: 6,
}

function normalizeAnswer(value: string | null | undefined): string {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim().toLowerCase()
}

function splitByComma(value: string): string[] {
  if (!value || !String(value).trim()) return []
  return String(value)
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
}

function splitMergedTableContent(content: string, rowIndex: number): string[] {
  const parts = splitByComma(content)
  if (!parts.length) return []
  const expected = TABLE_ROW_PREFIX_COUNTS[rowIndex]
  if (expected == null || parts.length <= expected) return parts
  const head = parts.slice(0, expected - 1)
  const tail = parts.slice(expected - 1).join(',')
  return [...head, tail]
}

function expandMultiSlotGroup(group: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  if (group.length === 0) return group

  const first = group[0]
  const qtype = first.questionType as number | undefined

  if (group.length === 1 && (qtype === 1 || qtype === 2)) {
    const parts = splitByComma(String(first.content ?? ''))
    if (parts.length > 1) {
      return parts.map((part, i) => ({ ...first, prefix: String(i + 1), content: part }))
    }
    return group
  }

  if (group.length <= 1) return group

  if (qtype === 4 || qtype === 6) {
    const expanded: Array<Record<string, unknown>> = []
    for (const item of group) {
      const prefix = String(item.prefix ?? '1')
      let rowIndex = 1
      try {
        rowIndex = parseInt(prefix, 10)
      } catch {
        rowIndex = 1
      }
      const parts = splitMergedTableContent(String(item.content ?? ''), rowIndex)
      parts.forEach((part, i) => {
        expanded.push({ ...item, prefix: String(i + 1), content: part })
      })
    }
    return expanded.length ? expanded : group
  }

  if (qtype === 1 || qtype === 2) {
    const expanded: Array<Record<string, unknown>> = []
    for (const item of group) {
      const parts = splitByComma(String(item.content ?? ''))
      parts.forEach((part, i) => {
        expanded.push({ ...item, prefix: String(i + 1), content: part })
      })
    }
    return expanded.length ? expanded : group
  }

  return group
}

function splitLegacyMergedFirstRow(group: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  if (group.length <= 1) return group
  const first = group[0]
  const content = String(first.content ?? '').trim()
  if (!content || !content.includes(',')) return group
  const restEmpty = group.slice(1).every((it) => !String(it.content ?? '').trim())
  if (!restEmpty) return group
  const parts = splitByComma(content)
  if (parts.length !== group.length) return group
  return group.map((it, idx) => ({ ...it, content: parts[idx] }))
}

export function expandAnswerItemsForReport(items: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  if (!items?.length) return []

  const byQid = new Map<unknown, Array<Record<string, unknown>>>()
  for (const item of items) {
    const qid = item.questionId
    if (!byQid.has(qid)) byQid.set(qid, [])
    byQid.get(qid)!.push(item)
  }

  const expanded: Array<Record<string, unknown>> = []
  const sortedKeys = [...byQid.keys()].sort((a, b) => {
    if (a == null && b == null) return 0
    if (a == null) return 1
    if (b == null) return -1
    return Number(a) - Number(b)
  })

  for (const qid of sortedKeys) {
    const group = [...byQid.get(qid)!]
    group.sort((a, b) => {
      const pa = parseInt(String(a.prefix ?? 0), 10)
      const pb = parseInt(String(b.prefix ?? 0), 10)
      return (Number.isNaN(pa) ? 0 : pa) - (Number.isNaN(pb) ? 0 : pb)
    })
    let processed = splitLegacyMergedFirstRow(group)
    processed = expandMultiSlotGroup(processed)
    expanded.push(...processed)
  }

  return expanded
}

function isCorrectStudentAnswer(student: string, correct: string, qtype: number | null | undefined): boolean {
  const s = normalizeAnswer(student)
  const c = normalizeAnswer(correct)
  if (!s && !c) return true
  if (qtype === 1 || qtype === 2) {
    const ss = new Set(splitByComma(s))
    const cs = new Set(splitByComma(c))
    if (ss.size !== cs.size) return false
    for (const x of ss) {
      if (!cs.has(x)) return false
    }
    return true
  }
  return s === c
}

export function processAnswerItems(items: Array<Record<string, unknown>>): ReportRow[] {
  const rows: ReportRow[] = []
  let listenNum = 0
  let readNum = 0

  for (const item of expandAnswerItemsForReport(items)) {
    const qtype = item.questionType as number | null | undefined
    let module = '未知'
    if (qtype != null && LISTENING_TYPES.has(qtype)) module = '听力'
    else if (qtype != null && READING_TYPES.has(qtype)) module = '阅读'

    let moduleNumber: number
    if (module === '听力') {
      listenNum += 1
      moduleNumber = listenNum
    } else if (module === '阅读') {
      readNum += 1
      moduleNumber = readNum
    } else {
      moduleNumber = rows.length + 1
    }

    const studentRaw = String(item.content ?? '')
    const correctRaw = String(item.correctAnswer ?? item.correct_answer ?? '')
    const isCorrect = isCorrectStudentAnswer(studentRaw, correctRaw, qtype ?? null)
    const scoreRaw = item.score
    let apiScore: number
    try {
      apiScore = scoreRaw != null ? Number(scoreRaw) / 10 : isCorrect ? 1 : 0
    } catch {
      apiScore = isCorrect ? 1 : 0
    }

    rows.push({
      key: `${item.questionId}-${item.prefix ?? ''}-${moduleNumber}`,
      module,
      moduleNumber,
      questionType: qtype ?? null,
      prefix: String(item.prefix ?? ''),
      studentAnswer: studentRaw || '未作答',
      correctAnswer: correctRaw || '—',
      isCorrect,
      apiScore,
    })
  }

  return rows
}

export function computeModuleStats(rows: ReportRow[]): {
  listen: { total: number; correct: number }
  read: { total: number; correct: number }
} {
  const listenRows = rows.filter((r) => r.module === '听力')
  const readRows = rows.filter((r) => r.module === '阅读')
  return {
    listen: {
      total: listenRows.length,
      correct: listenRows.filter((r) => r.isCorrect).length,
    },
    read: {
      total: readRows.length,
      correct: readRows.filter((r) => r.isCorrect).length,
    },
  }
}

export function getDragOptionsForModule(module: string): Array<[string, string]> {
  return module === 'listen' ? LISTENING_DRAG_OPTIONS : READING_DRAG_OPTIONS
}
