import { getAnswerList, getComposition } from '@/api/studentAnswer'
import stores from '@/stores'

const REPORT_PAPER_KEY = 'lastReportPaperId'

const NOT_RELEASED_MESSAGE =
  /(?:成绩|分数|报告|结果|查询|查看).{0,12}(?:尚未|暂未|未|暂不|不能|无法).{0,8}(?:开放|公布|发布|查询|查看)|(?:尚未|暂未|暂不|未|没有).{0,8}(?:开放|公布|发布|查询|查看).{0,8}(?:成绩|分数|报告|结果|查询)?|(?:等待|请等待).{0,8}(?:教师|老师).{0,8}(?:开放|公布|发布)/

export function getReportFailure(value: unknown) {
  if (!value || typeof value !== 'object') return null

  const candidate = value as {
    code?: number | string
    message?: string
    msg?: string
    response?: unknown
  }
  const responseValue = candidate.response
  const httpResponse =
    responseValue &&
    typeof responseValue === 'object' &&
    'status' in responseValue
      ? (responseValue as { status?: number; data?: unknown })
      : undefined
  const body =
    httpResponse?.data && typeof httpResponse.data === 'object'
      ? (httpResponse.data as { code?: number | string; message?: string; msg?: string })
      : candidate
  const code = Number(body.code)
  const hasCode = body.code !== undefined && body.code !== null && Number.isFinite(code)
  const status = Number(httpResponse?.status) || 0
  const isFailure = status >= 400 || (hasCode && code !== 1)

  if (!isFailure) return null

  const message = String(
    (typeof httpResponse?.data === 'string' && httpResponse.data) ||
      body.message ||
      body.msg ||
      candidate.message ||
      '',
  )
  const isAuthFailure = [401, 403].includes(status) || [401, 402, 502].includes(code)

  return {
    message,
    awaitingRelease: !isAuthFailure && NOT_RELEASED_MESSAGE.test(message),
  }
}

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
    if (
      getReportFailure(answerRes) ||
      getReportFailure(compositionRes) ||
      items.length > 0 ||
      attempt === maxAttempts - 1
    ) {
      break
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  return { answerRes: lastAnswerRes, compositionRes: lastCompositionRes, items: lastItems }
}
