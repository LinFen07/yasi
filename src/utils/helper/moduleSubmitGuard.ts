import type { StudentSubmitAnswer } from '@/typings/exam';

/**
 * 考试模块提交守卫（防抖 + 幂等）。
 *
 * 背景：
 * 1. 同一次「交卷」可能来自多个入口 —— 用户点 Finish Text、倒计时归零自动交卷、
 *    页面跳转时的兜底提交。这些入口如果都各发一次请求，会造成同一模块重复提交，
 *    后端重复判分，也会放大交卷瞬间的服务端并发。
 * 2. 200 名考生在交卷窗口集中提交，需要把瞬时并发摊平。
 *
 * 设计：
 * - 幂等：同一个 `key`（paperId + module）只允许一个 in-flight 请求。
 *   重复调用返回同一个 Promise，不会二次发请求。
 * - 防抖：同一 key 的调用在 `debounceMs` 内被合并为一次（尾沿触发）。
 *   考试提交属于「一次性」动作，合并窗口取较短值（默认 300ms），
 *   只为吸收同一瞬间的重复触发，不实质延迟真实提交。
 * - 失败可重试：失败后清除 in-flight 标记，允许重新提交。
 * - 依赖注入：提交函数由调用方传入，本模块不直接依赖 api 层，
 *   便于单元测试（也避免 api 层把 axios 拖进测试环境）。
 */

/** 同一 key 的合并窗口（毫秒）。用于吸收同一瞬间的重复触发。 */
const DEFAULT_DEBOUNCE_MS = 300;

export type SubmitKey = string;

export type SubmitFn = (payload: StudentSubmitAnswer) => Promise<any>;

interface PendingEntry {
  promise: Promise<any>;
  timer: ReturnType<typeof setTimeout> | null;
  /** 真正发出请求的函数 */
  run: () => Promise<any>;
}

/** key -> in-flight 请求 */
const inflight = new Map<SubmitKey, PendingEntry>();

/** key -> 已成功提交的标记 */
const settled = new Map<SubmitKey, boolean>();

/** 构造模块提交的唯一 key */
export function buildSubmitKey(paperId: number | string, module: string): SubmitKey {
  return `${paperId}:${module}`;
}

/**
 * 判断某模块是否已提交成功
 */
export function isModuleSubmitted(paperId: number | string, module: string): boolean {
  return settled.get(buildSubmitKey(paperId, module)) === true;
}

/**
 * 以防抖 + 幂等方式提交考试模块答案。
 *
 * @param key       提交唯一标识，通常为 `${paperId}:${module}`
 * @param payload   提交体
 * @param submit    实际的提交函数（默认使用 api 层的 judgingProblem）
 * @param options.debounceMs 合并窗口，默认 300ms
 * @param options.onSuccess   成功回调（只在真正发出请求且成功时触发一次）
 * @param options.onError     失败回调
 */
export function submitModuleGuarded(
  key: SubmitKey,
  payload: StudentSubmitAnswer,
  submit: SubmitFn,
  options: {
    debounceMs?: number;
    onSuccess?: (result: any) => void;
    onError?: (error: any) => void;
  } = {},
): Promise<any> {
  const { debounceMs = DEFAULT_DEBOUNCE_MS, onSuccess, onError } = options;

  // 已成功提交过：直接返回，不再发请求
  if (settled.get(key) === true) {
    return Promise.resolve({ skipped: true, reason: 'already-settled' });
  }

  // 已有 in-flight：复用同一个 Promise，并把排期窗口重置（尾沿触发）
  const existing = inflight.get(key);
  if (existing) {
    if (existing.timer) {
      clearTimeout(existing.timer);
      existing.timer = setTimeout(() => {
        void existing.run().catch(() => {});
      }, debounceMs);
    }
    return existing.promise;
  }

  // 首次调用：建立 entry，promise 由 run() 的结果驱动
  let resolveRef: (value: any) => void = () => {};
  let rejectRef: (error: any) => void = () => {};

  const promise = new Promise((resolve, reject) => {
    resolveRef = resolve;
    rejectRef = reject;
  });

  const entry: PendingEntry = {
    promise,
    timer: null,
    run: async () => {
      try {
        const result = await submit(payload);
        settled.set(key, true);
        inflight.delete(key);
        onSuccess?.(result);
        resolveRef(result);
        return result;
      } catch (error) {
        // 失败：清除 in-flight，允许重试
        inflight.delete(key);
        onError?.(error);
        rejectRef(error);
        throw error;
      }
    },
  };

  entry.timer = setTimeout(() => {
    void entry.run().catch(() => {});
  }, debounceMs);

  inflight.set(key, entry);

  return promise;
}

/**
 * 重置某个 key 的提交状态（用于「重考」等需要重新提交的场景）
 */
export function resetModuleSubmitState(paperId: number | string, module: string): void {
  const key = buildSubmitKey(paperId, module);
  const entry = inflight.get(key);
  if (entry?.timer) clearTimeout(entry.timer);
  inflight.delete(key);
  settled.delete(key);
}
