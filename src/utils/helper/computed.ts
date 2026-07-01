import { Exam, ExamType } from '@/typings/exam';

/** 与底部导航栏一致的题号占用数 */
export function getQuestionSlotCount(questionItem: ExamType): number {
  if (Array.isArray(questionItem.correctArray) && questionItem.correctArray.length > 0) {
    return questionItem.correctArray.length;
  }
  return 1;
}

export function computedPrevCount(title: string, exam: Array<Exam>): number {
  const index = +title[4] - 1;
  let prevCount = 0;
  for (let i = 0; i < index; i++) {
    for (let j = 0; j < exam[i].questionItems.length; j++) {
      prevCount += getQuestionSlotCount(exam[i].questionItems[j]);
    }
  }
  return prevCount;
}

export function computedBlanksPrevCount(pre: number, title: string, exam: Array<Exam>) {
  const index = +title[4] - 1;
  for (let j = 0; j < exam[index].questionItems.length; j++) {
    if (exam[index].questionItems[j].topicType == '4') return pre;
    pre += getQuestionSlotCount(exam[index].questionItems[j]);
  }
  return pre;
}

export function computedTickPrevCount(title: string, exam: Array<Exam>) {
  let prevCount = computedPrevCount(title, exam);
  const index = +title[4] - 1;
  for (let j = 0; j < exam[index].questionItems.length; j++) {
    if (exam[index].questionItems[j].topicType == '5') return prevCount;
    prevCount += getQuestionSlotCount(exam[index].questionItems[j]);
  }
  return prevCount;
}

export function computedDragPrevCount(title: string, exam: Array<Exam>) {
  let prevCount = computedPrevCount(title, exam);
  const index = +title[4] - 1;
  for (let j = 0; j < exam[index].questionItems.length; j++) {
    if (exam[index].questionItems[j].topicType == '6') return prevCount;
    prevCount += getQuestionSlotCount(exam[index].questionItems[j]);
  }
  return prevCount;
}

export function computedCheckSelectPrevCount(title: string, exam: Array<Exam>) {
  let prevCount = computedPrevCount(title, exam);
  const index = +title[4] - 1;
  for (let j = 0; j < exam[index].questionItems.length; j++) {
    if (exam[index].questionItems[j].topicType == '2') return prevCount;
    prevCount += getQuestionSlotCount(exam[index].questionItems[j]);
  }
  return prevCount;
}


export const countWords = (text: string): number => {
  if (!text) return 0;

  // 匹配英文单词和中文字符
  const matches = text.match(/[\u4e00-\u9fa5]|\b\w+\b/g);
  return matches ? matches.length : 0;
}
