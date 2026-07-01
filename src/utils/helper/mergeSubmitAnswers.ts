/**
 * 提交答案列表：保持每条 prefix 独立（填空/拖拽每空一条）。
 * 双选题由后端 MultipleChoiceStrategy 合并同题多条提交。
 */
export function mergeSubmitAnswerItems(
  items: Array<{ questionId?: number; content?: string; prefix?: string }>
) {
  return items
    .filter((item) => item.questionId !== undefined)
    .map((item) => ({
      questionId: item.questionId!,
      content: (item.content || '').trim(),
      prefix: item.prefix,
    }))
    .filter((item) => item.content);
}
