import {
  submitModuleGuarded,
  buildSubmitKey,
  isModuleSubmitted,
  resetModuleSubmitState,
} from './moduleSubmitGuard';

const payload = (id: number) => ({
  answerItems: [],
  doTime: 0,
  id,
  type: 'LISTENING',
});

describe('moduleSubmitGuard', () => {
  let submit: jest.Mock;

  beforeEach(() => {
    submit = jest.fn().mockResolvedValue({ code: 1 });
    resetModuleSubmitState(1, 'listen');
    resetModuleSubmitState(1, 'read');
  });

  it('debounces rapid duplicate calls into a single request', async () => {
    const key = buildSubmitKey(1, 'listen');

    // 模拟同一瞬间的重复触发（手动交卷 + 倒计时自动交卷）
    const p1 = submitModuleGuarded(key, payload(1), submit);
    const p2 = submitModuleGuarded(key, payload(1), submit);
    const p3 = submitModuleGuarded(key, payload(1), submit);

    await Promise.all([p1, p2, p3]);

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('does not submit again after a successful submission', async () => {
    const key = buildSubmitKey(1, 'read');
    await submitModuleGuarded(key, payload(1), submit);

    expect(isModuleSubmitted(1, 'read')).toBe(true);

    // 再次提交应被忽略
    await submitModuleGuarded(key, payload(1), submit);

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('allows retry after a failed submission', async () => {
    const key = buildSubmitKey(1, 'listen');

    submit.mockRejectedValueOnce(new Error('network down'));

    await expect(submitModuleGuarded(key, payload(1), submit)).rejects.toThrow('network down');
    expect(isModuleSubmitted(1, 'listen')).toBe(false);

    // 失败后应允许重新提交
    submit.mockResolvedValueOnce({ code: 1 });
    await submitModuleGuarded(key, payload(1), submit);

    expect(submit).toHaveBeenCalledTimes(2);
    expect(isModuleSubmitted(1, 'listen')).toBe(true);
  });

  it('keeps different modules independent', async () => {
    await Promise.all([
      submitModuleGuarded(buildSubmitKey(1, 'listen'), payload(1), submit),
      submitModuleGuarded(buildSubmitKey(1, 'read'), payload(1), submit),
    ]);

    expect(submit).toHaveBeenCalledTimes(2);
  });

  it('keeps different papers independent', async () => {
    resetModuleSubmitState(2, 'listen');

    await Promise.all([
      submitModuleGuarded(buildSubmitKey(1, 'listen'), payload(1), submit),
      submitModuleGuarded(buildSubmitKey(2, 'listen'), payload(2), submit),
    ]);

    expect(submit).toHaveBeenCalledTimes(2);
  });

  it('resetModuleSubmitState clears the settled flag', async () => {
    const key = buildSubmitKey(1, 'listen');
    await submitModuleGuarded(key, payload(1), submit);
    expect(isModuleSubmitted(1, 'listen')).toBe(true);

    resetModuleSubmitState(1, 'listen');
    expect(isModuleSubmitted(1, 'listen')).toBe(false);

    // 重置后可再次提交
    await submitModuleGuarded(key, payload(1), submit);
    expect(submit).toHaveBeenCalledTimes(2);
  });
});
