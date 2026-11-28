/** 写作草稿本地缓存：按试卷和 Part 独立保存，刷新页面后可恢复。 */

const DRAFT_PREFIX = 'writteDraft:';

const getDraftKey = (paperId: number, partIndex: number): string =>
  `${DRAFT_PREFIX}${paperId}:${partIndex}`;

export const readWritteDraft = (paperId: number, partIndex: number): string => {
  if (!paperId) return '';
  try {
    return localStorage.getItem(getDraftKey(paperId, partIndex)) || '';
  } catch {
    return '';
  }
};

export const writeWritteDraft = (
  paperId: number,
  partIndex: number,
  answer: string
): void => {
  if (!paperId) return;
  try {
    if (answer) {
      localStorage.setItem(getDraftKey(paperId, partIndex), answer);
    } else {
      localStorage.removeItem(getDraftKey(paperId, partIndex));
    }
  } catch {
    // 隐私模式或存储配额不足时静默降级，作答仍保留在内存中
  }
};

/** 清除写作草稿。传入 paperId 时只清除该试卷，否则清除全部。 */
export const clearWritteDrafts = (paperId?: number): void => {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(DRAFT_PREFIX)) continue;
      if (paperId && !key.slice(DRAFT_PREFIX.length).startsWith(`${paperId}:`)) continue;
      keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // 存储不可用时无需处理
  }
};
