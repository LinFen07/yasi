import {
  getGapGroupKeys,
  getGapGroupCount,
  getQuestionNumberSpan,
  getQuestionSlotCount,
} from './computed';

const gapItem = (extra: Record<string, any> = {}) => ({
  content: '',
  itemUuid: 'uuid',
  prefix: '1',
  score: '1',
  ...extra,
});

describe('getGapGroupKeys', () => {
  it('同 groupGap 的相邻空属于同一组', () => {
    const keys = getGapGroupKeys([
      gapItem({ groupGap: '1' }),
      gapItem({ groupGap: '1' }),
      gapItem({ groupGap: '2' }),
    ]);
    expect(keys).toEqual(['1', '1', '2']);
  });

  it('groupGap 缺失时每个空自成一组（绝不误并组）', () => {
    const keys = getGapGroupKeys([gapItem(), gapItem()]);
    expect(keys).toEqual(['1', '2']);
  });

  it('groupGap 为空串时按缺失处理，不并成一组', () => {
    const keys = getGapGroupKeys([
      gapItem({ groupGap: '' }),
      gapItem({ groupGap: '' }),
    ]);
    expect(keys).toEqual(['1', '2']);
  });

  it('groupGap 为空白字符时按缺失处理', () => {
    const keys = getGapGroupKeys([
      gapItem({ groupGap: '   ' }),
      gapItem({ groupGap: '  ' }),
    ]);
    expect(keys).toEqual(['1', '2']);
  });

  it('兼容旧数据 shareWithPrev：与上一空同组', () => {
    const keys = getGapGroupKeys([
      gapItem(),
      gapItem({ shareWithPrev: true }),
    ]);
    expect(keys).toEqual(['1', '1']);
  });

  it('groupGap 优先于 shareWithPrev', () => {
    const keys = getGapGroupKeys([
      gapItem({ groupGap: '5' }),
      gapItem({ groupGap: '6', shareWithPrev: true }),
    ]);
    expect(keys).toEqual(['5', '6']);
  });
});

describe('getGapGroupCount', () => {
  it('一题多空只占 1 个题号', () => {
    const q: any = {
      questionType: 4,
      items: [gapItem({ groupGap: '1' }), gapItem({ groupGap: '1' })],
    };
    expect(getGapGroupCount(q)).toBe(1);
  });

  it('不同组各占 1 个题号', () => {
    const q: any = {
      questionType: 4,
      items: [gapItem({ groupGap: '1' }), gapItem({ groupGap: '2' })],
    };
    expect(getGapGroupCount(q)).toBe(2);
  });

  it('没有空时为 0', () => {
    expect(getGapGroupCount({ questionType: 4, items: [] } as any)).toBe(0);
  });
});

describe('getQuestionNumberSpan', () => {
  it('双填空题（同组）只占 1 个题号', () => {
    const q: any = {
      questionType: 4,
      items: [gapItem({ groupGap: '1' }), gapItem({ groupGap: '1' })],
    };
    expect(getQuestionNumberSpan(q)).toBe(1);
  });

  it('双填空题没有 groupGap 时退回每空一个题号（不误并组）', () => {
    const q: any = {
      questionType: 4,
      items: [gapItem(), gapItem()],
    };
    expect(getQuestionNumberSpan(q)).toBe(2);
  });

  it('多选题保持既有行为：题号跨度 = 答案个数', () => {
    const q: any = {
      questionType: 2,
      topicType: 2,
      correct: 'A,C',
      correctArray: ['A', 'C'],
      items: [],
    };
    expect(getQuestionNumberSpan(q)).toBe(2);
    expect(getQuestionSlotCount(q)).toBe(2);
  });

  it('单选题占 1 个题号', () => {
    expect(getQuestionNumberSpan({ questionType: 1, items: [] } as any)).toBe(1);
  });

  it('写作题不占题号', () => {
    expect(getQuestionNumberSpan({ questionType: 7, items: [] } as any)).toBe(0);
  });

  it('地图/图表题按行占号', () => {
    const q: any = {
      questionType: 5,
      items: [gapItem(), gapItem(), gapItem()],
    };
    expect(getQuestionNumberSpan(q)).toBe(3);
  });
});
