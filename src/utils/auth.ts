import UserStore from '@/stores/user';

const SESSION_EXPIRED_FLAG = 'sessionExpired';

const LOGIN_PATHS = ['/login', '/register'];

// 登录/注销/注册/字典查询在未登录时也会被调用，它们的 401 不代表登录态失效
const AUTH_EXEMPT_URLS = [
  '/api/user/login',
  '/api/user/logout',
  '/api/student/user/exam/register',
  '/api/student/dict/page',
];

let redirecting = false;

export function isAuthExemptUrl(url?: string): boolean {
  if (!url) return false;
  return AUTH_EXEMPT_URLS.some((item) => url.includes(item));
}

export function isSessionExpiredPayload(data: any): boolean {
  return !!data && typeof data === 'object' && Number(data.code) === 401;
}

export function consumeSessionExpiredFlag(): boolean {
  try {
    const flagged = sessionStorage.getItem(SESSION_EXPIRED_FLAG) === '1';
    if (flagged) sessionStorage.removeItem(SESSION_EXPIRED_FLAG);
    return flagged;
  } catch {
    return false;
  }
}

export function invalidateSession(): void {
  const hadToken = !!UserStore.token;
  UserStore.logout();
  if (!hadToken || LOGIN_PATHS.includes(window.location.pathname)) return;
  try {
    sessionStorage.setItem(SESSION_EXPIRED_FLAG, '1');
  } catch (error) {
    console.warn('[auth] sessionStorage 不可用，无法展示登录过期提示', error);
  }
}

export function handleSessionExpired(): void {
  invalidateSession();
  if (redirecting || LOGIN_PATHS.includes(window.location.pathname)) return;
  redirecting = true;
  window.location.replace('/login');
}
