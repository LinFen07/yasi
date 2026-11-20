import { getInstructionStreamUrl } from '@/api/examPaper';

/**
 * 考前听力说明音频预热。
 *
 * 背景：开考同一秒，200 名考生会同时拉取同一份说明音频（~228KB），
 * 瞬时并发 ≈ 45MB，会打满服务器出口管道。该接口响应带 1 小时浏览器缓存，
 * 因此只要在「登录成功后」提前拉一次，后续 1 小时内所有考生都命中缓存，
 * 开考时不再产生并发尖峰。
 *
 * 说明：
 * - 使用 `fetch` + `Range: bytes=0-0` 只取 1 字节探测可用性，
 *   让浏览器把完整资源写入 HTTP 缓存。
 * - 失败静默处理：预热是优化，不是功能，不能影响登录流程。
 * - 同一页面生命周期内只执行一次（模块级标记）。
 */

const PRELOADED_KEY = 'yasi:instruction-audio-preloaded';

let preloadPromise: Promise<void> | null = null;

export function preloadInstructionAudio(): Promise<void> {
  // 已在本次会话预热过，直接返回
  if (preloadPromise) return preloadPromise;

  // 已经成功预热过（同一浏览器标签页内的后续跳转）
  try {
    if (sessionStorage.getItem(PRELOADED_KEY) === '1') {
      preloadPromise = Promise.resolve();
      return preloadPromise;
    }
  } catch (e) {
    // sessionStorage 不可用（隐私模式等）时忽略
  }

  const url = getInstructionStreamUrl();

  preloadPromise = fetch(url, { headers: { Range: 'bytes=0-0' } })
    .then((res) => {
      // 无论 200 还是 206，都认为资源已可用并命中缓存
      if (!res.ok && res.status !== 206) {
        throw new Error(`instruction audio preload failed: ${res.status}`);
      }
      try {
        sessionStorage.setItem(PRELOADED_KEY, '1');
      } catch (e) {
        // 忽略写入失败
      }
    })
    .catch((error) => {
      // 预热失败不阻塞业务：允许下次重试
      preloadPromise = null;
      console.warn('[preload] 听力说明音频预热失败:', error?.message || error);
    });

  return preloadPromise;
}
