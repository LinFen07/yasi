import { ExamType, StudentAnswer, StudentWritingAnswer } from '@/typings/exam'
import stores from '@/stores'
import { buildWritingSubmitPayload } from '@/utils/helper/buildWritingSubmitPayload'

export { buildWritingSubmitPayload }

function stripTagsNormalize(input: string): string {
  if (!input) return ''
  const div = document.createElement('div')
  div.innerHTML = input
  const text = div.textContent || ''
  return text.replace(/\s+/g, ' ').trim()
}

export function stripHtmlTags(html: string): string {
  if (!html) return ''
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  const textContent = tempDiv.textContent || tempDiv.innerText || ''
  return textContent
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

const studentAnswer: StudentAnswer = {
  questionId: 0,
  content: '1',
  prefix: '1',
}

export function submitStudentSelectAnswer(
  questionsArr: ExamType[],
  index: number,
  value: string,
  questionIndex: number,
): void {
  Object.assign(studentAnswer, {
    questionId: questionsArr[index].id,
    content: value,
    prefix: '1',
  })

  stores.AnswerStore.changeAnswer(questionIndex, { ...studentAnswer })
}

export function submitStudentBlankAnswer(
  questionArr: ExamType,
  i: number,
  prevCount: number,
  value: string,
  _correctIndex: number,
  prefix: string,
): void {
  Object.assign(studentAnswer, {
    questionId: questionArr.id,
    content: value,
    prefix,
  })
  stores.AnswerStore.changeAnswer(prevCount + i, { ...studentAnswer })
}

export function submitStudentWritteAnswer(
  questionArr: ExamType,
  index: number,
  value: string,
): void {
  const answer: StudentWritingAnswer = {
    paperId: stores.ExamStore.paperId,
    questionId: questionArr.id,
    composition: value,
    studentId: stores.UserStore.userId,
  }
  stores.AnswerStore.changeStudentWritteAnswer(index, answer)
}

// re-export for tests that reference stripTagsNormalize behavior via stripHtmlTags
export { stripTagsNormalize }
