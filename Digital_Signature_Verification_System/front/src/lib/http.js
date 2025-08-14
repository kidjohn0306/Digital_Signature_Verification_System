export async function http(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    // 모든 메서드에서 401 시 세션 초기화 + 로그인으로 이동
    try { sessionStorage.clear(); } catch { /* empty */ }
    if (!location.pathname.startsWith('/login')) {
      location.href = '/login';
    }
  }
  return res;
}

export async function httpJson(url, options = {}) {
  const res = await http(url, options);
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    const msg = data?.detail || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}