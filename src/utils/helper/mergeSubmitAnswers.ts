export type SubmitAnswerItem = {
  questionId: number;
  content: string;
  prefix?: string;
};

/**
 * 提交答案列表：保持每条 prefix 独立（填空/拖拽每空一条）。
 * 双选题由后端 MultipleChoiceStrategy 合并同题多条提交。
 */
export function mergeSubmitAnswerItems(
  items: Array<{ questionId?: number; content?: string; prefix?: string }>,
): SubmitAnswerItem[] {
  return items
    .filter((item) => item.questionId !== undefined)
    .map((item) => ({
      questionId: item.questionId!,
      content: (item.content || '').trim(),
      prefix: item.prefix || '1',
    }))
    .filter((item) => item.content);
}

/**
 * 从 completedAnswers 收集提交项，并合并 localStorage 中的填空草稿（刷新页面后可能未写入 store）。
 */
export function collectListenReadSubmitItems(
  completedAnswers: Array<{ questionId?: number; content?: string; prefix?: string }>,
  paperId?: number,
): SubmitAnswerItem[] {
  const byKey = new Map<string, SubmitAnswerItem>();

  const put = (item: { questionId?: number; content?: string; prefix?: string }) => {
    if (item.questionId === undefined) return;
    const content = (item.content || '').trim();
    if (!content) return;
    const prefix = item.prefix || '1';
    byKey.set(`${item.questionId}::${prefix}`, {
      questionId: item.questionId,
      content,
      prefix,
    });
  };

  completedAnswers.forEach(put);

  if (paperId) {
    completedAnswers.forEach((item, idx) => {
      if (!item || typeof item !== 'object' || item.questionId === undefined) return;
      const draft = localStorage.getItem(`answer-input-${paperId}-${idx + 1}`)?.trim();
      if (!draft) return;
      put({ ...item, content: draft });
    });
  }

  return Array.from(byKey.values());
}
