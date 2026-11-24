import { Exam, ExamType } from '@/typings/exam';

/**
 * 计算多选题需要选择的答案数量
 * 优先级：
 * 1. correctArray（后端直接给了正确答案数组）
 * 2. items 中 score 非空的个数（数据里的正解标记）
 * 3. 兜底返回 2
 */
export function getRequiredSelectCount(questionItem: ExamType): number {
  const anyItem = questionItem as any;

  if (Array.isArray(anyItem.correctArray) && anyItem.correctArray.length > 0) {
    return anyItem.correctArray.length;
  }

  const items = Array.isArray(anyItem.items) ? anyItem.items : [];
  const scoredCount = items.filter(
    (it: any) => it.score !== null && it.score !== undefined && it.score !== ''
  ).length;

  if (scoredCount > 0) return scoredCount;

  return 2;
}

/**
 * 计算每个题型占用的题号数（与导航栏完全一致）
 * - 写作题 (7) : 0
 * - 单选题 (1) : 1
 * - 多选题 (2) : 按 getRequiredSelectCount 动态计算
 * - 填空题 (4)、地图/图表 (5)、匹配题 (6) : 根据 items 数组长度
 * - 其他未知类型: 兜底返回 items.length 或 1
 */
export function getQuestionSlotCount(questionItem: ExamType): number {
  const type = questionItem.questionType;
  if (type === 7) return 0;
  if (type === 1) return 1;
  if (type === 2) return getRequiredSelectCount(questionItem);
  if ([4, 5, 6].includes(type as number)) {
    // 拖拽题(6)：只计算 prompt 项（题目位置），不计算 option 项（选项）
    if (type === 6 && Array.isArray(questionItem.items)) {
      const promptCount = questionItem.items.filter(item => item.itemUuid === 'prompt').length;
      return promptCount > 0 ? promptCount : questionItem.items.length;
    }
    return Array.isArray(questionItem.items) ? questionItem.items.length : 0;
  }
  // 兜底：如果 items 存在则用其长度，否则默认 1
  return Array.isArray(questionItem.items) ? questionItem.items.length : 1;
}

/**
 * 计算指定 part（由 title 确定）之前的题号总数（即当前 part 的起始题号 - 1）
 * 修复：使用正则提取数字，支持 "Part10" 等两位及以上编号
 */
export function computedPrevCount(title: string, exam: Array<Exam>): number {
  const match = title.match(/\d+/);
  if (!match) return 0;
  const index = parseInt(match[0], 10) - 1;
  let prevCount = 0;
  for (let i = 0; i < index; i++) {
    for (let j = 0; j < exam[i].questionItems.length; j++) {
      prevCount += getQuestionSlotCount(exam[i].questionItems[j]);
    }
  }
  return prevCount;
}

/** 判断 item 上的 shareWithPrev 旧字段是否为真（历史数据兼容） */
function isShareWithPrev(item: any): boolean {
  const raw = item?.shareWithPrev;
  return raw === true || raw === 'true' || raw === 1 || raw === '1';
}

/**
 * 计算一个填空题内每个空的「题号组标识」。
 *
 * 组标识相同且相邻的若干空属于同一个题号组（一题多空），
 * 例：groupGap = ['1', '1'] 表示两个空共用第 1 个题号。
 *
 * 兜底策略（务必保持"宁可多占号，也不可误并组"）：
 *   - groupGap 缺失 / 空串 / 空白 → 该空自成一组
 *   - groupGap 缺失但带旧字段 shareWithPrev → 与上一空同组（兼容存量题目）
 * 误并组会让整题只占 1 个题号，导致后续题号整体前移（比多占号更隐蔽、更难排查）。
 */
export function getGapGroupKeys(items: any[]): string[] {
  const list = Array.isArray(items) ? items : [];
  const keys: string[] = [];
  let prevKey: string | null = null;

  list.forEach((item, index) => {
    const raw = item?.groupGap;
    const hasGroup = raw !== null && raw !== undefined && String(raw).trim() !== '';
    let key: string;
    if (hasGroup) {
      key = String(raw).trim();
    } else if (isShareWithPrev(item) && prevKey !== null) {
      key = prevKey;
    } else {
      key = String(index + 1);
    }
    keys.push(key);
    prevKey = key;
  });

  return keys;
}

/**
 * 计算一个填空题的「题号组数」（= 它占用的题号个数）
 * 连续且组标识相同的空属于同一组，只占 1 个题号
 */
