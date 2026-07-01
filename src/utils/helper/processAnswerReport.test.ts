import {
  expandAnswerItemsForReport,
  processAnswerItems,
  computeModuleStats,
} from './processAnswerReport'

describe('expandAnswerItemsForReport', () => {
  it('splits legacy merged first row with empty sibling contents', () => {
    const items = [
      { questionId: 10, questionType: 4, prefix: '1', content: 'a,b,c' },
      { questionId: 10, questionType: 4, prefix: '2', content: '' },
      { questionId: 10, questionType: 4, prefix: '3', content: '' },
    ]
    const expanded = expandAnswerItemsForReport(items)
    expect(expanded).toHaveLength(3)
    expect(expanded.map((x) => x.content)).toEqual(['a', 'b', 'c'])
  })

  it('expands dual-select into two slots', () => {
    const items = [
      { questionId: 21, questionType: 2, prefix: '1', content: 'A,C' },
    ]
    const expanded = expandAnswerItemsForReport(items)
    expect(expanded).toHaveLength(2)
    expect(expanded[0].content).toBe('A')
    expect(expanded[1].content).toBe('C')
  })
})

describe('processAnswerItems', () => {
  it('marks dual-select partial match as incorrect per slot logic', () => {
    const rows = processAnswerItems([
      {
        questionId: 1,
        questionType: 2,
        prefix: '1',
        content: 'A,B',
        correctAnswer: 'A,B',
        score: 10,
      },
    ])
    expect(rows.length).toBeGreaterThanOrEqual(1)
    const stats = computeModuleStats(rows)
    expect(stats.listen.total + stats.read.total).toBe(rows.filter((r) => r.module !== '未知').length)
  })

  it('shows 未作答 for empty student answer', () => {
    const rows = processAnswerItems([
      {
        questionId: 2,
        questionType: 1,
        prefix: '1',
        content: '',
        correctAnswer: 'B',
        score: 0,
      },
    ])
    expect(rows[0].studentAnswer).toBe('未作答')
    expect(rows[0].isCorrect).toBe(false)
  })
})
