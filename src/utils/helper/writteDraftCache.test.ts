import {
  clearWritteDrafts,
  readWritteDraft,
  writeWritteDraft,
} from './writteDraftCache';

describe('writteDraftCache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('按试卷和 Part 独立保存并恢复草稿', () => {
    writeWritteDraft(101, 0, 'part one draft');
    writeWritteDraft(101, 2, 'part three draft');
    writeWritteDraft(202, 0, 'another paper draft');

    expect(readWritteDraft(101, 0)).toBe('part one draft');
    expect(readWritteDraft(101, 1)).toBe('');
    expect(readWritteDraft(101, 2)).toBe('part three draft');
    expect(readWritteDraft(202, 0)).toBe('another paper draft');
  });

  it('清空答案时移除对应草稿', () => {
    writeWritteDraft(101, 1, 'draft to remove');
    expect(readWritteDraft(101, 1)).toBe('draft to remove');

    writeWritteDraft(101, 1, '');
    expect(readWritteDraft(101, 1)).toBe('');
  });

  it('只清除指定试卷的草稿，且可清除全部', () => {
    writeWritteDraft(101, 0, 'a');
    writeWritteDraft(101, 1, 'b');
    writeWritteDraft(202, 0, 'c');

    clearWritteDrafts(101);
    expect(readWritteDraft(101, 0)).toBe('');
    expect(readWritteDraft(101, 1)).toBe('');
    expect(readWritteDraft(202, 0)).toBe('c');

    clearWritteDrafts();
    expect(readWritteDraft(202, 0)).toBe('');
  });
});