export function getGapGroupCount(questionItem: ExamType): number {
  const items = Array.isArray(questionItem.items) ? questionItem.items : [];
  if (items.length === 0) return 0;
  const keys = getGapGroupKeys(items);
  let span = 1;
  for (let i = 1; i < keys.length; i++) {
    if (keys[i] !== keys[i - 1]) span += 1;
  }
  return span;
}

/**
 * 计算一个题目的「题号跨度」（占用的题号个数）
 * 与 getQuestionSlotCount（槽位跨度）的差异仅在填空题（type 4）：
 *   - 填空题：题号数 = 题号组数（同 groupGap 的连续若干空共用一个题号）
 *     双填空题（一个题两个空）只占 1 个题号，否则后续题号会整体后移
 *     （模考反馈：听力 Q12、阅读 Q33/Q35 是双填空题，导致后面题号全部 +1）
 *   - 缺 groupGap 时按槽位号兜底，即每个空各占一个题号（绝不并成一组）
 * 其余题型题号跨度 = 槽号跨度，直接复用 getQuestionSlotCount
 */
export function getQuestionNumberSpan(questionItem: ExamType): number {
  const type = questionItem.questionType;
  if (type === 4) return getGapGroupCount(questionItem);
  return getQuestionSlotCount(questionItem);
}

/**
 * 计算指定 part 之前的「题号总数」（与 computedPrevCount 逻辑一致，只是用题号跨度累加）
 * 用于：题号显示、定位、correctListenAnswer、导航
 */
export function computedPrevQuestionCount(title: string, exam: Array<Exam>): number {
  const match = title.match(/\d+/);
  if (!match) return 0;
  const index = parseInt(match[0], 10) - 1;
  let prevCount = 0;
  for (let i = 0; i < index; i++) {
    for (let j = 0; j < exam[i].questionItems.length; j++) {
      prevCount += getQuestionNumberSpan(exam[i].questionItems[j]);
    }
  }
  return prevCount;
}

/**
 * 计算当前 part 中，第一个填空题（topicType === '4'）之前的题号数（相对于 part 起始）
 */
export function computedBlanksPrevCount(pre: number, title: string, exam: Array<Exam>): number {
  const index = +title[4] - 1;
  let count = pre; // 起始偏移
  const partItems = exam[index].questionItems;
  for (let j = 0; j < partItems.length; j++) {
    const item = partItems[j];
    if (item.topicType === '4') {
      return count;
    }
    count += getQuestionSlotCount(item);
  }
  return count;
}

/**
 * 计算当前 part 中，第一个地图/图表题（topicType === '5'）之前的题号数
 */
export function computedTickPrevCount(title: string, exam: Array<Exam>): number {
  const prevCount = computedPrevCount(title, exam);
  const index = +title[4] - 1;
  let count = prevCount;
  const partItems = exam[index].questionItems;
  for (let j = 0; j < partItems.length; j++) {
    const item = partItems[j];
    if (item.topicType === '5') {
      return count;
    }
    count += getQuestionSlotCount(item);
  }
  return count;
}

/**
 * 计算当前 part 中，第一个匹配题（topicType === '6'）之前的题号数
 */
export function computedDragPrevCount(title: string, exam: Array<Exam>): number {
  const prevCount = computedPrevCount(title, exam);
  const index = +title[4] - 1;
  let count = prevCount;
  const partItems = exam[index].questionItems;
  for (let j = 0; j < partItems.length; j++) {
    const item = partItems[j];
    if (item.topicType === '6') {
      return count;
    }
    count += getQuestionSlotCount(item);
  }
  return count;
}

/**
 * 计算当前 part 中，第一个多选题（topicType === '2'）之前的题号数
 */
export function computedCheckSelectPrevCount(title: string, exam: Array<Exam>): number {
  const prevCount = computedPrevCount(title, exam);
  const index = +title[4] - 1;
  let count = prevCount;
  const partItems = exam[index].questionItems;
  for (let j = 0; j < partItems.length; j++) {
    const item = partItems[j];
    if (item.topicType === '2') {
      return count;
    }
    count += getQuestionSlotCount(item);
  }
  return count;
}

/**
 * 计算字符串的单词数（英文单词 + 中文字符）
 */
export const countWords = (text: string): number => {
  if (!text) return 0;
  const matches = text.match(/[\u4e00-\u9fa5]|\b\w+\b/g);
  return matches ? matches.length : 0;
};