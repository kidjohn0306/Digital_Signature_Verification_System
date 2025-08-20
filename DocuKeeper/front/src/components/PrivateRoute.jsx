import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { API_BASE } from '../lib/config';
import { http } from '../lib/http';

export default function PrivateRoute({ children }) {
  const [ok, setOk] = useState(null); // null=로딩, true=통과, false=거부

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        // 가벼운 인증 확인용 엔드포인트
        const res = await http(`${API_BASE}/auth/ping`);
        if (!cancel) setOk(res.ok);
      } catch {
        if (!cancel) setOk(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  if (ok === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        인증 확인 중...
      </div>
    );
  }

  if (!ok) return <Navigate to="/login" replace />;

  return children;
}