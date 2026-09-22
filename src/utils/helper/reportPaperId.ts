import { getAnswerList, getComposition } from '@/api/studentAnswer'
import stores from '@/stores'

const REPORT_PAPER_KEY = 'lastReportPaperId'

export function persistReportPaperId(paperId: number) {
  if (!paperId) return
  try {
    localStorage.setItem(REPORT_PAPER_KEY, String(paperId))
  } catch {
    // ignore
  }
  stores.ExamStore.changePaperId(paperId)
}

export function resolveReportPaperId(searchId?: string | null): number {
  const fromSearch = searchId ? Number(searchId) : 0
  if (fromSearch > 0) return fromSearch

  const fromStore = Number(stores.ExamStore.paperId) || 0
  if (fromStore > 0) return fromStore

  try {
    const cached = Number(localStorage.getItem(REPORT_PAPER_KEY) || 0)
    if (cached > 0) return cached
  } catch {
    // ignore
  }

  return 0
}

export async function fetchReportWithRetry(
  paperId: number,
  studentId: number,
  maxAttempts = 3,
  delayMs = 800,
) {
  let lastAnswerRes: unknown = null
  let lastCompositionRes: unknown = null
  let lastItems: unknown[] = []

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const [answerRes, compositionRes] = await Promise.all([
      getAnswerList(1, 500, { paperId, studentId }),
      getComposition(paperId, studentId),
    ])
    const items =
      (answerRes as { response?: { pageResult?: { items?: unknown[] } } })?.response?.pageResult
        ?.items || []
    lastAnswerRes = answerRes
    lastCompositionRes = compositionRes
    lastItems = items
    if (items.length > 0 || attempt === maxAttempts - 1) {
      break
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  return { answerRes: lastAnswerRes, compositionRes: lastCompositionRes, items: lastItems }
}
