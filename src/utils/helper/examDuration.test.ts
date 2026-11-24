import {
  EXAM_DURATION_MINUTES,
  getExamDurationMinutes,
  getExamDurationMs,
} from './examDuration';

describe('examDuration', () => {
  it('听力考试时长为 32 分钟', () => {
    expect(EXAM_DURATION_MINUTES.listen).toBe(32);
    expect(getExamDurationMinutes('listen')).toBe(32);
    expect(getExamDurationMs('listen')).toBe(32 * 60 * 1000);
  });

  it('阅读与写作各 60 分钟', () => {
    expect(getExamDurationMinutes('read')).toBe(60);
    expect(getExamDurationMinutes('writte')).toBe(60);
  });

  it('未知模块按阅读时长兜底', () => {
    expect(getExamDurationMinutes('unknown')).toBe(60);
    expect(getExamDurationMinutes('')).toBe(60);
  });
});
