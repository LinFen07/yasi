/**
 * 提交前合并答题项：同一 questionId 多 prefix 不合并为一条逗号串（避免后端只存第一格）
 */

export type SubmitAnswerItem = {
  questionId: number
  content?: string
  prefix?: string
}

export function mergeSubmitAnswerItems(items: SubmitAnswerItem[]): SubmitAnswerItem[] {
  if (!items?.length) return []

  return items
    .filter((item) => item?.questionId != null)
    .map((item) => ({
      questionId: item.questionId,
      content: item.content ?? '',
      prefix: item.prefix ?? '1',
    }))
    .filter((item) => String(item.content).trim() !== '')
}
