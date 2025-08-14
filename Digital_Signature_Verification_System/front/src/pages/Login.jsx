import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE } from "../lib/config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // 회원가입 뒤 메시지
  useEffect(() => {
    if (location.state?.flash) {
      setFlash(location.state.flash);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    setFlash("");

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "로그인에 실패했습니다.");

      sessionStorage.setItem("is_admin", String(!!data.is_admin));
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 font-sans min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl p-10">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-8">
          로그인
        </h1>
        <p className="text-center text-gray-600 mb-6">
          문서 진위 확인 시스템에 로그인하세요.
        </p>

        {flash && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            {flash}
          </div>
        )}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring focus:border-indigo-400"
            placeholder="이메일을 입력하세요"
            autoComplete="email"
          />
        </div>

        <div className="mb-8">
          <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring focus:border-indigo-400"
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all duration-200 disabled:bg-gray-400"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <p className="text-center text-gray-600 mt-8">
          계정이 없으신가요?{" "}
          <a href="/signup" className="text-indigo-600 hover:underline font-medium">
            회원가입
          </a>
        </p>
      </div>
    </div>
  );
}