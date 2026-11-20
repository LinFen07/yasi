import { mergeSubmitAnswerItems, collectListenReadSubmitItems } from './mergeSubmitAnswers'

describe('mergeSubmitAnswerItems', () => {
  it('keeps separate rows per prefix instead of merging into one comma string', () => {
    const items = [
      { questionId: 1, prefix: '1', content: 'a' },
      { questionId: 1, prefix: '2', content: 'b' },
      { questionId: 2, prefix: '1', content: 'c' },
    ]
    const merged = mergeSubmitAnswerItems(items)
    expect(merged).toEqual([
      { questionId: 1, prefix: '1', content: 'a', shareWithPrev: false },
      { questionId: 1, prefix: '2', content: 'b', shareWithPrev: false },
      { questionId: 2, prefix: '1', content: 'c', shareWithPrev: false },
    ])
  })

  it('keeps rows with empty content so unanswered slots reach the backend', () => {
    // 未作答的空需要保留并提交，后端据此回传「未作答」并在成绩报告中计数
    const merged = mergeSubmitAnswerItems([
      { questionId: 1, prefix: '1', content: '' },
      { questionId: 1, prefix: '2', content: '   ' },
      { questionId: 2, prefix: '1', content: 'ok' },
    ])
    expect(merged).toHaveLength(3)
    expect(merged[0]).toEqual({ questionId: 1, prefix: '1', content: '', shareWithPrev: false })
    expect(merged[1]).toEqual({ questionId: 1, prefix: '2', content: '', shareWithPrev: false })
    expect(merged[2]).toEqual({ questionId: 2, prefix: '1', content: 'ok', shareWithPrev: false })
  })

  it('drops entries without questionId', () => {
    const merged = mergeSubmitAnswerItems([
      { prefix: '1', content: 'a' },
      { questionId: 3, prefix: '1', content: 'b' },
    ])
    expect(merged).toHaveLength(1)
    expect(merged[0].questionId).toBe(3)
  })

  it('defaults missing prefix to 1', () => {
    const merged = mergeSubmitAnswerItems([{ questionId: 5, content: 'x' }])
    expect(merged[0].prefix).toBe('1')
  })

  it('collectListenReadSubmitItems merges localStorage drafts', () => {
    const key = 'answer-input-99-1'
    localStorage.setItem(key, 'draft-answer')
    const items = collectListenReadSubmitItems(
      [{ questionId: 10, prefix: '1', content: '' }],
      99,
    )
    expect(items).toEqual([{ questionId: 10, prefix: '1', content: 'draft-answer', shareWithPrev: false }])
    localStorage.removeItem(key)
  })

  it('collectListenReadSubmitItems skips unanswered placeholders but keeps empty answers', () => {
    // completedAnswers 初始为 Array(40).fill('') 占位符，应被忽略
    const completed: any[] = Array(4).fill('')
    completed[0] = { questionId: 10, prefix: '1', content: 'a' }
    completed[2] = { questionId: 12, prefix: '1', content: '' }

    const items = collectListenReadSubmitItems(completed, undefined)

    expect(items).toEqual([
      { questionId: 10, content: 'a', prefix: '1', shareWithPrev: false },
      { questionId: 12, content: '', prefix: '1', shareWithPrev: false },
    ])
  })

  it('collectListenReadSubmitItems keeps one row per prefix for multi-slot questions', () => {
    const items = collectListenReadSubmitItems([
      { questionId: 20, prefix: '1', content: 'x' },
      { questionId: 20, prefix: '2', content: '' },
      { questionId: 20, prefix: '3', content: 'z' },
    ])
    expect(items).toHaveLength(3)
    expect(items.map((i) => i.prefix)).toEqual(['1', '2', '3'])
  })

  it('collectListenReadSubmitItems uses contentArray for multi-select questions', () => {
    const items = collectListenReadSubmitItems([
      { questionId: 30, prefix: '1', contentArray: ['A', 'C'] },
    ])
    expect(items).toEqual([{ questionId: 30, contentArray: ['A', 'C'] }])
  })
})
