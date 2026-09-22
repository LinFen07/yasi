import { StudentWritingAnswer } from '@/typings/exam'

/** 组装写作提交 payload，确保每题独立对象且带当前用户 ID（纯函数，便于单测） */
export function buildWritingSubmitPayload(
  wirrteExam: Array<{ questionItems: Array<{ id: number }> }>,
  correctWritte: string[],
  paperId: number,
  studentId: number,
): StudentWritingAnswer[] {
  if (!paperId || !studentId) return []

  return wirrteExam
    .slice(0, 2)
    .map((part, index) => {
      const question = part?.questionItems?.[0]
      const composition = correctWritte[index] ?? ''
      if (!question?.id || !String(composition).trim()) return null
      return {
        paperId,
        questionId: question.id,
        composition,
        studentId,
      }
    })
    .filter((item): item is StudentWritingAnswer => item != null)
}
