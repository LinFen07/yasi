import { mergeSubmitAnswerItems } from './mergeSubmitAnswers'

describe('mergeSubmitAnswerItems', () => {
  it('keeps separate rows per prefix instead of merging into one comma string', () => {
    const items = [
      { questionId: 1, prefix: '1', content: 'a' },
      { questionId: 1, prefix: '2', content: 'b' },
      { questionId: 2, prefix: '1', content: 'c' },
    ]
    const merged = mergeSubmitAnswerItems(items)
    expect(merged).toEqual([
      { questionId: 1, prefix: '1', content: 'a' },
      { questionId: 1, prefix: '2', content: 'b' },
      { questionId: 2, prefix: '1', content: 'c' },
    ])
  })

  it('filters empty content', () => {
    const merged = mergeSubmitAnswerItems([
      { questionId: 1, prefix: '1', content: '' },
      { questionId: 1, prefix: '2', content: '   ' },
      { questionId: 2, prefix: '1', content: 'ok' },
    ])
    expect(merged).toHaveLength(1)
    expect(merged[0].questionId).toBe(2)
  })

  it('defaults missing prefix to 1', () => {
    const merged = mergeSubmitAnswerItems([{ questionId: 5, content: 'x' }])
    expect(merged[0].prefix).toBe('1')
  })
})
