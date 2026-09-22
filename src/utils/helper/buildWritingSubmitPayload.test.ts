import { buildWritingSubmitPayload } from './buildWritingSubmitPayload'

describe('buildWritingSubmitPayload', () => {
  const wirrteExam = [
    { questionItems: [{ id: 101 }] },
    { questionItems: [{ id: 102 }] },
  ]

  it('returns two items with studentId when both tasks have content', () => {
    const payload = buildWritingSubmitPayload(
      wirrteExam,
      ['Task 1 essay', 'Task 2 essay'],
      50,
      23,
    )
    expect(payload).toHaveLength(2)
    expect(payload[0]).toEqual({
      paperId: 50,
      questionId: 101,
      composition: 'Task 1 essay',
      studentId: 23,
    })
    expect(payload[1]).toEqual({
      paperId: 50,
      questionId: 102,
      composition: 'Task 2 essay',
      studentId: 23,
    })
    expect(payload[0]).not.toBe(payload[1])
  })

  it('returns empty when studentId is missing', () => {
    expect(buildWritingSubmitPayload(wirrteExam, ['a', 'b'], 50, 0)).toEqual([])
  })

  it('skips empty composition', () => {
    const payload = buildWritingSubmitPayload(wirrteExam, ['only task 1', ''], 50, 23)
    expect(payload).toHaveLength(1)
    expect(payload[0].questionId).toBe(101)
  })

  it('each item is independent (no shared reference)', () => {
    const payload = buildWritingSubmitPayload(wirrteExam, ['A', 'B'], 1, 2)
    payload[0].composition = 'changed'
    expect(payload[1].composition).toBe('B')
  })
})
